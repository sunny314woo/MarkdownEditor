import { useCallback, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import TableToolbar from './TableToolbar'
import MathPopover from './MathPopover'
import ListMenuPopover from './ListMenuPopover'

interface ToolbarButtonProps {
  onClick: () => void
  title: string
  ariaLabel: string
  disabled?: boolean
  children: React.ReactNode
  buttonRef?: React.Ref<HTMLButtonElement>
}

const noop = () => undefined

function ToolbarButton({ onClick, title, ariaLabel, disabled = false, children, buttonRef }: ToolbarButtonProps) {
  const [hovered, setHovered] = useState(false)
  const [active, setActive] = useState(false)

  const getStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '6px 8px',
      borderRadius: '8px',
      transition: 'all 0.15s ease',
      border: 'none',
      outline: 'none',
      background: 'transparent',
    }
    if (disabled) {
      return { ...base, opacity: 0.3, cursor: 'not-allowed' }
    }
    if (active) {
      return { ...base, backgroundColor: 'rgba(59, 130, 246, 0.15)', cursor: 'pointer' }
    }
    if (hovered) {
      return { ...base, backgroundColor: 'rgba(59, 130, 246, 0.08)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer' }
    }
    return { ...base, cursor: 'pointer' }
  }

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      style={getStyle()}
      title={title}
      aria-label={ariaLabel}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setActive(false) }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
    >
      {children}
    </button>
  )
}

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  onFormatApplied: () => void
  value: string
  onChange: (value: string) => void
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  onUploadImage?: () => void
  onSearchReplace?: () => void
  focusMode?: boolean
  typewriterMode?: boolean
  onToggleFocusMode?: () => void
  onToggleTypewriterMode?: () => void
  onInsertFootnote?: () => void
  onInsertInlineMath?: () => void
  onInsertBlockMath?: () => void
  onInsertMathTemplate?: (template: string, mode: 'inline' | 'block', isTemplate: boolean) => void
  onOpenFile?: () => void
  onSaveAs?: () => void
  onTogglePreview?: () => void
  showPreview?: boolean
  onOptimizeImages?: () => void
  onOpenFrontMatter?: () => void
}

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
  '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔',
  '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '🤚',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️',
  '⭐', '🌟', '✨', '⚡', '🔥', '💯', '🎉', '🎊', '🏆', '🥇',
  '📌', '📎', '🔗', '📧', '📞', '💬', '📝', '📋', '📁', '📂',
]

