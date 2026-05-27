import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FileNode } from '../../types/fileManager';
import { useFileManager } from '../fileManager/FileManagerContext';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  fileId: string;
  fileName: string;
  filePath: string;
  matches: LineMatch[];
}

interface LineMatch {
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

const CONTEXT_CHARS = 40;
const MAX_RESULTS_PER_FILE = 5;
const MAX_TOTAL_RESULTS = 50;

function collectAllFiles(node: FileNode, parentPath: string = ''): { id: string; name: string; path: string; content: string }[] {
  const results: { id: string; name: string; path: string; content: string }[] = [];
  const currentPath = parentPath ? `${parentPath} / ${node.name}` : node.name;

  if (node.type === 'file' && node.content) {
    results.push({ id: node.id, name: node.name, path: currentPath, content: node.content });
  }

  if (node.children) {
    for (const child of node.children) {
      results.push(...collectAllFiles(child, node.id === 'root' ? '' : currentPath));
    }
  }

  return results;
}

function searchInContent(query: string, content: string): LineMatch[] {
  const lines = content.split('\n');
  const matches: LineMatch[] = [];
  const q = query.toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const idx = line.indexOf(q);
    if (idx !== -1) {
      matches.push({
        lineNumber: i + 1,
        lineContent: lines[i],
        matchStart: idx,
        matchEnd: idx + query.length,
      });
      if (matches.length >= MAX_RESULTS_PER_FILE) break;
    }
  }

  return matches;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const { rootFolder, openFile } = useFileManager();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allFiles = useMemo(() => collectAllFiles(rootFolder), [rootFolder]);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchResults: SearchResult[] = [];
    let totalMatchCount = 0;

    for (const file of allFiles) {
      if (totalMatchCount >= MAX_TOTAL_RESULTS) break;

      const matches = searchInContent(query, file.content);
      if (matches.length > 0) {
        searchResults.push({
          fileId: file.id,
          fileName: file.name,
          filePath: file.path || file.name,
          matches,
        });
        totalMatchCount += matches.length;
      }
    }

