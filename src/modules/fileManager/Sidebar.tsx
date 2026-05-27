import React, { useState } from 'react';
import FileTreeNode from './FileTreeNode';
import { useFileManager } from './FileManagerContext';
import { useModal } from '../shared/ModalContext';

interface SidebarProps {
  onOpenBlogStudio?: () => void;
  onToggleSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenBlogStudio, onToggleSidebar }) => {
  const {
    rootFolder,
    createFile,
    createFolder,
    searchQuery,
    setSearchQuery,
    getSearchResults
  } = useFileManager();
  const { openInputModal, openCreateFileModal } = useModal();
  const [searchFocused, setSearchFocused] = useState(false);

  const handleCreateFile = () => {
    openCreateFileModal({
      defaultFolderId: 'root',
      onConfirm: (fileName, folderId) => {
        createFile(folderId, fileName);
      }
    });
  };

  const handleCreateFolder = () => {
    openInputModal({
      title: '创建新文件夹',
      placeholder: '请输入文件夹名...',
      defaultValue: '新文件夹',
      onConfirm: (folderName) => {
        createFolder('root', folderName);
      }
    });
  };

  return (
    <>
      <style>{`.search-input::placeholder { color: var(--sidebar-text); opacity: 0.4; }`}</style>
      <div
        className="sidebar h-full flex flex-col"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '1px',
            background: `linear-gradient(to bottom, var(--button-primary), #a78bfa, transparent)`,
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />

        <div className="sidebar-header p-3" style={{ position: 'relative' }}>
          <div className="sidebar-title flex items-center justify-between mb-3">
            <h3
              className="flex items-center"
              style={{
                color: 'var(--sidebar-text)',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.03em'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '3px',
                  height: '16px',
                  borderRadius: '2px',
                  background: `linear-gradient(to bottom, var(--button-primary), #a78bfa)`,
                  marginRight: '6px'
                }}
              />
              文件
            </h3>
            <div className="sidebar-actions flex gap-1">
              <button
                className="sidebar-action flex items-center justify-center"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--sidebar-text)',
                  borderRadius: '8px',
                  width: '28px',
                  height: '28px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={handleCreateFile}
                title="新建文件"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9" />
                </svg>
              </button>
              <button
                className="sidebar-action flex items-center justify-center"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--sidebar-text)',
                  borderRadius: '8px',
                  width: '28px',
                  height: '28px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={handleCreateFolder}
                title="新建文件夹"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-7.5-6.75H6.75a2.25 2.25 0 00-2.25 2.25v9.75a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V8.25a2.25 2.25 0 00-2.25-2.25H13.5l-2.25-1.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 13.5v3m1.5-1.5h-3" />
                </svg>
              </button>
            </div>
          </div>

          <div className="search-container relative">
            <input
              type="text"
              placeholder="搜索文件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="search-input w-full px-3 py-2 pl-9 outline-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: searchFocused
                  ? '1px solid rgba(59, 130, 246, 0.4)'
                  : '1px solid var(--sidebar-border)',
                borderRadius: '8px',
                color: 'var(--sidebar-text)',
                boxShadow: searchFocused
                  ? '0 0 0 2px rgba(59, 130, 246, 0.1)'
                  : 'none',
                transition: 'all 0.15s ease'
              }}
            />
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--sidebar-text)', opacity: 0.5, pointerEvents: 'none' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(to right, var(--button-primary), #a78bfa, transparent)`
            }}
          />
        </div>

        <div className="file-tree flex-1 overflow-y-auto py-2" style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '8px',
              background: `linear-gradient(to bottom, var(--sidebar-bg), transparent)`,
              pointerEvents: 'none',
              zIndex: 2
            }}
          />
          {searchQuery ? (
            <div className="search-results px-2">
              <div
                className="text-xs px-2 py-1 mb-1"
                style={{ color: 'var(--sidebar-text)', opacity: 0.7 }}
              >
                搜索结果 ({getSearchResults().length})
              </div>
              {getSearchResults().length > 0 ? (
                getSearchResults().map(file => (
                  <div key={file.id} className="search-result-item">
                    <FileTreeNode node={file} depth={0} parentId="root" />
                  </div>
                ))
              ) : (
                <div
                  className="text-sm px-3 py-2"
                  style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}
                >
                  未找到匹配的文件
                </div>
              )}
            </div>
          ) : (
            <FileTreeNode node={rootFolder} depth={0} />
          )}
        </div>

        {onOpenBlogStudio && (
          <div
            className="px-3 py-2"
            style={{ position: 'relative' }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: `linear-gradient(to right, transparent, #a78bfa, var(--button-primary))`
              }}
            />
            <button
              onClick={onOpenBlogStudio}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '8px',
                color: 'var(--sidebar-text)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '3px',
                  height: '16px',
                  borderRadius: '2px',
                  background: `linear-gradient(to bottom, var(--button-primary), #a78bfa)`,
                  flexShrink: 0
                }}
              />
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ opacity: 0.7, flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span style={{ fontWeight: 500, fontSize: 12 }}>博客工作室</span>
            </button>
          </div>
        )}

        {onToggleSidebar && (
          <div className="px-3 py-2">
            <button
              onClick={onToggleSidebar}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--sidebar-border)',
                borderRadius: '8px',
                color: 'var(--sidebar-text)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                opacity: 0.5,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.5';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 19l-7-7 7-7" />
                <path d="M18 5l-7 7 7 7" />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 500 }}>收起面板</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
