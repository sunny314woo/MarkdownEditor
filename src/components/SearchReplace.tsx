import { useState, useEffect, useCallback, useRef } from 'react'

interface SearchReplaceProps {
  content: string
  onContentChange: (content: string) => void
  onClose: () => void
  mode: 'search' | 'replace'
  initialSearch?: string
}

interface MatchResult {
  index: number
  lineNumber: number
  text: string
  context: string
}

function SearchReplace({ content, onContentChange, onClose, mode, initialSearch }: SearchReplaceProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch || '')
  const [replaceTerm, setReplaceTerm] = useState('')
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'search') {
      searchInputRef.current?.focus()
    } else {
      searchInputRef.current?.focus()
    }
  }, [mode])

  const findMatches = useCallback((term: string): MatchResult[] => {
    if (!term.trim()) return []
    
    const results: MatchResult[] = []
    const lines = content.split('\n')
    let charOffset = 0

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      let match
      const lineRegex = new RegExp(term, 'gi')

      while ((match = lineRegex.exec(line)) !== null) {
        const startIndex = match.index
        const endIndex = startIndex + term.length
        
        const contextStart = Math.max(0, startIndex - 15)
        const contextEnd = Math.min(line.length, endIndex + 15)
        const context = (contextStart > 0 ? '...' : '') + 
                       line.substring(contextStart, contextEnd) + 
                       (contextEnd < line.length ? '...' : '')

        results.push({
          index: charOffset + startIndex,
          lineNumber: lineIndex + 1,
          text: match[0],
          context
        })
      }

      charOffset += line.length + 1
    }

    return results
  }, [content])

  useEffect(() => {
    const newMatches = findMatches(searchTerm)
    setMatches(newMatches)
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1)

    if (newMatches.length > 0 && currentMatchIndex >= newMatches.length) {
      setCurrentMatchIndex(newMatches.length - 1)
    }
  }, [searchTerm, findMatches, currentMatchIndex])

  const highlightAndScroll = useCallback((match: MatchResult) => {
    const textarea = document.querySelector('.editor-area') as HTMLTextAreaElement
    if (!textarea) return

    const start = match.index
    const end = start + searchTerm.length

    textarea.focus()
    textarea.setSelectionRange(start, end)
    
    const lineHeight = 24
    const lineNumber = match.lineNumber - 1
    const scrollTop = Math.max(0, lineNumber * lineHeight - textarea.clientHeight / 2)
    textarea.scrollTo({ top: scrollTop, behavior: 'smooth' })
  }, [searchTerm])

  useEffect(() => {
    if (currentMatchIndex >= 0 && matches[currentMatchIndex]) {
      highlightAndScroll(matches[currentMatchIndex])
    }
  }, [currentMatchIndex, highlightAndScroll, matches])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const newMatches = findMatches(searchTerm)
    setMatches(newMatches)
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1)

    if (searchTerm.trim() && !searchHistory.includes(searchTerm)) {
      const newHistory = [searchTerm, ...searchHistory].slice(0, 3)
      setSearchHistory(newHistory)
    }
  }

  const navigateToMatch = (direction: 'next' | 'prev') => {
    if (matches.length === 0) return

    let newIndex: number
    if (direction === 'next') {
      newIndex = currentMatchIndex < matches.length - 1 ? currentMatchIndex + 1 : 0
    } else {
      newIndex = currentMatchIndex > 0 ? currentMatchIndex - 1 : matches.length - 1
    }

    setCurrentMatchIndex(newIndex)
  }

  const handleReplace = () => {
    if (currentMatchIndex < 0 || !searchTerm) return

    const match = matches[currentMatchIndex]
    const newContent = content.substring(0, match.index) + 
                       replaceTerm + 
                       content.substring(match.index + searchTerm.length)

    onContentChange(newContent)
    setNotification({ type: 'success', message: '替换成功' })
    setTimeout(() => setNotification(null), 2000)

    setTimeout(() => {
      const newMatches = findMatches(searchTerm)
      setMatches(newMatches)
      if (currentMatchIndex < newMatches.length) {
        setCurrentMatchIndex(currentMatchIndex)
      } else if (newMatches.length > 0) {
        setCurrentMatchIndex(newMatches.length - 1)
      } else {
        setCurrentMatchIndex(-1)
      }
    }, 0)
  }

  const handleReplaceAll = () => {
    if (!searchTerm) return

    const regex = new RegExp(searchTerm, 'gi')
    const newContent = content.replace(regex, replaceTerm)
    const replaceCount = (content.match(regex) || []).length

    onContentChange(newContent)
    setNotification({ type: 'success', message: `成功替换 ${replaceCount} 处` })
    setTimeout(() => setNotification(null), 3000)

    setMatches([])
    setCurrentMatchIndex(-1)
  }

  const selectFromHistory = (term: string) => {
    setSearchTerm(term)
    setShowHistory(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      navigateToMatch('next')
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      navigateToMatch('prev')
    }
  }

  return (
    <div 
      style={{
        width: '100%',
        backgroundColor: 'var(--toolbar-bg)',
        borderBottom: '1px solid var(--editor-border)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
      }}
      onKeyDown={handleKeyDown}
    >
      <button
        onClick={onClose}
        style={{
          color: 'var(--sidebar-text)',
          transition: 'color 0.15s ease',
          padding: '4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="关闭搜索"
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--editor-text)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sidebar-text)'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px', color: 'var(--sidebar-text)', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSubmit={handleSearch}
            placeholder="搜索..."
            onClick={() => setShowHistory(true)}
            style={{
              width: '100%',
              backgroundColor: 'var(--sidebar-bg)',
              color: 'var(--editor-text)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              border: '1px solid var(--editor-border)',
              outline: 'none',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--button-primary)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--editor-border)'}
          />
          
          {showHistory && searchHistory.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: 'var(--sidebar-bg)',
              borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              zIndex: 10,
              border: '1px solid var(--editor-border)',
            }}>
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => selectFromHistory(term)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '14px',
                    color: 'var(--sidebar-text)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--editor-border)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>

        {mode === 'replace' && (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', color: 'var(--sidebar-text)', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <input
              ref={replaceInputRef}
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="替换为..."
              style={{
                width: '128px',
                backgroundColor: 'var(--sidebar-bg)',
                color: 'var(--editor-text)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                border: '1px solid var(--editor-border)',
                outline: 'none',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--button-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--editor-border)'}
            />
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => navigateToMatch('prev')}
          disabled={matches.length === 0}
          style={{
            padding: '6px',
            color: 'var(--sidebar-text)',
            background: 'none',
            border: 'none',
            borderRadius: '4px',
            cursor: matches.length === 0 ? 'not-allowed' : 'pointer',
            opacity: matches.length === 0 ? 0.5 : 1,
            transition: 'all 0.15s ease',
          }}
          title="上一个 (Shift+Enter)"
          onMouseEnter={(e) => { if (matches.length > 0) e.currentTarget.style.backgroundColor = 'var(--sidebar-bg)' }}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        
        <button
          onClick={() => navigateToMatch('next')}
          disabled={matches.length === 0}
          style={{
            padding: '6px',
            color: 'var(--sidebar-text)',
            background: 'none',
            border: 'none',
            borderRadius: '4px',
            cursor: matches.length === 0 ? 'not-allowed' : 'pointer',
            opacity: matches.length === 0 ? 0.5 : 1,
            transition: 'all 0.15s ease',
          }}
          title="下一个 (Enter)"
          onMouseEnter={(e) => { if (matches.length > 0) e.currentTarget.style.backgroundColor = 'var(--sidebar-bg)' }}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <span style={{ color: 'var(--sidebar-text)', fontSize: '14px', minWidth: '40px', textAlign: 'center' }}>
          {matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : ''}
        </span>

        {mode === 'replace' && (
          <>
            <button
              onClick={handleReplace}
              disabled={currentMatchIndex < 0 || !searchTerm}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--button-primary)',
                color: '#fff',
                fontSize: '14px',
                borderRadius: '6px',
                border: 'none',
                cursor: currentMatchIndex < 0 || !searchTerm ? 'not-allowed' : 'pointer',
                opacity: currentMatchIndex < 0 || !searchTerm ? 0.5 : 1,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => { if (currentMatchIndex >= 0 && searchTerm) e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)' }}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--button-primary)'}
            >
              替换
            </button>
            <button
              onClick={handleReplaceAll}
              disabled={matches.length === 0 || !searchTerm}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--button-success)',
                color: '#fff',
                fontSize: '14px',
                borderRadius: '6px',
                border: 'none',
                cursor: matches.length === 0 || !searchTerm ? 'not-allowed' : 'pointer',
                opacity: matches.length === 0 || !searchTerm ? 0.5 : 1,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => { if (matches.length > 0 && searchTerm) e.currentTarget.style.backgroundColor = 'var(--button-success-hover)' }}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--button-success)'}
            >
              替换全部
            </button>
          </>
        )}
      </div>

      {notification && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 16px',
          borderRadius: '6px',
          fontSize: '14px',
          whiteSpace: 'nowrap',
          zIndex: 20,
          backgroundColor: notification.type === 'success' ? 'var(--button-success)' : '#ef4444',
          color: '#fff',
        }}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default SearchReplace
