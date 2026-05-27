import { useEffect, useState, useRef, useCallback } from 'react'
import katex from 'katex'

interface InlineMathPreviewProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  value: string
  focusMode: boolean
}

interface FormulaInfo {
  formula: string
  displayMode: boolean
  startPos: number
  endPos: number
}

interface PreviewState {
  visible: boolean
  formula: string
  displayMode: boolean
  renderedHtml: string
  position: { x: number; y: number }
  isError: boolean
}

const DEBOUNCE_MS = 150

function findFormulaAtCursor(text: string, cursorPos: number): FormulaInfo | null {
  if (cursorPos < 0 || cursorPos > text.length) return null

  let i = 0
  while (i < text.length) {
    if (text[i] === '\\' && i + 1 < text.length && text[i + 1] === '$') {
      i += 2
      continue
    }

    if (text[i] === '$') {
      if (i + 1 < text.length && text[i + 1] === '$') {
        const start = i
        i += 2
        const formulaStart = i

        while (i < text.length) {
          if (text[i] === '$' && i + 1 < text.length && text[i + 1] === '$') {
            const formulaEnd = i
            const end = i + 2

            if (cursorPos > start && cursorPos < end) {
              return {
                formula: text.substring(formulaStart, formulaEnd),
                displayMode: true,
                startPos: start,
                endPos: end,
              }
            }
            i = end
            break
          }
          i++
        }
        if (i >= text.length && cursorPos > start && cursorPos < text.length) {
          return {
            formula: text.substring(formulaStart),
            displayMode: true,
            startPos: start,
            endPos: text.length,
          }
        }
      } else {
        const start = i
        i++
        const formulaStart = i

        while (i < text.length) {
          if (text[i] === '$') {
            const formulaEnd = i
            const end = i + 1

            if (cursorPos > start && cursorPos < end) {
              const formula = text.substring(formulaStart, formulaEnd)
              if (formula.trim().length > 0 && !formula.includes('\n')) {
                return {
                  formula,
                  displayMode: false,
                  startPos: start,
                  endPos: end,
                }
              }
            }
            i = end
            break
          }
          if (text[i] === '\n') {
            if (cursorPos > start && cursorPos < i) {
              const formula = text.substring(formulaStart, i)
              if (formula.trim().length > 0) {
                return {
                  formula,
                  displayMode: false,
                  startPos: start,
                  endPos: i,
                }
              }
            }
            i++
            break
          }
          i++
        }
      }
    } else {
      i++
    }
  }

  return null
}

function isInCodeBlock(text: string, pos: number): boolean {
  const lines = text.split('\n')
  let currentPos = 0
  let inCodeBlock = false

  for (const line of lines) {
    const lineStart = currentPos
    const lineEnd = currentPos + line.length

    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
    }

    if (pos >= lineStart && pos <= lineEnd + 1) {
      return inCodeBlock && !line.trimStart().startsWith('```')
    }

    currentPos = lineEnd + 1
  }

  return false
}