    setTotalMatches(totalMatchCount);
    return searchResults;
  }, [query, allFiles]);

  const flatItems = useMemo(() => {
    const items: { fileId: string; match: LineMatch; fileName: string; filePath: string; isLast: boolean }[] = [];
    for (const result of results) {
      result.matches.forEach((match, idx) => {
        items.push({
          fileId: result.fileId,
          match,
          fileName: result.fileName,
          filePath: result.filePath,
          isLast: idx === result.matches.length - 1,
        });
      });
    }
    return items;
  }, [results]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.children[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback((fileId: string) => {
    openFile(fileId);
    onClose();
  }, [openFile, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, flatItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          handleSelect(flatItems[selectedIndex].fileId);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [flatItems, selectedIndex, handleSelect, onClose]);

  const highlightMatch = (text: string, start: number, end: number) => {
    const before = text.substring(0, start);
    const match = text.substring(start, end);
    const after = text.substring(end);

    let truncatedBefore = before;
    if (before.length > CONTEXT_CHARS) {
      truncatedBefore = '...' + before.substring(before.length - CONTEXT_CHARS);
    }

    let truncatedAfter = after;
    if (after.length > CONTEXT_CHARS) {
      truncatedAfter = after.substring(0, CONTEXT_CHARS) + '...';
    }

    return (
      <>
        <span style={{ opacity: 0.5 }}>{truncatedBefore}</span>
        <span style={{ color: 'var(--link-color)', fontWeight: 600, backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: '2px', padding: '0 1px' }}>
          {match}
        </span>
        <span style={{ opacity: 0.5 }}>{truncatedAfter}</span>
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', animation: 'fadeIn 0.1s ease-out' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-lg shadow-2xl overflow-hidden flex flex-col"
        style={{
          maxWidth: '600px',
          maxHeight: '70vh',
          backgroundColor: 'var(--sidebar-bg)',
          border: '1px solid var(--sidebar-border)',
          animation: 'scaleIn 0.12s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-3 border-b flex-shrink-0" style={{ borderColor: 'var(--sidebar-border)' }}>
          <span style={{ color: 'var(--sidebar-text)', opacity: 0.5, fontSize: '14px', marginRight: '8px' }}>
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="在所有文件中搜索... (Ctrl+Shift+F)"
            className="flex-1 py-3 bg-transparent outline-none quick-open-input"
            style={{
              color: 'var(--app-text)',
              fontSize: '14px',
              border: 'none',
            }}
          />
          {query.trim() && (
            <span
              className="px-2 py-0.5 rounded text-xs flex-shrink-0"
              style={{
                backgroundColor: 'rgba(128, 128, 128, 0.15)',
                color: 'var(--sidebar-text)',
                opacity: 0.6,
                fontSize: '11px',
              }}
            >
              {totalMatches} 个匹配
            </span>
          )}
          <span
            className="px-1.5 py-0.5 rounded text-xs ml-2 flex-shrink-0"
            style={{
              backgroundColor: 'rgba(128, 128, 128, 0.15)',
              color: 'var(--sidebar-text)',
              opacity: 0.6,
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
          >
            Esc
          </span>
        </div>

        <div
          ref={listRef}
          className="overflow-y-auto py-1 flex-1"
          style={{ scrollbarWidth: 'thin' }}
        >
          {query.trim() && results.length === 0 && (
            <div
              className="px-4 py-8 text-center"
              style={{ color: 'var(--sidebar-text)', opacity: 0.5, fontSize: '13px' }}
            >
              未找到匹配的内容
            </div>
          )}

          {!query.trim() && (
            <div
              className="px-4 py-8 text-center"
              style={{ color: 'var(--sidebar-text)', opacity: 0.4, fontSize: '13px' }}
            >
              输入关键词搜索所有文件内容
            </div>
          )}

          {results.map((result) => (
            <div key={result.fileId}>
              <div
                className="px-3 py-1.5 flex items-center gap-2"
                style={{ borderTop: '1px solid var(--sidebar-border)' }}
              >
                <span className="text-xs">📄</span>
                <span style={{ color: 'var(--app-text)', fontSize: '12px', fontWeight: 600 }}>
                  {result.fileName}
                </span>
                <span style={{ color: 'var(--sidebar-text)', opacity: 0.4, fontSize: '11px' }}>
                  {result.filePath}
                </span>
                <span
                  className="ml-auto px-1.5 py-0.5 rounded text-xs flex-shrink-0"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--link-color)',
                    fontSize: '10px',
                  }}
                >
                  {result.matches.length} 处匹配
                </span>
              </div>

              {result.matches.map((match) => {
                const flatIdx = flatItems.findIndex(
                  f => f.fileId === result.fileId && f.match.lineNumber === match.lineNumber
                );

                return (
                  <div
                    key={`${result.fileId}-${match.lineNumber}`}
                    className="px-3 py-1.5 cursor-pointer mx-1 rounded"
                    style={{
                      backgroundColor: flatIdx === selectedIndex ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      paddingLeft: `${24 + 12}px`,
                    }}
                    onMouseEnter={() => setSelectedIndex(flatIdx)}
                    onClick={() => handleSelect(result.fileId)}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="flex-shrink-0 text-xs mt-0.5"
                        style={{ color: 'var(--sidebar-text)', opacity: 0.4, fontFamily: 'monospace', minWidth: '24px', textAlign: 'right' }}
                      >
                        {match.lineNumber}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: 'var(--sidebar-text)', lineHeight: '1.5', wordBreak: 'break-all' }}
                      >
                        {highlightMatch(match.lineContent, match.matchStart, match.matchEnd)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-between px-3 py-2 border-t text-xs flex-shrink-0"
          style={{
            borderColor: 'var(--sidebar-border)',
            color: 'var(--sidebar-text)',
            opacity: 0.4,
          }}
        >
          <div className="flex items-center gap-3">
            <span>↑↓ 导航</span>
            <span>↵ 打开文件</span>
            <span>Esc 关闭</span>
          </div>
          <span>{allFiles.length} 个文件</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
