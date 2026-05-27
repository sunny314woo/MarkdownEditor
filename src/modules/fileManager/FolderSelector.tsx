import React, { useState, useEffect, useRef } from 'react';
import { FileNode } from '../../types/fileManager';
import { useFileManager } from './FileManagerContext';

interface FolderSelectorProps {
  isOpen: boolean;
  selectedFolderId: string;
  onConfirm: (folderId: string, close: () => void) => void;
  onCancel: () => void;
}

interface FolderItem {
  id: string;
  name: string;
  depth: number;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
  isOpen,
  selectedFolderId,
  onConfirm,
  onCancel
}) => {
  const { rootFolder } = useFileManager();
  
  // 直接用 useState 管理选择状态
  const [selectedId, setSelectedId] = useState<string>(selectedFolderId);
  const isFirstRender = useRef(true);

  // 简单的生成文件夹树
  const getFolderTree = (node: FileNode, depth: number = 0): FolderItem[] => {
    let items: FolderItem[] = [];
    
    if (node.type === 'folder') {
      items.push({ id: node.id, name: node.name, depth });
      
      if (node.children) {
        for (const child of node.children) {
          if (child.type === 'folder') {
            items = [...items, ...getFolderTree(child, depth + 1)];
          }
        }
      }
    }
    
    return items;
  };

  const folders = getFolderTree(rootFolder);

  // 只在第一次打开时初始化，并且确保选中第一个文件夹（如果有）
  useEffect(() => {
    if (isOpen && isFirstRender.current) {
      if (folders.length > 0) {
        const firstFolderId = folders[0].id;
        setSelectedId(firstFolderId);
      } else {
        setSelectedId(selectedFolderId);
      }
      isFirstRender.current = false;
    }
    if (!isOpen) {
      isFirstRender.current = true;
    }
  }, [isOpen]);

  const handleSelect = (folderId: string, _folderName: string) => {
    setSelectedId(folderId);
  };

  const handleConfirmClick = () => {
    onConfirm(selectedId, onCancel);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onCancel}
    >
      <div 
        className="relative rounded-lg shadow-lg p-6 w-full max-w-md"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          border: '1px solid var(--sidebar-border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--app-text)' }}
        >
          选择目标文件夹
        </h2>
        
        <div 
          className="border rounded-lg p-2 mb-4 max-h-80 overflow-y-auto"
          style={{
            borderColor: 'var(--sidebar-border)',
            backgroundColor: 'var(--editor-bg)'
          }}
        >
          {folders.length > 0 ? (
            folders.map(folder => (
              <div
                key={folder.id}
                className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors"
                style={{
                  paddingLeft: `${16 + folder.depth * 16}px`,
                  backgroundColor: selectedId === folder.id 
                    ? 'rgba(59, 130, 246, 0.2)' 
                    : 'transparent',
                  color: 'var(--sidebar-text)',
                  border: selectedId === folder.id ? '2px solid rgba(59,130,246,0.5)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedId !== folder.id) {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedId !== folder.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onClick={() => {
                  handleSelect(folder.id, folder.name);
                }}
              >
                <span className="text-sm">📁</span>
                <span className="text-sm truncate">{folder.name}</span>
                {selectedId === folder.id && <span className="text-xs text-blue-500 ml-auto">✓</span>}
              </div>
            ))
          ) : (
            <div 
              className="text-sm text-center py-8"
              style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}
            >
              没有可用的文件夹
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded transition-colors"
            style={{
              backgroundColor: 'rgba(128, 128, 128, 0.3)',
              color: 'var(--app-text)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.3)';
            }}
          >
            取消
          </button>
          <button
            onClick={handleConfirmClick}
            className="px-4 py-2 rounded transition-colors"
            style={{
              backgroundColor: 'var(--button-primary)',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--button-primary)';
            }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderSelector;