function renderFormulaPreview(formula: string, displayMode: boolean): { html: string; isError: boolean } {
  try {
    const rendered = katex.renderToString(formula.trim(), {
      throwOnError: true,
      displayMode,
      output: 'html',
      strict: 'ignore',
      trust: true,
    })
    return { html: rendered, isError: false }
  } catch {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode,
        output: 'html',
        strict: 'ignore',
        trust: true,
      })
      return { html: rendered, isError: true }
    } catch {
      return { html: escapeHtml(formula), isError: true }
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getCursorPixelPosition(
  _textarea: HTMLTextAreaElement,
  scrollContainer: HTMLDivElement,
  cursorPos: number,
  text: string,
  focusMode: boolean
): { x: number; y: number } {
  const textBeforeCursor = text.substring(0, cursorPos)
  const lines = textBeforeCursor.split('\n')
  const lineNumber = lines.length - 1
  const colInLine = lines[lines.length - 1].length

  const lineHeight = focusMode ? 32 : 22.75
  const charWidth = focusMode ? 9.6 : 8.4
  const padding = 16

  const y = lineNumber * lineHeight + padding - scrollContainer.scrollTop
  const x = colInLine * charWidth + padding

  return { x, y }
}

const InlineMathPreview: React.FC<InlineMathPreviewProps> = ({
  textareaRef,
  scrollContainerRef,
  value,
  focusMode,
}) => {
  const [preview, setPreview] = useState<PreviewState>({
    visible: false,
    formula: '',
    displayMode: false,
    renderedHtml: '',
    position: { x: 0, y: 0 },
    isError: false,
  })

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ctrlPressedRef = useRef(false)
  const lastFormulaRef = useRef<string>('')

  const hidePreview = useCallback(() => {
    setPreview(prev => prev.visible ? { ...prev, visible: false } : prev)
    lastFormulaRef.current = ''
  }, [])

  const updatePreview = useCallback(() => {
    const textarea = textareaRef.current
    const scrollContainer = scrollContainerRef.current
    if (!textarea || !scrollContainer) return

    const cursorPos = textarea.selectionStart
    if (cursorPos === textarea.selectionEnd && cursorPos === textarea.selectionStart) {
      // cursor (no selection)
    } else {
      hidePreview()
      return
    }

    if (isInCodeBlock(value, cursorPos)) {
      hidePreview()
      return
    }

    const formulaInfo = findFormulaAtCursor(value, cursorPos)
    if (!formulaInfo || !formulaInfo.formula.trim()) {
      hidePreview()
      return
    }

    if (formulaInfo.formula === lastFormulaRef.current) {
      const pos = getCursorPixelPosition(textarea, scrollContainer, cursorPos, value, focusMode)
      setPreview(prev => ({
        ...prev,
        position: pos,
        visible: true,
      }))
      return
    }

    lastFormulaRef.current = formulaInfo.formula
    const { html, isError } = renderFormulaPreview(formulaInfo.formula, formulaInfo.displayMode)
    const pos = getCursorPixelPosition(textarea, scrollContainer, cursorPos, value, focusMode)

    setPreview({
      visible: true,
      formula: formulaInfo.formula,
      displayMode: formulaInfo.displayMode,
      renderedHtml: html,
      position: pos,
      isError,
    })
  }, [value, focusMode, textareaRef, scrollContainerRef, hidePreview])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hidePreview()
        return
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(updatePreview, DEBOUNCE_MS)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = true
      }
    }

    const handleKeyUpCtrl = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlPressedRef.current = false
      }
    }

    const handleClick = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(updatePreview, DEBOUNCE_MS)
    }

    const handleMouseOver = (_e: MouseEvent) => {
      if (!ctrlPressedRef.current) return
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(updatePreview, DEBOUNCE_MS)
    }

    textarea.addEventListener('keyup', handleKeyUp)
    textarea.addEventListener('keydown', handleKeyDown)
    textarea.addEventListener('keyup', handleKeyUpCtrl)
    textarea.addEventListener('click', handleClick)
    textarea.addEventListener('mouseover', handleMouseOver)

    return () => {
      textarea.removeEventListener('keyup', handleKeyUp)
      textarea.removeEventListener('keydown', handleKeyDown)
      textarea.removeEventListener('keyup', handleKeyUpCtrl)
      textarea.removeEventListener('click', handleClick)
      textarea.removeEventListener('mouseover', handleMouseOver)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [textareaRef, updatePreview, hidePreview])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hidePreview()
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [hidePreview])

  useEffect(() => {
    hidePreview()
  }, [value, hidePreview])

  if (!preview.visible || !preview.renderedHtml) return null

  const containerWidth = scrollContainerRef.current?.clientWidth || 600
  const previewWidth = preview.displayMode ? 360 : 280
  const leftPos = Math.min(
    preview.position.x,
    containerWidth - previewWidth - 20
  )

  return (
    <div
      className="inline-math-preview"
      style={{
        left: `${Math.max(8, leftPos)}px`,
        top: `${preview.position.y - 8}px`,
        maxWidth: `${previewWidth}px`,
      }}
    >
      <div className="inline-math-preview-label">
        {preview.displayMode ? '块级公式' : '行内公式'}
      </div>
      <div
        className={`inline-math-preview-content ${preview.isError ? 'inline-math-preview-error' : ''}`}
        dangerouslySetInnerHTML={{ __html: preview.renderedHtml }}
      />
      {preview.isError && (
        <div className="inline-math-preview-error-hint">公式语法有误</div>
      )}
    </div>
  )
}

export default InlineMathPreview
