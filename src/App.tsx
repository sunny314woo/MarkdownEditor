import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import 'katex/dist/katex.min.css';
import MarkdownEditor from './modules/markdownEditor/MarkdownEditor';
import Sidebar from './modules/fileManager/Sidebar';
import TabBar from './components/TabBar';
import InputModal from './modules/shared/InputModal';
import CreateFileModal from './modules/fileManager/CreateFileModal';
import QuickOpen from './modules/shared/QuickOpen';
import GlobalSearch from './modules/shared/GlobalSearch';
import BlogStudio from './modules/blog/BlogStudio';
import WelcomePage from './components/WelcomePage';
import { useTheme } from './modules/settings/ThemeContext';
import { FileManagerProvider, useFileManager } from './modules/fileManager/FileManagerContext';
import { ModalProvider, useModal } from './modules/shared/ModalContext';
import { UndoRedoProvider, useUndoRedo } from './modules/editor/UndoRedoContext';
import { textFromStorage, textToStorage } from './modules/shared/imageStore';
import { findNode } from './modules/fileManager/fileManagerUtils';
import { FileNode } from './types/fileManager';
import 'highlight.js/styles/github-dark.css';

const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { 
    getActiveFileContent, 
    getActiveFileId, 
    updateFileContent, 
    sidebarVisible, 
    toggleSidebar,
    tabs,
    createFile,
    rootFolder,
  } = useFileManager();
  const undoRedo = useUndoRedo();
  const { 
    modalState, 
    closeModal, 
    handleInputConfirm, 
    handleCreateFileConfirm,
    openCreateFileModal,
  } = useModal();
  
  const activeContent = getActiveFileContent();
  const activeFileId = getActiveFileId();
  const [localContent, setLocalContent] = useState<string>(() => textFromStorage(activeContent ?? ''));
  
  const debouncedUpdateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    setLocalContent(textFromStorage(activeContent ?? ''));
  }, [activeFileId, activeContent]);

  const [showOutline, setShowOutline] = useState<boolean>(() => {
    const saved = localStorage.getItem('outline-visibility');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showPreview, setShowPreview] = useState<boolean>(() => {
    const saved = localStorage.getItem('preview-visibility');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showQuickOpen, setShowQuickOpen] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showBlogStudio, setShowBlogStudio] = useState(false);

  const collectAllMdFiles = useCallback((node: FileNode): Array<{ name: string; content: string }> => {
    const results: Array<{ name: string; content: string }> = []
    const traverse = (n: FileNode) => {
      if (n.type === 'file' && n.name.endsWith('.md')) {
        results.push({ name: n.name, content: n.content || '' })
      }
      if (n.children) {
        n.children.forEach(traverse)
      }
    }
    traverse(node)
    return results
  }, [])

  const blogCurrentFile = useMemo(() => {
    if (activeFileId) {
      const node = findNode(rootFolder, activeFileId)
      if (node && node.type === 'file') {
        return [{ name: node.name, content: localContent }]
      }
    }
    return collectAllMdFiles(rootFolder)
  }, [rootFolder, activeFileId, localContent, collectAllMdFiles])
  const [focusMode, setFocusMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('focus-mode');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [typewriterMode, setTypewriterMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('typewriter-mode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const savedSidebarRef = useRef(sidebarVisible);
  const savedOutlineRef = useRef(showOutline);
  const savedPreviewRef = useRef(showPreview);

  const toggleOutline = useCallback(() => {
    setShowOutline(prev => {
      const next = !prev;
      localStorage.setItem('outline-visibility', JSON.stringify(next));
      return next;
    });
  }, []);

  const togglePreview = useCallback(() => {
    setShowPreview(prev => {
      const next = !prev;
      localStorage.setItem('preview-visibility', JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => {
      const next = !prev;
      localStorage.setItem('focus-mode', JSON.stringify(next));
      if (next) {
        savedSidebarRef.current = sidebarVisible;
        savedOutlineRef.current = showOutline;
        savedPreviewRef.current = showPreview;
      } else {
        if (savedSidebarRef.current) toggleSidebar();
        if (savedOutlineRef.current) {
          setShowOutline(savedOutlineRef.current);
          localStorage.setItem('outline-visibility', JSON.stringify(true));
        }
        if (savedPreviewRef.current) {
          setShowPreview(savedPreviewRef.current);
          localStorage.setItem('preview-visibility', JSON.stringify(true));
        }
      }
      return next;
    });
  }, [sidebarVisible, showOutline, showPreview, toggleSidebar]);

  const toggleTypewriterMode = useCallback(() => {
    setTypewriterMode(prev => {
      const next = !prev;
      localStorage.setItem('typewriter-mode', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleChange = useCallback((value: string) => {
    const convertedValue = textFromStorage(value);
    setLocalContent(convertedValue);
    
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }
    
    if (activeFileId) {
      debouncedUpdateRef.current = setTimeout(() => {
        updateFileContent(activeFileId, textToStorage(convertedValue));
      }, 500);
    }
  }, [activeFileId, updateFileContent]);

  const handlePreviewContentChange = useCallback((newMarkdown: string) => {
    const convertedMarkdown = textFromStorage(newMarkdown);
    
    if (convertedMarkdown && convertedMarkdown !== localContent && activeFileId) {
      undoRedo.pushHistory(activeFileId, convertedMarkdown, 0, 0, 'preview-edit');
      setLocalContent(convertedMarkdown);
      updateFileContent(activeFileId, textToStorage(convertedMarkdown));
    }
  }, [localContent, activeFileId, updateFileContent, undoRedo]);

  const handleDeleteImage = useCallback((imageIndex: number) => {
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    let match
    let currentIndex = 0

    while ((match = imgRegex.exec(localContent)) !== null) {
      if (currentIndex === imageIndex) {
        const startPos = match.index
        const endPos = match.index + match[0].length
        let newContent = localContent.substring(0, startPos) + localContent.substring(endPos)
        newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n')
        if (activeFileId) {
          undoRedo.pushHistory(activeFileId, newContent, 0, 0, 'delete-image')
        }
        handleChange(newContent)
        return
      }
      currentIndex++
    }
  }, [localContent, handleChange, activeFileId, undoRedo]);

  useEffect(() => {
    return () => {
      if (debouncedUpdateRef.current) clearTimeout(debouncedUpdateRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !e.shiftKey) {
        e.preventDefault();
        setShowQuickOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTypewriterMode();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleTypewriterMode]);

  const handleCreateFileWithSelect = useCallback(() => {
    openCreateFileModal({
      defaultFolderId: 'root',
      onConfirm: (fileName, folderId) => {
        createFile(folderId, fileName);
      }
    });
  }, [openCreateFileModal, createFile]);

  const effectiveSidebarVisible = focusMode ? false : sidebarVisible;
  const effectiveShowOutline = focusMode ? false : showOutline;

  const handleAnchorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a') as HTMLAnchorElement;
    if (link && link.getAttribute('href')?.startsWith('#')) {
      e.preventDefault();
      e.stopPropagation();
      const href = link.getAttribute('href') || '';
      const targetId = href.slice(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  return (
    <div 
      className={`flex h-screen w-screen ${focusMode ? 'focus-mode' : ''}`}
      style={{ backgroundColor: 'var(--app-bg)' }}
      onClick={handleAnchorClick}
    >
      {effectiveSidebarVisible && (
        <div 
          className="w-64 flex-shrink-0 border-r"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <Sidebar onOpenBlogStudio={() => setShowBlogStudio(true)} onToggleSidebar={toggleSidebar} />
        </div>
      )}
      
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {!focusMode && tabs.length > 0 && <TabBar />}
        
        <div className="flex-1 overflow-hidden min-h-0">
          {tabs.length > 0 ? (
            <MarkdownEditor
              value={localContent}
              onChange={handleChange}
              fileId={activeFileId}
              theme={theme}
              onToggleTheme={toggleTheme}
              showPreview={showPreview}
              showOutline={showOutline}
              focusMode={focusMode}
              typewriterMode={typewriterMode}
              onTogglePreview={togglePreview}
              onToggleFocusMode={toggleFocusMode}
              onToggleTypewriterMode={toggleTypewriterMode}
              onPreviewContentChange={handlePreviewContentChange}
              onDeleteImage={handleDeleteImage}
            />
          ) : (
            <WelcomePage
              onCreateFile={handleCreateFileWithSelect}
              onOpenBlogStudio={() => setShowBlogStudio(true)}
              onToggleSidebar={toggleSidebar}
              onToggleTheme={toggleTheme}
              sidebarVisible={sidebarVisible}
              isDark={theme === 'dark'}
            />
          )}
        </div>
      </div>
      
      <div className="fixed inset-0 pointer-events-none z-40">
        {!focusMode && tabs.length > 0 && (
          <button
            onClick={toggleOutline}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 flex items-center justify-center rounded-l-md pointer-events-auto transition-all duration-300"
            style={{
              right: effectiveShowOutline ? '200px' : '0',
              backgroundColor: 'var(--sidebar-bg)',
              border: '1px solid var(--sidebar-border)',
              color: 'var(--sidebar-text)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sidebar-bg)';
            }}
            title={showOutline ? 'Hide outline' : 'Show outline'}
          >
            <span className="text-xs">{showOutline ? '▶' : '◀'}</span>
          </button>
        )}
      </div>
      
      <InputModal
        isOpen={modalState.isOpen && modalState.type === 'input'}
        title={modalState.title}
        placeholder={modalState.placeholder}
        defaultValue={modalState.defaultValue}
        onConfirm={handleInputConfirm}
        onCancel={closeModal}
      />
      
      <CreateFileModal
        isOpen={modalState.isOpen && modalState.type === 'create-file'}
        defaultFolderId={modalState.defaultFolderId}
        onConfirm={handleCreateFileConfirm}
        onCancel={closeModal}
      />
      
      <QuickOpen
        isOpen={showQuickOpen}
        onClose={() => setShowQuickOpen(false)}
      />

      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />

      <BlogStudio
        isOpen={showBlogStudio}
        onClose={() => setShowBlogStudio(false)}
        currentFile={blogCurrentFile}
      />
    </div>
  );
};

function App() {
  return (
    <ModalProvider>
      <FileManagerProvider>
        <UndoRedoProvider>
          <AppContent />
        </UndoRedoProvider>
      </FileManagerProvider>
    </ModalProvider>
  );
}

export default App;
