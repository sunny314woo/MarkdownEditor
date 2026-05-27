import { useRef, useCallback, useState, useMemo, forwardRef, ForwardedRef, useEffect } from 'react'
import { applyFormatAndUpdateCursor, formatBold, formatItalic, formatCodeBlock, formatInlineMath, formatBlockMath } from './markdownShortcuts'
import { calculateStats, DocumentStats } from './stats'
import { lintMarkdown, LintIssue } from '../lint/markdownLinter'
import { insertFootnote } from './footnote'
import { insertMath } from '../preview/mathUtils'
import { findImageMarkRange, formatFileSize } from '../shared/imageHelpers'
import { storeBase64Image, getBase64Image, isImagePlaceholder, getPlaceholderId, createPlaceholderUrl } from '../shared/imageStore'
import { scrollToLine } from './editorHelpers'
import { useUndoRedo } from './UndoRedoContext'
import {
  handleHeadingAutoSpace,
  handleBoldAutoClose,
  handleLinkAutoComplete,
  handleCodeFenceAutoComplete,
  handleSmartEnterInCodeBlock,
  handleTaskToggle,
  handleTableAutoComplete,
  handleSmartBackspace,
} from './markdownAutocomplete'
import SearchReplace from '../../components/SearchReplace'
import MarkdownToolbar from '../toolbar/MarkdownToolbar'
import LineNumbers from './LineNumbers'
import InlineMathPreview from '../../components/InlineMathPreview'
import SaveAsModal from '../export/SaveAsModal'
import OptimizeImagesModal from '../../components/OptimizeImagesModal'
import ScrollButtons from '../shared/ScrollButtons'
import LintPopover from '../lint/LintPopover'
import FrontMatterPanel from '../blog/FrontMatterPanel'

type WordCountMode = 'text' | 'standard'
type SearchMode = 'search' | 'replace' | null

