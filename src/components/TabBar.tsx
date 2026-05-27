import React from 'react';
import { useFileManager } from '../modules/fileManager/FileManagerContext';

const TabBar: React.FC = () => {
  const { tabs, switchTab, closeTab, closeAllTabs } = useFileManager();

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      className="tab-bar flex items-center relative"
      style={{
        backgroundColor: 'var(--toolbar-bg)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(to right, var(--button-primary), #a78bfa, #f472b6)',
        }}
      />
      <div className="tabs-container flex items-center flex-1 overflow-x-auto px-2 py-1.5" style={{ gap: 4 }}>
        {tabs.map(tab => {
          const isActive = tab.isActive;
          return (
            <div
              key={tab.id}
              className="tab-item flex items-center gap-2 px-3 py-1.5 cursor-pointer whitespace-nowrap relative"
              style={{
                backgroundColor: isActive ? 'var(--tab-active-bg)' : 'transparent',
                color: isActive ? 'var(--tab-active-text)' : 'var(--tab-text)',
                borderRadius: 8,
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 1px 4px rgba(0, 0, 0, 0.08)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => switchTab(tab.id)}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '20%',
                    right: '20%',
                    height: 2,
                    borderRadius: 1,
                    background: 'linear-gradient(to right, var(--button-primary), #a78bfa, #f472b6)',
                  }}
                />
              )}
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                style={{ flexShrink: 0 }}
              >
                <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <line x1="5.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <line x1="5.5" y1="7.5" x2="10.5" y2="7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <line x1="5.5" y1="10" x2="8.5" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              <span className="text-sm">{tab.name}</span>
              <button
                className="tab-close flex items-center justify-center"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  color: 'var(--tab-text)',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 13,
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--tab-text)';
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                title="关闭标签页"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {tabs.length > 1 && (
        <button
          className="tab-close-all px-3 py-1.5 text-xs"
          style={{
            color: 'var(--tab-text)',
            borderRadius: 6,
            transition: 'all 0.2s ease',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={closeAllTabs}
          title="关闭所有标签页"
        >
          关闭全部
        </button>
      )}
    </div>
  );
};

export default TabBar;