const CODE_LANGUAGES = [
  { label: '纯文本', value: '' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C/C++', value: 'cpp' },
  { label: 'C#', value: 'csharp' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'PHP', value: 'php' },
  { label: 'Swift', value: 'swift' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'SQL', value: 'sql' },
  { label: 'Shell/Bash', value: 'bash' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'XML', value: 'xml' },
  { label: 'Markdown', value: 'markdown' },
]

export default function MarkdownToolbar({ textareaRef, onFormatApplied, value, onChange, canUndo = false, canRedo = false, onUndo, onRedo, onUploadImage, onSearchReplace, focusMode = false, typewriterMode = false, onToggleFocusMode, onToggleTypewriterMode, onInsertFootnote, onInsertInlineMath: _onInsertInlineMath, onInsertBlockMath: _onInsertBlockMath, onInsertMathTemplate, onOpenFile, onSaveAs, onTogglePreview, showPreview = true, onOptimizeImages, onOpenFrontMatter }: MarkdownToolbarProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showCodeLangPicker, setShowCodeLangPicker] = useState(false)
    const [mathPopoverMode, setMathPopoverMode] = useState<'inline' | 'block' | null>(null)
    const [showListMenu, setShowListMenu] = useState(false)
    const inlineMathRef = useRef<HTMLButtonElement>(null)
    const blockMathRef = useRef<HTMLButtonElement>(null)
    const listMenuRef = useRef<HTMLButtonElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const codeLangPickerRef = useRef<HTMLDivElement>(null)
  const codeLangBtnRef = useRef<HTMLButtonElement>(null)
  const emojiBtnRef = useRef<HTMLButtonElement>(null)
  const [codeLangPos, setCodeLangPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [emojiPos, setEmojiPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (codeLangPickerRef.current && !codeLangPickerRef.current.contains(e.target as Node)) {
        setShowCodeLangPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!showCodeLangPicker || !codeLangBtnRef.current) return
    const rect = codeLangBtnRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    let left = rect.left
    if (left + 180 > viewportWidth - 12) left = viewportWidth - 180 - 12
    if (left < 12) left = 12
    setCodeLangPos({ top: rect.bottom + 4, left })
  }, [showCodeLangPicker])

  useEffect(() => {
    if (!showEmojiPicker || !emojiBtnRef.current) return
    const rect = emojiBtnRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    let left = rect.left
    if (left + 320 > viewportWidth - 12) left = viewportWidth - 320 - 12
    if (left < 12) left = 12
    setEmojiPos({ top: rect.bottom + 4, left })
  }, [showEmojiPicker])

  const applyFormat = useCallback((
    formatter: (text: string, selectionStart: number, selectionEnd: number) => {
      newText: string
      newCursorStart: number
      newCursorEnd: number
    }
  ) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const { selectionStart, selectionEnd, value } = textarea
    const result = formatter(value, selectionStart, selectionEnd)

    textarea.value = result.newText
    textarea.selectionStart = result.newCursorStart
    textarea.selectionEnd = result.newCursorEnd

    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    onFormatApplied()
  }, [textareaRef, onFormatApplied])

  const wrapSelection = useCallback((wrapper: string) => {
    applyFormat((text, selectionStart, selectionEnd) => {
      if (selectionStart !== selectionEnd) {
        const before = text.substring(0, selectionStart)
        const selected = text.substring(selectionStart, selectionEnd)
        const after = text.substring(selectionEnd)
        const wrapped = wrapper + selected + wrapper
        return {
          newText: before + wrapped + after,
          newCursorStart: selectionStart + wrapper.length,
          newCursorEnd: selectionEnd + wrapper.length
        }
      } else {
        const before = text.substring(0, selectionStart)
        const after = text.substring(selectionEnd)
        const insertText = wrapper + wrapper
        return {
          newText: before + insertText + after,
          newCursorStart: selectionStart + wrapper.length,
          newCursorEnd: selectionEnd + wrapper.length
        }
      }
    })
  }, [applyFormat])

  const insertAtLineStart = useCallback((prefix: string) => {
    applyFormat((text, selectionStart, selectionEnd) => {
      const lines = text.split('\n')
      let charCount = 0
      let startLineIndex = 0
      let endLineIndex = 0

      for (let i = 0; i < lines.length; i++) {
        const lineStart = charCount
        const lineEnd = charCount + lines[i].length

        if (lineStart <= selectionStart && lineEnd >= selectionStart) startLineIndex = i
        if (lineStart <= selectionEnd && lineEnd >= selectionEnd) endLineIndex = i

        charCount += lines[i].length + 1
      }

      for (let i = startLineIndex; i <= endLineIndex; i++) {
        if (lines[i].trim().startsWith(prefix)) {
          lines[i] = lines[i].substring(prefix.length)
        } else {
          lines[i] = prefix + lines[i]
        }
      }

      return {
        newText: lines.join('\n'),
        newCursorStart: selectionStart,
        newCursorEnd: selectionEnd
      }
    })
  }, [applyFormat])

  const insertHeading = useCallback(() => {
    applyFormat((text, selectionStart, selectionEnd) => {
      const lines = text.split('\n')
      let charCount = 0
      let currentLineIndex = 0

      for (let i = 0; i < lines.length; i++) {
        const lineStart = charCount
        const lineEnd = charCount + lines[i].length

        if (lineStart <= selectionStart && lineEnd >= selectionStart) {
          currentLineIndex = i
          break
        }

        charCount += lines[i].length + 1
      }

      const line = lines[currentLineIndex]
      const headingMatch = line.match(/^(#{1,6})\s/)
      
      if (headingMatch) {
        const currentLevel = headingMatch[1].length
        if (currentLevel < 6) {
          lines[currentLineIndex] = '#'.repeat(currentLevel + 1) + ' ' + line.substring(currentLevel + 1)
        } else {
          lines[currentLineIndex] = line.substring(headingMatch[0].length)
        }
      } else {
        lines[currentLineIndex] = '# ' + line
      }

      return {
        newText: lines.join('\n'),
        newCursorStart: selectionStart,
        newCursorEnd: selectionEnd
      }
    })
  }, [applyFormat])

  const insertLink = useCallback(() => {
    applyFormat((text, selectionStart, selectionEnd) => {
      const selected = text.substring(selectionStart, selectionEnd)
      const before = text.substring(0, selectionStart)
      const after = text.substring(selectionEnd)
      
      const linkText = selected || '链接文字'
      const linkMarkdown = '[' + linkText + '](url)'
      
      return {
        newText: before + linkMarkdown + after,
        newCursorStart: selectionStart + linkText.length + 3,
        newCursorEnd: selectionStart + linkText.length + 6
      }
    })
  }, [applyFormat])

  const insertCodeBlock = useCallback((language: string = '') => {
    applyFormat((text, selectionStart, selectionEnd) => {
      const selectedText = text.substring(selectionStart, selectionEnd)
      const trimmedSelection = selectedText.trim()
      
      const hasCodeBlockMarkers = trimmedSelection.startsWith('```') && trimmedSelection.endsWith('```')
      
      if (hasCodeBlockMarkers) {
        const innerContent = trimmedSelection.slice(3, -3)
        const firstNewline = innerContent.indexOf('\n')
        const codeContent = firstNewline >= 0 ? innerContent.substring(firstNewline + 1).trim() : innerContent.trim()
        return {
          newText: text.substring(0, selectionStart) + codeContent + text.substring(selectionEnd),
          newCursorStart: selectionStart,
          newCursorEnd: selectionStart + codeContent.length
        }
      }

      const before = text.substring(0, selectionStart)
      const after = text.substring(selectionEnd)
      
      const needNewlineBefore = before.length > 0 && !before.endsWith('\n')
      const needNewlineAfter = after.length > 0 && !after.startsWith('\n')
      
      const prefix = needNewlineBefore ? '\n' : ''
      const suffix = needNewlineAfter ? '\n' : ''
      
      let codeBlock: string
      let cursorPos: number
      
      if (trimmedSelection) {
        codeBlock = `${prefix}\`\`\`${language}\n${trimmedSelection}\n\`\`\`${suffix}`
        cursorPos = before.length + prefix.length + 3 + language.length + 1
      } else {
        codeBlock = `${prefix}\`\`\`${language}\n\n\`\`\`${suffix}`
        cursorPos = before.length + prefix.length + 3 + language.length + 1
      }
      
      const newText = before + codeBlock + after
      
      return {
        newText,
        newCursorStart: cursorPos,
        newCursorEnd: cursorPos
      }
    })
    setShowCodeLangPicker(false)
  }, [applyFormat])

  const insertInlineCode = useCallback(() => {
    applyFormat((text, selectionStart, selectionEnd) => {
      if (selectionStart !== selectionEnd) {
        const before = text.substring(0, selectionStart)
        const selected = text.substring(selectionStart, selectionEnd)
        const after = text.substring(selectionEnd)
        return {
          newText: before + '`' + selected + '`' + after,
          newCursorStart: selectionStart + 1,
          newCursorEnd: selectionEnd + 1
        }
      } else {
        const before = text.substring(0, selectionStart)
        const after = text.substring(selectionEnd)
        return {
          newText: before + '``' + after,
          newCursorStart: selectionStart + 1,
          newCursorEnd: selectionEnd + 1
        }
      }
    })
  }, [applyFormat])

  const insertHorizontalLine = useCallback(() => {
    applyFormat((text, selectionStart, selectionEnd) => {
      const before = text.substring(0, selectionStart)
      const after = text.substring(selectionEnd)
      const needNewlineBefore = before.length > 0 && !before.endsWith('\n')
      const insertText = (needNewlineBefore ? '\n' : '') + '---\n'
      return {
        newText: before + insertText + after,
        newCursorStart: selectionStart + insertText.length,
        newCursorEnd: selectionStart + insertText.length
      }
    })
  }, [applyFormat])

  const insertTaskList = useCallback(() => {
    applyFormat((text, selectionStart, selectionEnd) => {
      const lines = text.split('\n')
      let charCount = 0
      let startLineIndex = 0
      let endLineIndex = 0

      for (let i = 0; i < lines.length; i++) {
        const lineStart = charCount
        const lineEnd = charCount + lines[i].length

        if (lineStart <= selectionStart && lineEnd >= selectionStart) startLineIndex = i
        if (lineStart <= selectionEnd && lineEnd >= selectionEnd) endLineIndex = i

        charCount += lines[i].length + 1
      }

      for (let i = startLineIndex; i <= endLineIndex; i++) {
        const trimmed = lines[i].trimStart()
        const indent = lines[i].substring(0, lines[i].length - trimmed.length)
        if (trimmed.startsWith('- [ ] ')) {
          lines[i] = indent + trimmed.substring(6)
        } else if (trimmed.startsWith('- [x] ')) {
          lines[i] = indent + trimmed.substring(6)
        } else {
          lines[i] = indent + '- [ ] ' + trimmed
        }
      }

      return {
        newText: lines.join('\n'),
        newCursorStart: selectionStart,
        newCursorEnd: selectionEnd
      }
    })
  }, [applyFormat])

  const indentLines = useCallback(() => {
    applyFormat((text, selectionStart, selectionEnd) => {
      const lines = text.split('\n')
      let charCount = 0
      let startLineIndex = 0
      let endLineIndex = 0

      for (let i = 0; i < lines.length; i++) {
        const lineStart = charCount
        const lineEnd = charCount + lines[i].length

        if (lineStart <= selectionStart && lineEnd >= selectionStart) startLineIndex = i
        if (lineStart <= selectionEnd && lineEnd >= selectionEnd) endLineIndex = i

        charCount += lines[i].length + 1
      }

      for (let i = startLineIndex; i <= endLineIndex; i++) {
        if (lines[i].trim().length > 0) {
          lines[i] = '  ' + lines[i]
        }
      }

      const addedChars = 2 * (endLineIndex - startLineIndex + 1)
      return {
        newText: lines.join('\n'),
        newCursorStart: selectionStart + 2,
        newCursorEnd: selectionEnd + addedChars
      }
    })
  }, [applyFormat])

  const outdentLines = useCallback(() => {
    applyFormat((text, selectionStart, selectionEnd) => {
      const lines = text.split('\n')
      let charCount = 0
      let startLineIndex = 0
      let endLineIndex = 0

      for (let i = 0; i < lines.length; i++) {
        const lineStart = charCount
        const lineEnd = charCount + lines[i].length

        if (lineStart <= selectionStart && lineEnd >= selectionStart) startLineIndex = i
        if (lineStart <= selectionEnd && lineEnd >= selectionEnd) endLineIndex = i

        charCount += lines[i].length + 1
      }

      let removedChars = 0
      for (let i = startLineIndex; i <= endLineIndex; i++) {
        if (lines[i].startsWith('    ')) {
          lines[i] = lines[i].substring(4)
          removedChars += 4
        } else if (lines[i].startsWith('  ')) {
          lines[i] = lines[i].substring(2)
          removedChars += 2
        } else if (lines[i].startsWith('\t')) {
          lines[i] = lines[i].substring(1)
          removedChars += 1
        }
      }

      return {
        newText: lines.join('\n'),
        newCursorStart: Math.max(0, selectionStart - 2),
        newCursorEnd: Math.max(0, selectionEnd - removedChars)
      }
    })
  }, [applyFormat])

  const insertEmoji = useCallback((emoji: string) => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const { selectionStart, value: currentValue } = textarea
    const newText = currentValue.substring(0, selectionStart) + emoji + currentValue.substring(selectionStart)
    onChange(newText)
    setShowEmojiPicker(false)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(selectionStart + emoji.length, selectionStart + emoji.length)
      }
    }, 0)
  }, [textareaRef, onChange])

  const insertMindmap = useCallback(() => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const { selectionStart, value: currentValue } = textarea
    const mindmapText = '```mermaid\nmindmap\n  root((中心主题))\n    子主题1\n    子主题2\n      孙主题1\n      孙主题2\n```'
    const newText = currentValue.substring(0, selectionStart) + mindmapText + currentValue.substring(selectionStart)
    onChange(newText)
    onFormatApplied()
  }, [textareaRef, onChange, onFormatApplied])

  return (
    <div
      className="format-toolbar flex items-center flex-wrap relative"
      style={{ backgroundColor: 'var(--editor-bg)', padding: '6px 12px', gap: '2px' }}
    >
      <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: 'linear-gradient(to bottom, var(--button-primary), #a78bfa)', marginRight: '8px', flexShrink: 0 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, var(--button-primary), #a78bfa, #f472b6)' }} />
      <ToolbarButton
        onClick={onUndo || noop}
        title="撤销 (Ctrl+Z)"
        ariaLabel="撤销"
        disabled={!canUndo}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={onRedo || noop}
        title="重做 (Ctrl+Y)"
        ariaLabel="重做"
        disabled={!canRedo}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
        </svg>
      </ToolbarButton>

      <div style={{ width: '1px', height: '20px', borderRadius: '1px', backgroundColor: 'var(--editor-border)', margin: '0 6px' }} />

      <ToolbarButton
        onClick={() => wrapSelection('**')}
        title="加粗 (Ctrl+B)"
        ariaLabel="加粗文本"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => wrapSelection('*')}
        title="斜体 (Ctrl+I)"
        ariaLabel="斜体文本"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 4h4M10 20h4M14 4l-4 16" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={insertInlineCode}
        title="行内代码 (Ctrl+`)"
        ariaLabel="行内代码"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 4l4 4-4 4M7 4L3 8l4 4" />
        </svg>
      </ToolbarButton>

      <div style={{ width: '1px', height: '20px', borderRadius: '1px', backgroundColor: 'var(--editor-border)', margin: '0 6px' }} />

      <ToolbarButton
        onClick={insertHeading}
        title="标题 (Ctrl+1)"
        ariaLabel="插入标题"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h8" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => setShowListMenu(!showListMenu)}
        title="列表"
        ariaLabel="插入列表"
        buttonRef={listMenuRef}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h.01M8 6h12M4 12h.01M8 12h12M4 18h.01M8 18h12" />
        </svg>
      </ToolbarButton>

      <ListMenuPopover
        isOpen={showListMenu}
        onClose={() => setShowListMenu(false)}
        anchorEl={listMenuRef.current}
        onInsertUnordered={() => insertAtLineStart('- ')}
        onInsertOrdered={() => insertAtLineStart('1. ')}
        onInsertTask={insertTaskList}
        onIndent={indentLines}
        onOutdent={outdentLines}
      />

      <ToolbarButton
        onClick={() => insertAtLineStart('> ')}
        title="引用"
        ariaLabel="插入引用"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={insertHorizontalLine}
        title="水平分割线"
        ariaLabel="插入水平分割线"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
        </svg>
      </ToolbarButton>

      <div style={{ width: '1px', height: '20px', borderRadius: '1px', backgroundColor: 'var(--editor-border)', margin: '0 6px' }} />

      <ToolbarButton
        onClick={insertLink}
        title="链接"
        ariaLabel="插入链接"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={onInsertFootnote || noop}
        title="插入脚注 (Ctrl+Shift+N)"
        ariaLabel="插入脚注"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => setMathPopoverMode(mathPopoverMode === 'inline' ? null : 'inline')}
        title="行内公式 (Ctrl+M)"
        ariaLabel="插入行内公式"
        buttonRef={inlineMathRef}
      >
        <span className="text-xs font-mono font-bold" style={{ fontFamily: "'Fira Code', 'Consolas', monospace" }}>ƒ(x)</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => setMathPopoverMode(mathPopoverMode === 'block' ? null : 'block')}
        title="块级公式 (Ctrl+Shift+M)"
        ariaLabel="插入块级公式"
        buttonRef={blockMathRef}
      >
        <span className="text-xs font-mono font-bold" style={{ fontFamily: "'Fira Code', 'Consolas', monospace" }}>∫</span>
      </ToolbarButton>

      <MathPopover
        isOpen={mathPopoverMode !== null}
        onClose={() => setMathPopoverMode(null)}
        mode={mathPopoverMode || 'inline'}
        anchorEl={
          mathPopoverMode === 'inline'
            ? inlineMathRef.current
            : blockMathRef.current
        }
        onInsert={(latex, isTemplate) => {
          if (onInsertMathTemplate) {
            onInsertMathTemplate(latex, mathPopoverMode || 'inline', isTemplate)
          }
        }}
      />

      <div ref={codeLangPickerRef}>
        <ToolbarButton
          onClick={() => { setShowCodeLangPicker(!showCodeLangPicker); setShowEmojiPicker(false) }}
          title="代码块 (Ctrl+Shift+K)"
          ariaLabel="插入代码块"
          buttonRef={codeLangBtnRef}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </ToolbarButton>
        {showCodeLangPicker && createPortal(
          <div
            ref={codeLangPickerRef}
            style={{
              position: 'fixed',
              top: `${codeLangPos.top}px`,
              left: `${codeLangPos.left}px`,
              zIndex: 9999,
              border: '1px solid var(--editor-border)',
              borderRadius: '8px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              maxHeight: '256px',
              overflowY: 'auto',
              minWidth: '160px',
              padding: '4px 0',
              backgroundColor: 'var(--editor-bg)',
            }}
          >
            {CODE_LANGUAGES.map(lang => (
              <div
                key={lang.value}
                style={{
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--editor-text)',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sidebar-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => insertCodeBlock(lang.value ? ` ${lang.value}` : '')}
              >
                {lang.label}
              </div>
            ))}
          </div>,
          document.body
        )}
      </div>

      <div ref={emojiPickerRef}>
        <ToolbarButton
          onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowCodeLangPicker(false) }}
          title="插入特殊符号"
          ariaLabel="插入特殊符号"
          buttonRef={emojiBtnRef}
        >
          <span className="text-sm">😊</span>
        </ToolbarButton>
        {showEmojiPicker && createPortal(
          <div
            ref={emojiPickerRef}
            style={{
              position: 'fixed',
              top: `${emojiPos.top}px`,
              left: `${emojiPos.left}px`,
              zIndex: 9999,
              width: '320px',
              border: '1px solid var(--editor-border)',
              borderRadius: '8px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              padding: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: '4px',
              maxHeight: '192px',
              overflowY: 'auto',
              backgroundColor: 'var(--editor-bg)',
            }}
          >
            {EMOJI_LIST.map((emoji, index) => (
              <button
                key={index}
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'transparent',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sidebar-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => insertEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>

      <div style={{ width: '1px', height: '20px', borderRadius: '1px', backgroundColor: 'var(--editor-border)', margin: '0 6px' }} />

      <TableToolbar 
        textareaRef={textareaRef} 
        onFormatApplied={onFormatApplied}
        value={value}
        onChange={onChange}
      />

      <div style={{ width: '1px', height: '20px', borderRadius: '1px', backgroundColor: 'var(--editor-border)', margin: '0 6px' }} />

      <ToolbarButton
        onClick={insertMindmap}
        title="思维导图"
        ariaLabel="插入思维导图"
      >
        <span className="text-sm font-bold">📊</span>
      </ToolbarButton>

      <div style={{ width: '1px', height: '20px', borderRadius: '1px', backgroundColor: 'var(--editor-border)', margin: '0 6px' }} />

      <ToolbarButton
        onClick={onUploadImage || noop}
        title="上传图片"
        ariaLabel="上传图片"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={onOptimizeImages || noop}
        title="优化图片 (Base64 转本地文件)"
        ariaLabel="优化图片"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={onSearchReplace || noop}
        title="搜索与替换 (Ctrl+F)"
        ariaLabel="搜索与替换"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </ToolbarButton>

      <div className="flex-1" />

      <div style={{ width: '1px', height: '20px', borderRadius: '1px', backgroundColor: 'var(--editor-border)', margin: '0 6px' }} />

      <ToolbarButton
        onClick={onOpenFile || noop}
        title="打开文件"
        ariaLabel="打开 Markdown 文件"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={onSaveAs || noop}
        title="另存为"
        ariaLabel="另存为"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={onOpenFrontMatter || noop}
        title="文章元信息"
        ariaLabel="文章元信息"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={onTogglePreview || noop}
        title={showPreview ? '关闭预览' : '打开预览'}
        ariaLabel={showPreview ? '关闭预览' : '打开预览'}
      >
        {showPreview ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </ToolbarButton>

      <div style={{ width: '1px', height: '20px', borderRadius: '1px', backgroundColor: 'var(--editor-border)', margin: '0 6px' }} />

      <button
        onClick={onToggleFocusMode}
        className="flex items-center gap-1"
        style={{
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 500,
          fontFamily: "'Inter', -apple-system, sans-serif",
          transition: 'all 0.15s ease',
          backgroundColor: focusMode ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
          color: focusMode ? 'var(--link-color)' : 'var(--editor-text)',
          border: focusMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid var(--editor-border)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.3)';
          if (!focusMode) e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = focusMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid var(--editor-border)';
          e.currentTarget.style.backgroundColor = focusMode ? 'rgba(59, 130, 246, 0.1)' : 'transparent';
        }}
        title="专注模式 (Ctrl+Shift+F)"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
        <span>专注</span>
      </button>

      <button
        onClick={onToggleTypewriterMode}
        className="flex items-center gap-1"
        style={{
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 500,
          fontFamily: "'Inter', -apple-system, sans-serif",
          transition: 'all 0.15s ease',
          backgroundColor: typewriterMode ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
          color: typewriterMode ? 'var(--link-color)' : 'var(--editor-text)',
          border: typewriterMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid var(--editor-border)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.3)';
          if (!typewriterMode) e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = typewriterMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid var(--editor-border)';
          e.currentTarget.style.backgroundColor = typewriterMode ? 'rgba(59, 130, 246, 0.1)' : 'transparent';
        }}
        title="打字机模式 (Ctrl+Shift+T)"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h8" />
        </svg>
        <span>打字机</span>
      </button>
    </div>
  )
}
