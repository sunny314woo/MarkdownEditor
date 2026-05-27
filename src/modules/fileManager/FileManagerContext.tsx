import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FileNode, Tab, FileManagerState } from '../../types/fileManager';
import { loadState, saveState, generateId, findNode, updateNodeContent, searchFiles } from './fileManagerUtils';

interface FileManagerContextType extends FileManagerState {
  createFile: (parentId: string, name: string, content?: string) => void;
  createFolder: (parentId: string, name: string) => void;
  renameNode: (id: string, newName: string) => void;
  deleteNode: (id: string) => void;
  toggleFolder: (id: string) => void;
  moveNode: (nodeId: string, targetParentId: string, targetIndex?: number) => boolean;
  isDescendant: (parentId: string, childId: string) => boolean;
  
  openFile: (fileId: string) => void;
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  switchTab: (tabId: string) => void;
  
  updateFileContent: (fileId: string, content: string) => void;
  getActiveFileContent: () => string | null;
  getActiveFileId: () => string | null;
  
  setSearchQuery: (query: string) => void;
  getSearchResults: () => FileNode[];
  
  toggleSidebar: () => void;
}

const FileManagerContext = createContext<FileManagerContextType | undefined>(undefined);

export const FileManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FileManagerState>(() => loadState());

  // 自动保存状态
  useEffect(() => {
    saveState(state);
  }, [state]);

  // 递归更新节点的辅助函数
  const updateNode = useCallback((root: FileNode, id: string, updater: (node: FileNode) => FileNode): FileNode => {
    if (root.id === id) {
      return updater(root);
    }
    
    if (root.children) {
      return {
        ...root,
        children: root.children.map(child => updateNode(child, id, updater)),
      };
    }
    
    return root;
  }, []);

  // 删除节点的辅助函数
  const deleteNodeRecursive = useCallback((root: FileNode, id: string): FileNode => {
    if (root.children) {
      return {
        ...root,
        children: root.children
          .filter(child => child.id !== id)
          .map(child => deleteNodeRecursive(child, id)),
      };
    }
    return root;
  }, []);

  // 向指定父节点添加子节点
  const addChildNode = useCallback((root: FileNode, parentId: string, newNode: FileNode): FileNode => {
    if (root.id === parentId) {
      return {
        ...root,
        children: [...(root.children || []), newNode],
        isExpanded: true,
      };
    }
    
    if (root.children) {
      return {
        ...root,
        children: root.children.map(child => addChildNode(child, parentId, newNode)),
      };
    }
    
    return root;
  }, []);

  // 创建文件
  const createFile = useCallback((parentId: string, name: string, content: string = '') => {
    const newFile: FileNode = {
      id: generateId(),
      name: name.endsWith('.md') ? name : `${name}.md`,
      type: 'file',
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setState(prev => {
      return {
        ...prev,
        rootFolder: addChildNode(prev.rootFolder, parentId, newFile),
      };
    });

    openFile(newFile.id);
  }, [addChildNode]);

  // 创建文件夹
  const createFolder = useCallback((parentId: string, name: string) => {
    const newFolder: FileNode = {
      id: generateId(),
      name,
      type: 'folder',
      children: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isExpanded: true,
    };

    setState(prev => ({
      ...prev,
      rootFolder: addChildNode(prev.rootFolder, parentId, newFolder),
    }));
  }, [addChildNode]);

  // 重命名节点
  const renameNode = useCallback((id: string, newName: string) => {
    setState(prev => {
      const updatedRoot = updateNode(prev.rootFolder, id, node => ({
        ...node,
        name: node.type === 'file' && !newName.endsWith('.md') ? `${newName}.md` : newName,
        updatedAt: Date.now(),
      }));

      const updatedTabs = prev.tabs.map(tab => {
        if (tab.fileId === id) {
          const fileNode = findNode(updatedRoot, id);
          return {
            ...tab,
            name: fileNode?.name || tab.name,
          };
        }
        return tab;
      });

      return {
        ...prev,
        rootFolder: updatedRoot,
        tabs: updatedTabs,
      };
    });
  }, [updateNode]);

  // 删除节点
  const collectFileIds = useCallback((node: FileNode): string[] => {
    const ids: string[] = [];
    if (node.type === 'file') {
      ids.push(node.id);
    }
    if (node.children) {
      for (const child of node.children) {
        ids.push(...collectFileIds(child));
      }
    }
    return ids;
  }, []);

  const deleteNode = useCallback((id: string) => {
    setState(prev => {
      const nodeToDelete = findNode(prev.rootFolder, id);
      const fileIdsToRemove = nodeToDelete
        ? (nodeToDelete.type === 'folder' ? collectFileIds(nodeToDelete) : [id])
        : [id];

      const updatedRoot = deleteNodeRecursive(prev.rootFolder, id);
      
      const updatedTabs = prev.tabs.filter(tab => !fileIdsToRemove.includes(tab.fileId));
      let newActiveTabId = prev.activeTabId;
      
      if (prev.activeTabId) {
        const activeTab = prev.tabs.find(tab => tab.id === prev.activeTabId);
        if (activeTab && fileIdsToRemove.includes(activeTab.fileId)) {
          newActiveTabId = updatedTabs.length > 0 ? updatedTabs[0].id : null;
        }
      }

      return {
        ...prev,
        rootFolder: updatedRoot,
        tabs: updatedTabs.map(tab => ({
          ...tab,
          isActive: tab.id === newActiveTabId,
        })),
        activeTabId: newActiveTabId,
      };
    });
  }, [deleteNodeRecursive, collectFileIds]);

  // 切换文件夹展开/折叠
  const toggleFolder = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      rootFolder: updateNode(prev.rootFolder, id, node => ({
        ...node,
        isExpanded: !node.isExpanded,
      })),
    }));
  }, [updateNode]);

  const isDescendant = useCallback((parentId: string, childId: string): boolean => {
    const findInChildren = (node: FileNode): boolean => {
      if (node.id === childId) return true;
      if (node.children) {
        return node.children.some(child => findInChildren(child));
      }
      return false;
    };
    const parentNode = findNode(state.rootFolder, parentId);
    if (!parentNode || !parentNode.children) return false;
    return parentNode.children.some(child => findInChildren(child));
  }, [state.rootFolder]);

  const findParentId = useCallback((root: FileNode, targetId: string): string | null => {
    if (root.children) {
      for (const child of root.children) {
        if (child.id === targetId) return root.id;
        const found = findParentId(child, targetId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const moveNode = useCallback((nodeId: string, targetParentId: string, targetIndex?: number): boolean => {
    if (nodeId === targetParentId) return false;
    if (isDescendant(nodeId, targetParentId)) return false;

    let movedNode: FileNode | null = null;
    let success = false;

    setState(prev => {
      const nodeToMove = findNode(prev.rootFolder, nodeId);
      if (!nodeToMove) { success = false; return prev; }

      const currentParentId = findParentId(prev.rootFolder, nodeId);
      if (currentParentId === targetParentId && targetIndex === undefined) {
        success = false;
        return prev;
      }

      movedNode = { ...nodeToMove };

      let newRoot = deleteNodeRecursive(prev.rootFolder, nodeId);

      if (targetIndex !== undefined) {
        newRoot = updateNode(newRoot, targetParentId, (parent) => {
          const children = [...(parent.children || [])];
          const insertIdx = Math.min(targetIndex, children.length);
          children.splice(insertIdx, 0, movedNode!);
          return { ...parent, children, isExpanded: true };
        });
      } else {
        newRoot = addChildNode(newRoot, targetParentId, movedNode!);
      }

      success = true;
      return { ...prev, rootFolder: newRoot };
    });

    return success;
  }, [isDescendant, findParentId, deleteNodeRecursive, updateNode, addChildNode]);

  // 打开文件
  const openFile = useCallback((fileId: string) => {
    setState(prev => {
      const existingTab = prev.tabs.find(tab => tab.fileId === fileId);
      
      if (existingTab) {
        return {
          ...prev,
          tabs: prev.tabs.map(tab => ({
            ...tab,
            isActive: tab.id === existingTab.id,
          })),
          activeTabId: existingTab.id,
        };
      }

      const fileNode = findNode(prev.rootFolder, fileId);
      if (!fileNode || fileNode.type !== 'file') return prev;

      const newTab: Tab = {
        id: generateId(),
        fileId,
        name: fileNode.name,
        isActive: true,
      };

      return {
        ...prev,
        tabs: [
          ...prev.tabs.map(tab => ({ ...tab, isActive: false })),
          newTab,
        ],
        activeTabId: newTab.id,
      };
    });
  }, []);

  // 关闭标签页
  const closeTab = useCallback((tabId: string) => {
    setState(prev => {
      const updatedTabs = prev.tabs.filter(tab => tab.id !== tabId);
      let newActiveTabId = prev.activeTabId;
      
      if (prev.activeTabId === tabId && updatedTabs.length > 0) {
        newActiveTabId = updatedTabs[0].id;
      } else if (updatedTabs.length === 0) {
        newActiveTabId = null;
      }

      return {
        ...prev,
        tabs: updatedTabs.map(tab => ({
          ...tab,
          isActive: tab.id === newActiveTabId,
        })),
        activeTabId: newActiveTabId,
      };
    });
  }, []);

  // 关闭所有标签页
  const closeAllTabs = useCallback(() => {
    setState(prev => ({
      ...prev,
      tabs: [],
      activeTabId: null,
    }));
  }, []);

  // 切换标签页
  const switchTab = useCallback((tabId: string) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => ({
        ...tab,
        isActive: tab.id === tabId,
      })),
      activeTabId: tabId,
    }));
  }, []);

  // 更新文件内容（自动保存）
  const updateFileContent = useCallback((fileId: string, content: string) => {
    setState(prev => ({
      ...prev,
      rootFolder: updateNodeContent(prev.rootFolder, fileId, content),
    }));
  }, []);

  // 获取当前活动文件的内容
  const getActiveFileContent = useCallback((): string | null => {
    if (!state.activeTabId) return null;
    
    const activeTab = state.tabs.find(tab => tab.id === state.activeTabId);
    if (!activeTab) return null;
    
    const fileNode = findNode(state.rootFolder, activeTab.fileId);
    return fileNode?.content !== undefined ? fileNode.content : null;
  }, [state]);

  // 获取当前活动文件的 ID
  const getActiveFileId = useCallback((): string | null => {
    if (!state.activeTabId) return null;
    
    const activeTab = state.tabs.find(tab => tab.id === state.activeTabId);
    return activeTab?.fileId || null;
  }, [state]);

  // 设置搜索查询
  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
    }));
  }, []);

  // 获取搜索结果
  const getSearchResults = useCallback((): FileNode[] => {
    if (!state.searchQuery) return [];
    return searchFiles(state.rootFolder, state.searchQuery);
  }, [state]);

  // 切换侧边栏可见性
  const toggleSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      sidebarVisible: !prev.sidebarVisible,
    }));
  }, []);

  const contextValue: FileManagerContextType = {
    ...state,
    createFile,
    createFolder,
    renameNode,
    deleteNode,
    toggleFolder,
    moveNode,
    isDescendant,
    openFile,
    closeTab,
    closeAllTabs,
    switchTab,
    updateFileContent,
    getActiveFileContent,
    getActiveFileId,
    setSearchQuery,
    getSearchResults,
    toggleSidebar,
  };

  return (
    <FileManagerContext.Provider value={contextValue}>
      {children}
    </FileManagerContext.Provider>
  );
};

// Hook 用于使用 FileManagerContext
export function useFileManager(): FileManagerContextType {
  const context = useContext(FileManagerContext);
  if (!context) {
    throw new Error('useFileManager must be used within a FileManagerProvider');
  }
  return context;
}
