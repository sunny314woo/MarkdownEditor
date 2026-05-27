import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileNode } from '../../types/fileManager';
import { useFileManager } from './FileManagerContext';
import { useModal } from '../shared/ModalContext';

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
  parentId?: string;
}

type DropPosition = 'before' | 'inside' | 'after';

const DRAG_DATA_KEY = 'application/x-file-node-id';

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, depth, parentId }) => {
  const {
    toggleFolder,
    openFile,
    createFile,
    createFolder,
    renameNode,
    deleteNode,
    moveNode,
    isDescendant,
    tabs,
  } = useFileManager();
  const { openInputModal, openCreateFileModal } = useModal();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverValid, setDragOverValid] = useState(true);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  const isFileOpen = node.type === 'file' && tabs.some(tab => tab.fileId === node.id);
  const isVirtualRoot = node.id === 'root';

  const updateMenuPosition = useCallback(() => {
    if (!menuButtonRef.current) return;
    const rect = menuButtonRef.current.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = node.type === 'folder' ? 180 : 100;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.right - menuWidth;
    let top = rect.bottom + 4;

    if (left < 8) left = 8;
    if (left + menuWidth > viewportWidth - 8) left = viewportWidth - menuWidth - 8;
    if (top + menuHeight > viewportHeight - 8) top = rect.top - menuHeight - 4;
    if (top < 8) top = 8;

    setMenuPosition({ top, left });
  }, [node.type]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDeleteConfirm) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current && !menuButtonRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDeleteConfirm]);

  const handleDoubleClick = () => {
    if (node.type === 'file') {
      openFile(node.id);
    } else {
      toggleFolder(node.id);
    }
  };

  const handleFolderToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFolder(node.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateMenuPosition();
    setShowMenu(true);
  };

  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showMenu) {
      updateMenuPosition();
    }
    setShowMenu(!showMenu);
  };

  const handleCreateFile = () => {
    const parentId = node.type === 'folder' ? node.id : 'root';
    setShowMenu(false);

    openCreateFileModal({
      defaultFolderId: parentId,
      onConfirm: (fileName, folderId) => {
        createFile(folderId, fileName);
      }
    });
  };

  const handleCreateFolder = () => {
    const parentId = node.type === 'folder' ? node.id : 'root';
    setShowMenu(false);

    openInputModal({
      title: '创建新文件夹',
      placeholder: '请输入文件夹名...',
      defaultValue: '新文件夹',
      onConfirm: (folderName) => {
        createFolder(parentId, folderName);
      }
    });
  };

  const handleRename = () => {
    setShowMenu(false);

    openInputModal({
      title: '重命名',
      placeholder: '请输入新名称...',
      defaultValue: node.name,
      onConfirm: (newName) => {
        renameNode(node.id, newName.trim());
      }
    });
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    deleteNode(node.id);
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const renderIcon = () => {
    if (node.type === 'folder') {
      if (node.isExpanded) {
        return (
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--button-primary)', opacity: 0.8 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
        );
      }
      return (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      );
    }
    return (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    );
  };

  const sortedChildren = node.children
    ? [...node.children].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return 0;
    })
    : [];

  const computeDropPosition = (e: React.DragEvent): DropPosition => {
    if (!itemRef.current) return 'inside';
    const rect = itemRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    if (node.type === 'folder') {
      if (y < height * 0.25) return 'before';
      if (y > height * 0.75) return 'after';
      return 'inside';
    } else {
      if (y < height * 0.5) return 'before';
      return 'after';
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_DATA_KEY, node.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDropPosition(null);
    setDragOverValid(true);
    dragCounterRef.current = 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const dragNodeId = e.dataTransfer.types.includes(DRAG_DATA_KEY) ? 'has-data' : null;
    if (!dragNodeId) return;

    const pos = computeDropPosition(e);
    setDropPosition(pos);
    setDragOverValid(true);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;

    const pos = computeDropPosition(e);
    setDropPosition(pos);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDropPosition(null);
      setDragOverValid(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const dragNodeId = e.dataTransfer.getData(DRAG_DATA_KEY);
    if (!dragNodeId) return;

    setDropPosition(null);
    dragCounterRef.current = 0;

    if (dragNodeId === node.id) return;

    const pos = computeDropPosition(e);

    if (pos === 'inside') {
      if (node.type !== 'folder') return;
      if (isDescendant(dragNodeId, node.id)) {
        setDragOverValid(false);
        return;
      }
      moveNode(dragNodeId, node.id);
    } else {
      if (isDescendant(dragNodeId, node.id)) {
        setDragOverValid(false);
        return;
      }

      const targetParentId = parentId || 'root';

      if (pos === 'before') {
        moveNode(dragNodeId, targetParentId, 0);
      } else {
        moveNode(dragNodeId, targetParentId);
      }
    }
  };

  if (isVirtualRoot) {
    return (
      <div className="file-tree-root">
        {sortedChildren.map(child => (
          <FileTreeNode key={child.id} node={child} depth={0} parentId="root" />
        ))}
      </div>
    );
  }

  const indent = depth * 20;

  const getDropIndicatorStyle = (): React.CSSProperties => {
    if (!dropPosition || !dragOverValid) return { display: 'none' };

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${indent + 8}px`,
      right: '8px',
      height: '2px',
      backgroundColor: 'var(--link-color)',
      borderRadius: '1px',
      pointerEvents: 'none',
      zIndex: 10,
    };

    if (dropPosition === 'before') {
      return { ...baseStyle, top: '-1px' };
    } else if (dropPosition === 'after') {
      return { ...baseStyle, bottom: '-1px' };
    }
    return { display: 'none' };
  };

  const getItemBackground = () => {
    if (dropPosition === 'inside' && dragOverValid && node.type === 'folder') {
      return 'rgba(59, 130, 246, 0.15)';
    }
    if (isFileOpen) return 'rgba(59, 130, 246, 0.08)';
    return 'transparent';
  };

  return (
    <div
      className="file-tree-node"
      style={{ opacity: isDragging ? 0.4 : 1, transition: 'opacity 0.15s ease' }}
    >
      <div
        ref={itemRef}
        className="file-tree-item flex items-center cursor-pointer transition-colors group"
        style={{
          paddingLeft: `${indent + 8}px`,
          paddingRight: '8px',
          paddingTop: '4px',
          paddingBottom: '4px',
          backgroundColor: getItemBackground(),
          position: 'relative',
          outline: (dropPosition === 'inside' && dragOverValid && node.type === 'folder')
            ? '2px solid rgba(59, 130, 246, 0.4)'
            : 'none',
          outlineOffset: '-2px',
          borderRadius: '6px',
        }}
        onMouseEnter={(e) => {
          setIsHovered(true);
          if (!isFileOpen && !(dropPosition === 'inside' && dragOverValid)) {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.06)';
          }
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          if (!isFileOpen && !(dropPosition === 'inside' && dragOverValid)) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        onClick={() => node.type === 'file' && openFile(node.id)}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        draggable={!isVirtualRoot}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {(dropPosition === 'before' || dropPosition === 'after') && dragOverValid && (
          <div style={getDropIndicatorStyle()} />
        )}

        {isFileOpen && (
          <div style={{
            position: 'absolute',
            left: `${indent + 2}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '2px',
            height: '14px',
            borderRadius: '1px',
            background: 'linear-gradient(to bottom, var(--button-primary), #a78bfa)',
          }} />
        )}

        {node.type === 'folder' && (
          <span
            className="folder-toggle cursor-pointer flex-shrink-0 mr-1"
            style={{ width: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sidebar-text)', opacity: 0.5 }}
            onClick={handleFolderToggle}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="currentColor"
              style={{
                transition: 'transform 0.2s ease',
                transform: node.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              <path d="M3 1L7 5L3 9z" />
            </svg>
          </span>
        )}
        {node.type === 'file' && (
          <span className="flex-shrink-0 mr-1" style={{ width: '14px' }} />
        )}

        <span className="file-icon flex-shrink-0 mr-1.5">{renderIcon()}</span>

        <span
          className="file-name flex-1 truncate"
          style={{
            fontSize: '13px',
            color: 'var(--sidebar-text)',
            fontWeight: isFileOpen ? 500 : 400,
          }}
        >
          {node.name}
        </span>

        <button
          ref={menuButtonRef}
          onClick={handleMenuButtonClick}
          className="flex-shrink-0 ml-1 p-0.5 rounded transition-all duration-150"
          style={{
            opacity: isHovered || showMenu ? 0.7 : 0,
            color: 'var(--sidebar-text)',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = isHovered || showMenu ? '0.7' : '0';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="7" cy="3" r="1.2" />
            <circle cx="7" cy="7" r="1.2" />
            <circle cx="7" cy="11" r="1.2" />
          </svg>
        </button>
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] py-1"
          style={{
            left: menuPosition.left,
            top: menuPosition.top,
            backgroundColor: 'var(--sidebar-bg)',
            border: '1px solid var(--sidebar-border)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            animation: 'fadeIn 0.12s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {node.type === 'folder' && (
            <>
              <div
                className="context-menu-item cursor-pointer transition-colors flex items-center gap-2"
                style={{
                  color: 'var(--sidebar-text)',
                  fontSize: '13px',
                  padding: '6px 12px',
                  margin: '0 4px',
                  borderRadius: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={handleCreateFile}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--sidebar-text)', opacity: 0.6, flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9" />
                </svg>
                新建文件
              </div>
              <div
                className="context-menu-item cursor-pointer transition-colors flex items-center gap-2"
                style={{
                  color: 'var(--sidebar-text)',
                  fontSize: '13px',
                  padding: '6px 12px',
                  margin: '0 4px',
                  borderRadius: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={handleCreateFolder}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--sidebar-text)', opacity: 0.6, flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9" />
                </svg>
                新建文件夹
              </div>
              <div style={{
                height: '1px',
                margin: '4px 8px',
                background: 'linear-gradient(to right, transparent, var(--sidebar-border), transparent)',
              }} />
            </>
          )}
          <div
            className="context-menu-item cursor-pointer transition-colors flex items-center gap-2"
            style={{
              color: 'var(--sidebar-text)',
              fontSize: '13px',
              padding: '6px 12px',
              margin: '0 4px',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={handleRename}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--sidebar-text)', opacity: 0.6, flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            重命名
          </div>
          <div
            className="context-menu-item cursor-pointer transition-colors flex items-center gap-2"
            style={{
              color: '#ef4444',
              fontSize: '13px',
              padding: '6px 12px',
              margin: '0 4px',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={handleDeleteClick}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#ef4444', opacity: 0.6, flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            删除
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.15s ease-out',
          }}
          onClick={handleDeleteCancel}
        >
          <div
            className="relative p-6 w-full max-w-sm mx-4"
            style={{
              backgroundColor: 'var(--sidebar-bg)',
              border: '1px solid var(--sidebar-border)',
              borderRadius: '16px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
              animation: 'scaleIn 0.15s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h3
                className="text-lg font-semibold"
                style={{ color: 'var(--app-text)' }}
              >
                确认删除
              </h3>
            </div>
            <p
              className="mb-6"
              style={{ color: 'var(--sidebar-text)', fontSize: '14px' }}
            >
              确定要删除「{node.name}」吗？
              {node.type === 'folder' && (
                <span style={{ color: '#ef4444', display: 'block', marginTop: '4px', fontSize: '13px' }}>
                  该文件夹下的所有文件和子文件夹都将被删除。
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 transition-colors"
                style={{
                  backgroundColor: 'rgba(128, 128, 128, 0.2)',
                  color: 'var(--app-text)',
                  fontSize: '14px',
                  borderRadius: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.2)';
                }}
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 transition-colors"
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '14px',
                  borderRadius: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {node.type === 'folder' && node.isExpanded && sortedChildren.length > 0 && (
        <div className="file-tree-children">
          {sortedChildren.map(child => (
            <FileTreeNode key={child.id} node={child} depth={depth + 1} parentId={node.id} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTreeNode;
