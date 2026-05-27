import { RefObject, useCallback, useState } from 'react'

export type WordCountMode = 'text' | 'standard'
export type SearchMode = 'search' | 'replace' | null

export function useEditorState(textareaRef: RefObject<HTMLTextAreaElement>) {
  const [wordCountMode, setWordCountMode] = useState<WordCountMode>('text')
  const [searchMode, setSearchMode] = useState<SearchMode>(null)
  const [showSaveAsModal, setShowSaveAsModal] = useState(false)
  const [showOptimizeModal, setShowOptimizeModal] = useState(false)
  const [showFrontMatter, setShowFrontMatter] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [currentLineNumber, setCurrentLineNumber] = useState(0)

  const updateCurrentLine = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    const cursorPos = textarea.selectionStart
    const textBefore = textarea.value.substring(0, cursorPos)
    const line = textBefore.split('\n').length
    setCurrentLineNumber(line)
  }, [textareaRef])

  const toggleWordCountMode = useCallback(() => {
    setWordCountMode(prev => prev === 'text' ? 'standard' : 'text')
  }, [])

  return {
    wordCountMode,
    searchMode,
    setSearchMode,
    showSaveAsModal,
    setShowSaveAsModal,
    showOptimizeModal,
    setShowOptimizeModal,
    showFrontMatter,
    setShowFrontMatter,
    scrollTop,
    setScrollTop,
    currentLineNumber,
    updateCurrentLine,
    toggleWordCountMode,
  }
}
