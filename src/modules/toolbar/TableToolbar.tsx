import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import TableEditor from './TableEditor'

interface TableToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  onFormatApplied: () => void
  value: string
  onChange: (value: string) => void
}

type Alignment = 'left' | 'center' | 'right'

export default function TableToolbar({ textareaRef, onFormatApplied, value, onChange }: TableToolbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [alignment, setAlignment] = useState<Alignment>('left')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return

    const updatePosition = () => {
      const rect = triggerRef.current!.getBoundingClientRect()
      const panelWidth = 300
      const panelHeight = 480
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let left = rect.left
      if (left + panelWidth > viewportWidth - 12) {
        left = viewportWidth - panelWidth - 12
      }
      if (left < 12) left = 12

      let top = rect.bottom + 4
      if (top + panelHeight > viewportHeight - 12) {
        top = rect.top - panelHeight - 4
      }

      setPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const generateMarkdownTable = useCallback((numRows: number, numCols: number, align: Alignment) => {
    if (numRows < 1 || numCols < 1) {
      return null
    }

    const headerRow = Array(numCols).fill('  表头  ').join(' | ')
    
    const separatorChar = {
      left: ':---',
      center: ':---:',
      right: '---:'
    }[align]
    const separatorRow = Array(numCols).fill(separatorChar).join(' | ')

    const bodyRows = []
    for (let i = 0; i < numRows - 1; i++) {
      bodyRows.push(Array(numCols).fill('  内容  ').join(' | '))
    }

    const table = [
      headerRow,
      separatorRow,
      ...bodyRows
    ].join('\n')

    return '\n' + table + '\n'
  }, [])

  const insertTable = useCallback(() => {
    const textarea = textareaRef.current
    const tableMarkdown = generateMarkdownTable(rows, cols, alignment)

    if (!tableMarkdown) return

    let start = 0
    if (textarea) {
      start = textarea.selectionStart
    }

    const safeValue = value || ''
    const before = safeValue.substring(0, start)
    const after = safeValue.substring(start)
    const newText = before + tableMarkdown + after
    
    onChange(newText)
    
    const restoreCursorPosition = () => {
      if (textareaRef.current) {
        const newCursorPos = start + 1
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }
    
    setTimeout(restoreCursorPosition, 50)
    
    onFormatApplied()
    setIsOpen(false)
  }, [rows, cols, alignment, generateMarkdownTable, value, onChange, textareaRef, onFormatApplied])

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="插入表格"
        aria-label="插入表格"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 9999,
            backgroundColor: 'var(--editor-bg)',
            color: 'var(--editor-text)',
            border: '1px solid var(--editor-border)',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            minWidth: '280px',
            padding: '16px',
          }}
          role="dialog"
          aria-label="插入表格"
        >
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--editor-text)' }}>插入表格</h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block', color: 'var(--sidebar-text)' }}>行数: {rows}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block', color: 'var(--sidebar-text)' }}>列数: {cols}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={cols}
              onChange={(e) => setCols(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block', color: 'var(--sidebar-text)' }}>对齐方式:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setAlignment('left')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: alignment === 'left' ? 'var(--button-primary)' : 'var(--sidebar-bg)',
                  color: alignment === 'left' ? '#fff' : 'var(--sidebar-text)',
                  transition: 'all 0.15s ease',
                }}
              >
                左对齐
              </button>
              <button
                onClick={() => setAlignment('center')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: alignment === 'center' ? 'var(--button-primary)' : 'var(--sidebar-bg)',
                  color: alignment === 'center' ? '#fff' : 'var(--sidebar-text)',
                  transition: 'all 0.15s ease',
                }}
              >
                居中
              </button>
              <button
                onClick={() => setAlignment('right')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: alignment === 'right' ? 'var(--button-primary)' : 'var(--sidebar-bg)',
                  color: alignment === 'right' ? '#fff' : 'var(--sidebar-text)',
                  transition: 'all 0.15s ease',
                }}
              >
                右对齐
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '16px', overflow: 'auto' }}>
            <div style={{ fontSize: '12px', color: 'var(--sidebar-text)', marginBottom: '4px' }}>预览:</div>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <tbody>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array.from({ length: cols }).map((_, colIndex) => (
                      <td
                        key={colIndex}
                        style={{
                          padding: '4px',
                          border: '1px solid var(--editor-border)',
                          backgroundColor: rowIndex === 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          textAlign: alignment,
                          color: 'var(--editor-text)',
                        }}
                      >
                        {rowIndex === 0 ? '表头' : '内容'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={insertTable}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--button-primary)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: '8px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--button-primary)'}
          >
            快速插入
          </button>
          
          <button
            onClick={() => {
              setShowEditor(true)
              setIsOpen(false)
            }}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--editor-border)',
              backgroundColor: 'var(--sidebar-bg)',
              color: 'var(--sidebar-text)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            高级编辑器...
          </button>
        </div>,
        document.body
      )}

      {showEditor && (
        <TableEditor
          textareaRef={textareaRef}
          onFormatApplied={onFormatApplied}
          onClose={() => setShowEditor(false)}
          value={value}
          onChange={onChange}
        />
      )}
    </>
  )
}