interface EditorProps {
  value: string
  onChange: (value: string) => void
  onScroll?: (scrollPosition: number, element: HTMLElement) => void
  showPreview?: boolean
  onTogglePreview?: () => void
  focusMode?: boolean
  typewriterMode?: boolean
  onToggleFocusMode?: () => void
  onToggleTypewriterMode?: () => void
  fileId?: string | null
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml']

const Editor = forwardRef(function Editor(
  { value, onChange, onScroll, showPreview = true, onTogglePreview, focusMode = false, typewriterMode = false, onToggleFocusMode, onToggleTypewriterMode, fileId }: EditorProps,
  ref: ForwardedRef<HTMLTextAreaElement>
) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof ref === 'function') {
      ref(textareaRef.current)
    } else if (ref) {
      ref.current = textareaRef.current
    }
  }, [ref])

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [wordCountMode, setWordCountMode] = useState<WordCountMode>('text')
  const [searchMode, setSearchMode] = useState<SearchMode>(null)
  const [lintIssues, setLintIssues] = useState<LintIssue[]>([])
  const [showSaveAsModal, setShowSaveAsModal] = useState(false)
  const [showOptimizeModal, setShowOptimizeModal] = useState(false)
  const [showFrontMatter, setShowFrontMatter] = useState(false)
  const [largeImageConfirm, setLargeImageConfirm] = useState<{ file: File; onConfirm: () => void } | null>(null)
  const lintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [showLintPopover, setShowLintPopover] = useState(false)
  const lintAnchorRef = useRef<HTMLDivElement>(null)
  const lintCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialRender = useRef(true)

  const undoRedo = useUndoRedo()
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const isUndoRedoRef = useRef(false)
  const typewriterScrollingRef = useRef(false)
  const [currentLineNumber, setCurrentLineNumber] = useState(0)

  const updateCurrentLine = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    const cursorPos = textarea.selectionStart
    const textBefore = textarea.value.substring(0, cursorPos)
    const line = textBefore.split('\n').length
    setCurrentLineNumber(line)
  }, [])

  useEffect(() => {
    if (!fileId) return
    const updateState = () => {
      if (!fileId) return
      const state = undoRedo.getState(fileId)
      setCanUndo(state.canUndo)
      setCanRedo(state.canRedo)
    }
    updateState()
    const unsub = undoRedo.subscribeState(updateState)
    return unsub
  }, [fileId, undoRedo])

  useEffect(() => {
    if (!fileId) return
    undoRedo.initHistory(fileId, value)
  }, [fileId])

  useEffect(() => {
    updateCurrentLine()
  }, [value, updateCurrentLine])

  const scrollToCursorCenter = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea || !typewriterMode) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = textarea.value.substring(0, cursorPos)
    const linesBeforeCursor = textBeforeCursor.split('\n').length
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 24
    const cursorY = (linesBeforeCursor - 1) * lineHeight
    const containerHeight = textarea.clientHeight
    const targetScroll = cursorY - containerHeight / 2 + lineHeight / 2

    typewriterScrollingRef.current = true
    textarea.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth'
    })
    setTimeout(() => {
      typewriterScrollingRef.current = false
    }, 300)
  }, [typewriterMode])

  const pushUndo = useCallback((newValue: string, groupKey?: string) => {
    if (isUndoRedoRef.current || !fileId) return
    const textarea = textareaRef.current
    const cursorStart = textarea ? textarea.selectionStart : 0
    const cursorEnd = textarea ? textarea.selectionEnd : 0
    undoRedo.pushHistory(fileId, newValue, cursorStart, cursorEnd, groupKey)
  }, [fileId, undoRedo])

  const handleUndo = useCallback(() => {
    if (!fileId) return
    const entry = undoRedo.undo(fileId)
    if (!entry) return
    isUndoRedoRef.current = true
    onChange(entry.content)
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = entry.cursorStart
        textareaRef.current.selectionEnd = entry.cursorEnd
      }
      isUndoRedoRef.current = false
    })
  }, [fileId, undoRedo, onChange])

  const handleRedo = useCallback(() => {
    if (!fileId) return
    const entry = undoRedo.redo(fileId)
    if (!entry) return
    isUndoRedoRef.current = true
    onChange(entry.content)
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = entry.cursorStart
        textareaRef.current.selectionEnd = entry.cursorEnd
      }
      isUndoRedoRef.current = false
    })
  }, [fileId, undoRedo, onChange])

  const handleInsertFootnote = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const { selectionStart, value: currentValue } = textarea
    const result = insertFootnote(currentValue, selectionStart)

    pushUndo(result.newText, 'footnote')
    onChange(result.newText)

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.selectionStart = result.defCursorPos
        textareaRef.current.selectionEnd = result.defCursorPos
      }
    })
  }, [onChange, pushUndo])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isInitialRender.current) {
      return
    }
    const scrollPosition = e.currentTarget.scrollTop
    setScrollTop(scrollPosition)
    if (onScroll) {
      onScroll(scrollPosition, e.currentTarget)
    }
  }, [onScroll])

  useEffect(() => {
    if (isInitialRender.current) {
      setTimeout(() => {
        isInitialRender.current = false
      }, 100)
    }
  }, [])

  const stats = useMemo<DocumentStats>(() => {
    return calculateStats(value)
  }, [value])

  useEffect(() => {
    if (lintTimerRef.current) clearTimeout(lintTimerRef.current)
    lintTimerRef.current = setTimeout(() => {
      const issues = lintMarkdown(value)
      setLintIssues(issues)
    }, 500)
    return () => {
      if (lintTimerRef.current) clearTimeout(lintTimerRef.current)
    }
  }, [value])

  const handleJumpToIssue = useCallback((issue: LintIssue) => {
    if (!textareaRef.current || !scrollContainerRef.current) return
    scrollToLine(textareaRef.current, scrollContainerRef.current, issue.line, issue.startCol)
  }, [])

  const handleFixIssue = useCallback((newContent: string) => {
    pushUndo(newContent, 'lint-fix')
    onChange(newContent)
  }, [onChange, pushUndo])

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey

      if (isCtrlOrCmd && event.key === 'f') {
        event.preventDefault()
        setSearchMode('search')
      }

      if (isCtrlOrCmd && event.shiftKey && event.key === 'H') {
        event.preventDefault()
        setSearchMode('replace')
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value
    pushUndo(newValue, 'typing')
    onChange(newValue)
    updateCurrentLine()
    if (typewriterMode) {
      requestAnimationFrame(() => scrollToCursorCenter())
    }
  }

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey

    if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
      event.preventDefault()
      handleUndo()
      return
    }

    if (isCtrlOrCmd && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      event.preventDefault()
      handleRedo()
      return
    }

    if (isCtrlOrCmd && event.key === 'b') {
      event.preventDefault()
      if (textareaRef.current) {
        applyFormatAndUpdateCursor(textareaRef.current, formatBold)
      }
      return
    }

    if (isCtrlOrCmd && event.key === 'i') {
      event.preventDefault()
      if (textareaRef.current) {
        applyFormatAndUpdateCursor(textareaRef.current, formatItalic)
      }
      return
    }

    if (isCtrlOrCmd && event.shiftKey && event.key === 'K') {
      event.preventDefault()
      if (textareaRef.current) {
        applyFormatAndUpdateCursor(textareaRef.current, formatCodeBlock)
      }
      return
    }

    if (isCtrlOrCmd && event.shiftKey && event.key === 'N') {
      event.preventDefault()
      handleInsertFootnote()
      return
    }

    if (isCtrlOrCmd && !event.shiftKey && event.key === 'm') {
      event.preventDefault()
      if (textareaRef.current) {
        applyFormatAndUpdateCursor(textareaRef.current, formatInlineMath)
      }
      return
    }

    if (isCtrlOrCmd && event.shiftKey && event.key === 'M') {
      event.preventDefault()
      if (textareaRef.current) {
        applyFormatAndUpdateCursor(textareaRef.current, formatBlockMath)
      }
      return
    }

    if (isCtrlOrCmd && event.key === 'f') {
      event.preventDefault()
      setSearchMode('replace')
      return
    }

    if (isCtrlOrCmd && event.shiftKey && event.key === 'H') {
      event.preventDefault()
      setSearchMode('replace')
      return
    }

    if (isCtrlOrCmd && event.key === 'Enter') {
      event.preventDefault()
      if (textareaRef.current) {
        const { selectionStart, value } = textareaRef.current
        const result = handleTaskToggle(value, selectionStart)
        if (result) {
          pushUndo(result.newText, result.groupKey)
          onChange(result.newText)
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = result.cursorStart
              textareaRef.current.selectionEnd = result.cursorEnd
            }
          })
        }
      }
      return
    }

    if (!isCtrlOrCmd && !event.altKey) {
      const textarea = textareaRef.current
      if (!textarea) return

      const { selectionStart, selectionEnd, value } = textarea

      if (event.key === 'Enter') {
        const beforeCursor = value.substring(0, selectionStart)
        const currentLine = beforeCursor.split('\n').pop() || ''

        const codeBlockResult = handleSmartEnterInCodeBlock(value, selectionStart)
        if (codeBlockResult) {
          event.preventDefault()
          pushUndo(codeBlockResult.newText, codeBlockResult.groupKey)
          onChange(codeBlockResult.newText)
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = codeBlockResult.cursorStart
              textareaRef.current.selectionEnd = codeBlockResult.cursorEnd
            }
          })
          return
        }

        const tableResult = handleTableAutoComplete(value, selectionStart)
        if (tableResult) {
          event.preventDefault()
          pushUndo(tableResult.newText, tableResult.groupKey)
          onChange(tableResult.newText)
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = tableResult.cursorStart
              textareaRef.current.selectionEnd = tableResult.cursorEnd
            }
          })
          return
        }

        const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s/)
        const blockquoteMatch = currentLine.match(/^(\s*>)+\s*/)

        if (listMatch) {
          const emptyListMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s*$/)
          if (emptyListMatch) {
            event.preventDefault()
            const lineStart = beforeCursor.lastIndexOf('\n') + 1
            const newValue = value.substring(0, lineStart) + value.substring(selectionStart)
            pushUndo(newValue, 'list')
            onChange(newValue)
            requestAnimationFrame(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = lineStart
                textareaRef.current.selectionEnd = lineStart
              }
            })
            return
          }

          event.preventDefault()
          const indent = listMatch[1]
          let marker = listMatch[2]
          const numberMatch = marker.match(/^(\d+)\.$/)
          if (numberMatch) {
            marker = `${parseInt(numberMatch[1]) + 1}.`
          }
          const newLine = `\n${indent}${marker} `
          const newValue = value.substring(0, selectionStart) + newLine + value.substring(selectionEnd)
          pushUndo(newValue, 'list')
          onChange(newValue)
          const newCursorPos = selectionStart + newLine.length
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = newCursorPos
              textareaRef.current.selectionEnd = newCursorPos
            }
          })
          return
        }

        if (blockquoteMatch) {
          const emptyBlockquote = currentLine.match(/^(\s*>)+\s*$/)
          if (emptyBlockquote) {
            event.preventDefault()
            const lineStart = beforeCursor.lastIndexOf('\n') + 1
            const newValue = value.substring(0, lineStart) + value.substring(selectionStart)
            pushUndo(newValue, 'blockquote')
            onChange(newValue)
            requestAnimationFrame(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = lineStart
                textareaRef.current.selectionEnd = lineStart
              }
            })
            return
          }

          event.preventDefault()
          const prefix = blockquoteMatch[0]
          const newLine = `\n${prefix}`
          const newValue = value.substring(0, selectionStart) + newLine + value.substring(selectionEnd)
          pushUndo(newValue, 'blockquote')
          onChange(newValue)
          const newCursorPos = selectionStart + newLine.length
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = newCursorPos
              textareaRef.current.selectionEnd = newCursorPos
            }
          })
          return
        }
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        const beforeCursor = value.substring(0, selectionStart)
        const currentLine = beforeCursor.split('\n').pop() || ''
        const lineStart = beforeCursor.lastIndexOf('\n') + 1

        if (event.shiftKey) {
          const indentMatch = currentLine.match(/^( {2,4}|\t)/)
          if (indentMatch) {
            const removeCount = indentMatch[1].length
            const newLine = currentLine.substring(removeCount)
            const newValue = value.substring(0, lineStart) + newLine + value.substring(selectionEnd)
            pushUndo(newValue, 'outdent')
            onChange(newValue)
            const newPos = Math.max(lineStart, selectionStart - removeCount)
            requestAnimationFrame(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = newPos
                textareaRef.current.selectionEnd = newPos
              }
            })
          }
          return
        }

        const newLine = '  ' + currentLine
        const newValue = value.substring(0, lineStart) + newLine + value.substring(lineStart + currentLine.length)
        pushUndo(newValue, 'indent')
        onChange(newValue)
        const offset = selectionStart - lineStart
        const newPos = lineStart + Math.min(offset + 2, newLine.length)
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = newPos
            textareaRef.current.selectionEnd = newPos
          }
        })
        return
      }

      if (event.key === '#') {
        const headingResult = handleHeadingAutoSpace(value, selectionStart, '#')
        if (headingResult) {
          event.preventDefault()
          pushUndo(headingResult.newText, headingResult.groupKey)
          onChange(headingResult.newText)
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = headingResult.cursorStart
              textareaRef.current.selectionEnd = headingResult.cursorEnd
            }
          })
          return
        }
      }

      if (event.key === '*') {
        const boldResult = handleBoldAutoClose(value, selectionStart, '*')
        if (boldResult) {
          event.preventDefault()
          pushUndo(boldResult.newText, boldResult.groupKey)
          onChange(boldResult.newText)
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = boldResult.cursorStart
              textareaRef.current.selectionEnd = boldResult.cursorEnd
            }
          })
          return
        }
      }

      const autoPairs: Record<string, string> = {
        '(': ')',
        '[': ']',
        '{': '}',
        '`': '`',
        '"': '"',
        "'": "'",
      }

      if (autoPairs[event.key] && selectionStart === selectionEnd) {
        const charBefore = value[selectionStart - 1]
        const charAfter = value[selectionStart]

        if (event.key === '`') {
          const twoBefore = value.substring(selectionStart - 2, selectionStart)
          if (twoBefore === '``') {
            event.preventDefault()
            const fenceResult = handleCodeFenceAutoComplete(value, selectionStart)
            if (fenceResult) {
              pushUndo(fenceResult.newText, fenceResult.groupKey)
              onChange(fenceResult.newText)
              requestAnimationFrame(() => {
                if (textareaRef.current) {
                  textareaRef.current.selectionStart = fenceResult.cursorStart
                  textareaRef.current.selectionEnd = fenceResult.cursorEnd
                }
              })
            } else {
              const insertText = '\n\n```'
              const newValue = value.substring(0, selectionStart) + insertText + value.substring(selectionEnd)
              pushUndo(newValue, 'codeblock')
              onChange(newValue)
              const newCursorPos = selectionStart + 1
              requestAnimationFrame(() => {
                if (textareaRef.current) {
                  textareaRef.current.selectionStart = newCursorPos
                  textareaRef.current.selectionEnd = newCursorPos
                }
              })
            }
            return
          }
        }

        if (event.key === '(' || event.key === '{') {
          event.preventDefault()
          const closing = autoPairs[event.key]
          const newValue = value.substring(0, selectionStart) + event.key + closing + value.substring(selectionEnd)
          pushUndo(newValue, 'autopair')
          onChange(newValue)
          const newCursorPos = selectionStart + 1
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = newCursorPos
              textareaRef.current.selectionEnd = newCursorPos
            }
          })
          return
        }

        if (event.key === '[') {
          event.preventDefault()
          const linkResult = handleLinkAutoComplete(value, selectionStart, '[')
          if (linkResult) {
            pushUndo(linkResult.newText, linkResult.groupKey)
            onChange(linkResult.newText)
            requestAnimationFrame(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = linkResult.cursorStart
                textareaRef.current.selectionEnd = linkResult.cursorEnd
              }
            })
          } else {
            const newValue = value.substring(0, selectionStart) + '[]' + value.substring(selectionEnd)
            pushUndo(newValue, 'autopair')
            onChange(newValue)
            const newCursorPos = selectionStart + 1
            requestAnimationFrame(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = newCursorPos
                textareaRef.current.selectionEnd = newCursorPos
              }
            })
          }
          return
        }

        if (event.key === '"' || event.key === "'") {
          if (charAfter === event.key && charBefore !== '\\') {
            event.preventDefault()
            const newCursorPos = selectionStart + 1
            requestAnimationFrame(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = newCursorPos
                textareaRef.current.selectionEnd = newCursorPos
              }
            })
            return
          }
          event.preventDefault()
          const newValue = value.substring(0, selectionStart) + event.key + event.key + value.substring(selectionEnd)
          pushUndo(newValue, 'autopair')
          onChange(newValue)
          const newCursorPos = selectionStart + 1
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = newCursorPos
              textareaRef.current.selectionEnd = newCursorPos
            }
          })
          return
        }
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        const range = findImageMarkRange(value, selectionStart)
        if (range) {
          event.preventDefault()
          const newValue = value.substring(0, range.start) + value.substring(range.end)
          pushUndo(newValue, 'delete-image')
          onChange(newValue)
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = range.start
              textareaRef.current.selectionEnd = range.start
            }
          })
          return
        }
      }

      if (event.key === 'Backspace') {
        if (selectionStart === selectionEnd && selectionStart > 0) {
          const smartResult = handleSmartBackspace(value, selectionStart)
          if (smartResult) {
            event.preventDefault()
            pushUndo(smartResult.newText, smartResult.groupKey)
            onChange(smartResult.newText)
            requestAnimationFrame(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = smartResult.cursorStart
                textareaRef.current.selectionEnd = smartResult.cursorEnd
              }
            })
            return
          }

          const charBefore = value[selectionStart - 1]
          const charAfter = value[selectionStart]
          const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' }
          if (pairs[charBefore] === charAfter) {
            event.preventDefault()
            const newValue = value.substring(0, selectionStart - 1) + value.substring(selectionStart + 1)
            pushUndo(newValue, 'delete-pair')
            onChange(newValue)
            const newCursorPos = selectionStart - 1
            requestAnimationFrame(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = newCursorPos
                textareaRef.current.selectionEnd = newCursorPos
              }
            })
            return
          }
        }
      }
    }

    if (typewriterMode && (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Home' || event.key === 'End' || event.key === 'PageUp' || event.key === 'PageDown')) {
      setTimeout(() => scrollToCursorCenter(), 0)
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Home' || event.key === 'End' || event.key === 'PageUp' || event.key === 'PageDown') {
      setTimeout(() => updateCurrentLine(), 0)
    }
  }, [handleUndo, handleRedo, typewriterMode, scrollToCursorCenter, onChange, pushUndo, handleInsertFootnote])

  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleOpenImageFile = useCallback(() => {
    imageInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const validExtensions = ['.md', '.markdown']
    const fileName = file.name.toLowerCase()
    const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext))

    if (!isValidExtension) {
      setError('不支持的文件格式。仅支持 .md 和 .markdown 文件。')
      setTimeout(() => setError(null), 5000)
      event.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string
      pushUndo(content, 'open-file')
      onChange(content)
    }

    reader.onerror = () => {
      setError(`文件读取失败: ${reader.error?.message || '未知错误'}`)
      setTimeout(() => setError(null), 5000)
    }

    reader.readAsText(file, 'UTF-8')
    event.target.value = ''
  }, [onChange])

  const extractTitle = (content: string): string => {
    const lines = content.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('# ')) {
        return trimmed.slice(2).trim()
      }
    }
    return ''
  }

  const sanitizeFileName = (name: string): string => {
    return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_')
  }

  const toggleWordCountMode = useCallback(() => {
    setWordCountMode(prev => prev === 'text' ? 'standard' : 'text')
  }, [])

  const handleFormatApplied = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const insertImageAtCursor = useCallback((imageUrl: string, altText: string) => {
    const textarea = textareaRef.current
    const scrollContainer = scrollContainerRef.current
    if (!textarea) {
      return
    }

    const savedScrollTop = scrollContainer ? scrollContainer.scrollTop : 0
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    let displayUrl: string
    if (imageUrl.startsWith('data:')) {
      const imageId = storeBase64Image(imageUrl)
      displayUrl = createPlaceholderUrl(imageId)
    } else {
      displayUrl = imageUrl
    }
    
    const markdownImage = `![${altText}](${displayUrl})`
    
    const newValue = value.substring(0, start) + markdownImage + value.substring(end)
    
    try {
      pushUndo(newValue, 'insert-image')
      onChange(newValue)
      
      const restoreScrollPosition = () => {
        if (textareaRef.current && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedScrollTop
          textareaRef.current.focus()
          const newCursorPos = start + markdownImage.length
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }
      
      setTimeout(restoreScrollPosition, 50)
      setTimeout(restoreScrollPosition, 100)
    } catch (err) {
      setError(`插入图片时发生错误: ${err instanceof Error ? err.message : '未知错误'}`)
      setTimeout(() => setError(null), 5000)
    }
  }, [value, onChange, pushUndo])

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const processImageFile = useCallback((file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(`不支持的图片格式: ${file.type}。仅支持 JPG、PNG、GIF、WebP、BMP、SVG 格式。`)
      setTimeout(() => setError(null), 5000)
      return
    }

    const isLargeFile = file.size > MAX_IMAGE_SIZE

    const doInsert = () => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const base64Data = e.target?.result as string
        if (base64Data) {
          const altText = file.name.replace(/\.[^/.]+$/, '') || 'image'
          insertImageAtCursor(base64Data, altText)
          setSuccess(`图片 "${file.name}" 插入成功！`)
          setTimeout(() => setSuccess(null), 3000)
        }
      }

      reader.onerror = () => {
        setError(`图片读取失败: ${reader.error?.message || '未知错误'}`)
        setTimeout(() => setError(null), 5000)
      }

      reader.readAsDataURL(file)
    }

    if (isLargeFile) {
      setLargeImageConfirm({ file, onConfirm: doInsert })
      return
    }

    doInsert()
  }, [insertImageAtCursor])

  const handleImageFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
    event.target.value = ''
  }, [processImageFile])

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData.items
    let imageFound = false

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      if (item.type.startsWith('image/')) {
        event.preventDefault()
        imageFound = true

        const file = item.getAsFile()
        if (file) {
          processImageFile(file)
        }
        break
      }
    }

    if (!imageFound) {
      const files = event.clipboardData.files
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.type.startsWith('image/')) {
          event.preventDefault()
          processImageFile(file)
          break
        }
      }
    }
  }, [processImageFile])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    const files = event.dataTransfer.files

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        processImageFile(file)
        break
      }
    }
  }, [processImageFile])

  const renderMarkdownForEditor = useMemo(() => {
    const lines = value.split('\n')
    let html = ''
    let imageIndex = 0
    const showLineHighlight = focusMode || typewriterMode

    const lineIssueMap = new Map<number, 'error' | 'warning'>()
    for (const issue of lintIssues) {
      const existing = lineIssueMap.get(issue.line)
      if (existing === 'error') continue
      if (issue.severity === 'error' || !existing) {
        lineIssueMap.set(issue.line, issue.severity)
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const issueSeverity = lineIssueMap.get(i)
      const isCurrentLine = showLineHighlight && (i + 1) === currentLineNumber
      const isFocusDimmed = focusMode && !isCurrentLine
      
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
      let lastIndex = 0
      let newHtml = ''
      let imgIdx = imageIndex
      
      let match
      while ((match = imageRegex.exec(line)) !== null) {
        const [fullMatch, altText, url] = match
        const beforeText = line.substring(lastIndex, match.index)
        lastIndex = match.index + fullMatch.length
        
        let imgSrc = url
        if (isImagePlaceholder(url)) {
          const placeholderId = getPlaceholderId(url)
          if (placeholderId) {
            const base64Data = getBase64Image(placeholderId)
            if (base64Data) {
              imgSrc = base64Data
            }
          }
        }
        
        newHtml += escapeHtml(beforeText)
        newHtml += `<span class="editor-image-wrapper" data-image-index="${imgIdx}"><img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(altText)}" class="editor-inline-image" /></span>`
        imgIdx++
      }
      imageIndex = imgIdx
      
      newHtml += escapeHtml(line.substring(lastIndex))

      let lineClass = ''
      let lineStyle = ''
      if (isCurrentLine) {
        lineClass = focusMode ? 'focus-current-line' : 'typewriter-cursor-line'
      }
      if (isFocusDimmed) {
        lineStyle = ' style="opacity:0.35"'
      }

      if (issueSeverity) {
        html += `<span class="lint-line-marker${lineClass ? ' ' + lineClass : ''}" data-severity="${issueSeverity}"${lineStyle}>${newHtml}</span>`
      } else if (lineClass || lineStyle) {
        html += `<span class="${lineClass}"${lineStyle}>${newHtml}</span>`
      } else {
        html += newHtml
      }
      html += (i < lines.length - 1 ? '\n' : '')
    }

    return html
  }, [value, lintIssues, focusMode, typewriterMode, currentLineNumber])

  const currentWordCount = wordCountMode === 'text' ? stats.wordCountTextMode : stats.wordCountStandardMode

  return (
    <div className="h-full flex flex-col">
      {!focusMode && (
        <MarkdownToolbar
          textareaRef={textareaRef}
          onFormatApplied={handleFormatApplied}
          value={value}
          onChange={onChange}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onUploadImage={handleOpenImageFile}
          onSearchReplace={() => setSearchMode('replace')}
          focusMode={focusMode}
          typewriterMode={typewriterMode}
          onToggleFocusMode={onToggleFocusMode}
          onToggleTypewriterMode={onToggleTypewriterMode}
          onInsertFootnote={handleInsertFootnote}
          onInsertInlineMath={() => {
            if (textareaRef.current) {
              applyFormatAndUpdateCursor(textareaRef.current, formatInlineMath)
            }
          }}
          onInsertBlockMath={() => {
            if (textareaRef.current) {
              applyFormatAndUpdateCursor(textareaRef.current, formatBlockMath)
            }
          }}
          onInsertMathTemplate={(latex, mode, isTemplate) => {
            const textarea = textareaRef.current
            if (!textarea) return
            insertMath(textarea, mode, latex, isTemplate, onChange)
          }}
          onOpenFile={handleOpenFile}
          onSaveAs={() => setShowSaveAsModal(true)}
          onTogglePreview={onTogglePreview}
          showPreview={showPreview}
          onOptimizeImages={() => setShowOptimizeModal(true)}
          onOpenFrontMatter={() => setShowFrontMatter(true)}
        />
      )}

      {focusMode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '8px 16px',
            backgroundColor: 'var(--editor-bg)',
            borderBottom: '1px solid var(--editor-border)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(to right, transparent, var(--button-primary), #a78bfa, #f472b6, transparent)',
              opacity: 0.5,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.4 }}>
            <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span style={{ fontSize: '12px', color: 'var(--editor-text)', fontWeight: 500 }}>专注模式</span>
          </div>
          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--editor-border)' }} />
          <button
            onClick={onToggleTypewriterMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 500,
              border: typewriterMode ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--editor-border)',
              backgroundColor: typewriterMode ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: typewriterMode ? 'var(--link-color)' : 'var(--sidebar-text)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = typewriterMode ? 'rgba(59, 130, 246, 0.15)' : 'var(--sidebar-bg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = typewriterMode ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
            }}
            title="打字机模式 (Ctrl+Shift+T)"
          >
            <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h8" />
            </svg>
            打字机 {typewriterMode ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={onToggleFocusMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 500,
              border: '1px solid var(--editor-border)',
              backgroundColor: 'transparent',
              color: 'var(--sidebar-text)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sidebar-bg)'
              e.currentTarget.style.color = 'var(--editor-text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--sidebar-text)'
            }}
            title="退出专注模式 (Ctrl+Shift+F)"
          >
            <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            退出专注
          </button>
        </div>
      )}

      {searchMode && (
        <SearchReplace
          content={value}
          onContentChange={(newContent) => {
            pushUndo(newContent, 'search-replace')
            onChange(newContent)
          }}
          onClose={() => setSearchMode(null)}
          mode={searchMode}
        />
      )}

      {error && (
        <div
          className="px-4 py-2 bg-red-500 text-white text-sm flex items-center gap-2"
          role="alert"
          aria-live="polite"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div
          className="px-4 py-2 bg-green-500 text-white text-sm flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {success}
        </div>
      )}

      <div
        className={`editor-area flex-1 w-full flex overflow-hidden relative transition-all duration-200 ${
          isDragging ? 'ring-2 ring-blue-500 ring-inset' : ''
        }`}
        style={{ backgroundColor: 'var(--editor-bg)' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'linear-gradient(to bottom, var(--button-primary), #a78bfa, transparent)',
            opacity: 0.3,
            pointerEvents: 'none'
          }}
        />
        <LineNumbers
          content={value}
          scrollTop={scrollTop}
          focusMode={focusMode}
        />
        
        <div
          ref={scrollContainerRef}
          className="flex-1 h-full relative overflow-auto"
          onScroll={handleScroll}
        >
          <div className="relative" style={{ minHeight: '100%' }}>
            <InlineMathPreview
              textareaRef={textareaRef}
              scrollContainerRef={scrollContainerRef}
              value={value}
              focusMode={focusMode}
            />
            <div
              className="select-none whitespace-pre-wrap break-all p-4"
              style={{
                color: 'var(--editor-text)',
                fontFamily: 'Consolas, Monaco, Fira Code, monospace',
                fontSize: focusMode ? '16px' : '14px',
                lineHeight: focusMode ? '32px' : '22.75px',
                letterSpacing: focusMode ? '0.02em' : 'normal',
                paddingBottom: focusMode ? '50vh' : '40px',
                minHeight: '100%'
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdownForEditor }}
            />

            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onClick={(_e) => {
                updateCurrentLine()
                if (typewriterMode) {
                  requestAnimationFrame(() => scrollToCursorCenter())
                }
              }}
              className="absolute inset-0 w-full resize-none outline-none bg-transparent p-4"
              style={{
                color: 'transparent',
                caretColor: 'var(--editor-text)',
                fontFamily: 'Consolas, Monaco, Fira Code, monospace',
                fontSize: focusMode ? '16px' : '14px',
                lineHeight: focusMode ? '32px' : '22.75px',
                letterSpacing: focusMode ? '0.02em' : 'normal',
                paddingBottom: focusMode ? '50vh' : '40px',
                zIndex: 1,
                minHeight: '100%',
                height: 'auto',
                overflow: 'hidden'
              }}
              placeholder="Enter your markdown here... (Ctrl+B 粗体, Ctrl+I 斜体, Ctrl+Shift+K 代码块, Ctrl+F 搜索, Ctrl+Shift+H 替换, 支持粘贴/拖拽图片)"
            />
          </div>
        </div>
        <ScrollButtons scrollContainerRef={scrollContainerRef} />
      </div>

      <div
        className="h-8 px-4 flex items-center justify-between relative"
        style={{ backgroundColor: 'var(--editor-bg)', color: 'var(--editor-text)' }}
      >
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: '1px', background: 'linear-gradient(to right, var(--button-primary), #a78bfa, #f472b6)' }}
        />
        <div className="flex items-center gap-3">
          <div
            style={{
              width: '4px',
              height: '4px',
              transform: 'rotate(45deg)',
              backgroundColor: 'var(--button-primary)',
              marginRight: '8px',
              flexShrink: 0
            }}
          />
          <div className="flex items-center gap-1">
            <span style={{ opacity: 0.5, fontSize: '11px' }}>字数:</span>
            <span style={{ fontWeight: 600, fontSize: '11px' }}>{currentWordCount}</span>
            <button
              onClick={toggleWordCountMode}
              className="transition-colors"
              style={{
                borderRadius: '4px',
                padding: '2px 8px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--editor-text)',
                cursor: 'pointer'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)' }}
              title={wordCountMode === 'text' ? '切换到标准模式（包含空格）' : '切换到纯文本模式（不含空格）'}
            >
              {wordCountMode === 'text' ? '纯文本' : '标准'}
            </button>
          </div>
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--editor-border)', flexShrink: 0 }} />
          <div className="flex items-center gap-1">
            <span style={{ opacity: 0.5, fontSize: '11px' }}>字符:</span>
            <span style={{ fontWeight: 600, fontSize: '11px' }}>{stats.charCount}</span>
          </div>
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--editor-border)', flexShrink: 0 }} />
          <div className="flex items-center gap-1">
            <span style={{ opacity: 0.5, fontSize: '11px' }}>行数:</span>
            <span style={{ fontWeight: 600, fontSize: '11px' }}>{stats.lineCount}</span>
          </div>
          {lintIssues.length > 0 && (
            <>
              <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--editor-border)', flexShrink: 0 }} />
              <div
                ref={lintAnchorRef}
                className="flex items-center gap-1 cursor-pointer lint-status-area"
                onMouseEnter={() => {
                  if (lintCloseTimerRef.current) {
                    clearTimeout(lintCloseTimerRef.current)
                    lintCloseTimerRef.current = null
                  }
                  setShowLintPopover(true)
                }}
                onMouseLeave={() => {
                  lintCloseTimerRef.current = setTimeout(() => {
                    setShowLintPopover(false)
                  }, 300)
                }}
              >
                {lintIssues.filter(i => i.severity === 'error').length > 0 && (
                  <span className="flex items-center gap-1" style={{ color: '#ef4444', fontSize: '11px', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
                    {lintIssues.filter(i => i.severity === 'error').length}
                  </span>
                )}
                {lintIssues.filter(i => i.severity === 'warning').length > 0 && (
                  <span className="flex items-center gap-1" style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
                    {lintIssues.filter(i => i.severity === 'warning').length}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown"
        multiple={false}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
        multiple={false}
        onChange={handleImageFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <SaveAsModal
        isOpen={showSaveAsModal}
        onClose={() => setShowSaveAsModal(false)}
        content={value}
        defaultFileName={sanitizeFileName(extractTitle(value)) || 'Untitled'}
        onSuccess={(msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }}
        onError={(msg) => { setError(msg); setTimeout(() => setError(null), 5000) }}
      />

      <OptimizeImagesModal
        isOpen={showOptimizeModal}
        onClose={() => setShowOptimizeModal(false)}
        content={value}
        onContentChange={(newContent) => {
          pushUndo(newContent, 'optimize-images')
          onChange(newContent)
        }}
        onSuccess={(msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }}
        onError={(msg) => { setError(msg); setTimeout(() => setError(null), 5000) }}
      />

      <FrontMatterPanel
        isOpen={showFrontMatter}
        onClose={() => setShowFrontMatter(false)}
        content={value}
        onContentChange={(newContent) => {
          pushUndo(newContent, 'front-matter')
          onChange(newContent)
        }}
      />

      {largeImageConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLargeImageConfirm(null)
          }}
        >
          <div
            className="rounded-lg shadow-xl max-w-md w-full mx-4"
            style={{
              backgroundColor: 'var(--editor-bg)',
              color: 'var(--editor-text)',
              border: '1px solid var(--editor-border)',
            }}
          >
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-6 h-6 flex-shrink-0" style={{ color: '#f59e0b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-base font-semibold">图片较大</h3>
              </div>
              <p className="text-sm mb-1" style={{ opacity: 0.8 }}>
                图片 "{largeImageConfirm.file.name}" 大小为 {formatFileSize(largeImageConfirm.file.size)}，超过 2MB。
              </p>
              <p className="text-sm" style={{ opacity: 0.6 }}>
                将图片转换为 Base64 格式会显著增加文档体积，可能影响编辑性能。建议先压缩图片或使用"优化图片"功能保存为外部文件。
              </p>
            </div>
            <div
              className="px-6 py-3 flex items-center justify-end gap-2 border-t"
              style={{ borderColor: 'var(--editor-border)' }}
            >
              <button
                onClick={() => setLargeImageConfirm(null)}
                className="px-4 py-2 text-sm rounded transition-colors"
                style={{
                  backgroundColor: 'rgba(128, 128, 128, 0.1)',
                  color: 'var(--editor-text)',
                  border: '1px solid var(--editor-border)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.1)' }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  largeImageConfirm.onConfirm()
                  setLargeImageConfirm(null)
                }}
                className="px-4 py-2 text-sm rounded transition-colors"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)' }}
              >
                仍然插入为 Base64
              </button>
            </div>
          </div>
        </div>
      )}

      <LintPopover
        issues={lintIssues}
        content={value}
        onJumpToIssue={handleJumpToIssue}
        onFixIssue={handleFixIssue}
        anchorEl={lintAnchorRef.current}
        visible={showLintPopover}
        onClose={() => setShowLintPopover(false)}
        onMouseEnter={() => {
          if (lintCloseTimerRef.current) {
            clearTimeout(lintCloseTimerRef.current)
            lintCloseTimerRef.current = null
          }
        }}
        onMouseLeave={() => {
          lintCloseTimerRef.current = setTimeout(() => {
            setShowLintPopover(false)
          }, 300)
        }}
      />
    </div>
  )
})

export default Editor
