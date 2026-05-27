import { useState, useCallback, useRef, useEffect } from 'react'

interface TableEditorProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  onFormatApplied: () => void
  onClose: () => void
  value: string
  onChange: (value: string) => void
}

interface TableData {
  cells: string[][]
  alignment: ('left' | 'center' | 'right')[]
}

export default function TableEditor({ textareaRef, onFormatApplied, onClose, value, onChange }: TableEditorProps) {
  const [tableData, setTableData] = useState<TableData>({
    cells: [
      ['  表头1  ', '  表头2  ', '  表头3  '],
      ['  内容1  ', '  内容2  ', '  内容3  '],
      ['  内容4  ', '  内容5  ', '  内容6  ']
    ],
    alignment: ['left', 'left', 'left']
  })
  const modalRef = useRef<HTMLDivElement>(null)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // 更新单元格内容
  const updateCell = useCallback((row: number, col: number, value: string) => {
    setTableData(prev => {
      const newCells = prev.cells.map((r, ri) => 
        r.map((c, ci) => ri === row && ci === col ? value : c)
      )
      return { ...prev, cells: newCells }
    })
  }, [])

  // 设置列对齐
  const setColumnAlignment = useCallback((col: number, align: 'left' | 'center' | 'right') => {
    setTableData(prev => {
      const newAlignment = [...prev.alignment]
      newAlignment[col] = align
      return { ...prev, alignment: newAlignment }
    })
  }, [])

  // 插入行
  const insertRow = useCallback((afterRow: number) => {
    setTableData(prev => {
      const newCells = [...prev.cells]
      const newRow = Array(prev.cells[0].length).fill('  内容  ')
      newCells.splice(afterRow + 1, 0, newRow)
      return { ...prev, cells: newCells }
    })
  }, [])

  // 删除行
  const deleteRow = useCallback((rowIndex: number) => {
    if (tableData.cells.length <= 1) {
      alert('至少需要保留一行！')
      return
    }
    setTableData(prev => {
      const newCells = prev.cells.filter((_, i) => i !== rowIndex)
      return { ...prev, cells: newCells }
    })
  }, [tableData.cells.length])

  // 插入列
  const insertColumn = useCallback((afterCol: number) => {
    setTableData(prev => {
      const newCells = prev.cells.map(row => {
        const newRow = [...row]
        newRow.splice(afterCol + 1, 0, '  内容  ')
        return newRow
      })
      const newAlignment = [...prev.alignment]
      newAlignment.splice(afterCol + 1, 0, 'left')
      return { cells: newCells, alignment: newAlignment }
    })
  }, [])

  // 删除列
  const deleteColumn = useCallback((colIndex: number) => {
    if (tableData.cells[0].length <= 1) {
      alert('至少需要保留一列！')
      return
    }
    setTableData(prev => {
      const newCells = prev.cells.map(row => row.filter((_, i) => i !== colIndex))
      const newAlignment = prev.alignment.filter((_, i) => i !== colIndex)
      return { cells: newCells, alignment: newAlignment }
    })
  }, [tableData.cells])

  // 生成Markdown表格
  const generateMarkdown = useCallback(() => {
    const { cells, alignment } = tableData
    
    if (cells.length === 0 || cells[0].length === 0) {
      return ''
    }

    const lines: string[] = []

    // 表头行
    lines.push(cells[0].join(' | '))

    // 分隔行
    const separators = alignment.map(align => {
      switch (align) {
        case 'left': return ':---'
        case 'center': return ':---:'
        case 'right': return '---:'
        default: return '---'
      }
    })
    lines.push(separators.join(' | '))

    // 数据行
    for (let i = 1; i < cells.length; i++) {
      lines.push(cells[i].join(' | '))
    }

    return '\n' + lines.join('\n') + '\n'
  }, [tableData])

  // 插入表格到编辑器
  const insertTable = useCallback(() => {
    const markdown = generateMarkdown()
    
    if (!markdown.trim()) {
      alert('表格不能为空！')
      return
    }

    const textarea = textareaRef.current
    let start = 0
    if (textarea) {
      start = textarea.selectionStart
    }

    // 安全检查：确保value有值
    const safeValue = value || ''
    const before = safeValue.substring(0, start)
    const after = safeValue.substring(start)
    const newText = before + markdown + after

    onChange(newText)
    
    // 设置光标位置
    const restoreCursorPosition = () => {
      if (textareaRef.current) {
        const newCursorPos = start + 1
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }
    
    setTimeout(restoreCursorPosition, 50)
    
    onFormatApplied()
    onClose()
  }, [generateMarkdown, value, onChange, textareaRef, onFormatApplied, onClose])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div
        ref={modalRef}
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          padding: '24px',
          backgroundColor: 'var(--editor-bg)',
          color: 'var(--editor-text)',
          border: '1px solid var(--editor-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--editor-text)' }}>表格编辑器</h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--editor-text)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sidebar-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ marginBottom: '24px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {tableData.cells.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      style={{
                        position: 'relative',
                        padding: '4px',
                        border: '1px solid var(--editor-border)',
                        backgroundColor: rowIndex === 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      }}
                    >
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        onFocus={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                        style={{
                          width: '100%',
                          padding: '4px',
                          fontSize: '14px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: 'var(--editor-text)',
                          textAlign: tableData.alignment[colIndex] as CanvasTextAlign,
                        }}
                      />
                      
                      {selectedCell?.row === rowIndex && selectedCell?.col === colIndex && (
                        <div style={{ position: 'absolute', top: '-32px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '4px', zIndex: 10 }}>
                          <button
                            onClick={() => insertRow(rowIndex)}
                            style={{ padding: '2px 8px', backgroundColor: '#22c55e', color: '#fff', fontSize: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                            title="插入行"
                          >
                            +行
                          </button>
                          {rowIndex > 0 && (
                            <button
                              onClick={() => deleteRow(rowIndex)}
                              style={{ padding: '2px 8px', backgroundColor: '#ef4444', color: '#fff', fontSize: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                              title="删除行"
                            >
                              -行
                            </button>
                          )}
                          <button
                            onClick={() => insertColumn(colIndex)}
                            style={{ padding: '2px 8px', backgroundColor: '#3b82f6', color: '#fff', fontSize: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                            title="插入列"
                          >
                            +列
                          </button>
                          {colIndex > 0 && (
                            <button
                              onClick={() => deleteColumn(colIndex)}
                              style={{ padding: '2px 8px', backgroundColor: '#ef4444', color: '#fff', fontSize: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                              title="删除列"
                            >
                              -列
                            </button>
                          )}
                        </div>
                      )}

                      {rowIndex === 0 && (
                        <div style={{ position: 'absolute', bottom: '-32px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          <button
                            onClick={() => setColumnAlignment(colIndex, 'left')}
                            style={{
                              padding: '2px 6px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: tableData.alignment[colIndex] === 'left' ? 'var(--button-primary)' : 'var(--sidebar-bg)',
                              color: tableData.alignment[colIndex] === 'left' ? '#fff' : 'var(--sidebar-text)',
                            }}
                          >
                            ←
                          </button>
                          <button
                            onClick={() => setColumnAlignment(colIndex, 'center')}
                            style={{
                              padding: '2px 6px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: tableData.alignment[colIndex] === 'center' ? 'var(--button-primary)' : 'var(--sidebar-bg)',
                              color: tableData.alignment[colIndex] === 'center' ? '#fff' : 'var(--sidebar-text)',
                            }}
                          >
                            ↔
                          </button>
                          <button
                            onClick={() => setColumnAlignment(colIndex, 'right')}
                            style={{
                              padding: '2px 6px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: tableData.alignment[colIndex] === 'right' ? 'var(--button-primary)' : 'var(--sidebar-bg)',
                              color: tableData.alignment[colIndex] === 'right' ? '#fff' : 'var(--sidebar-text)',
                            }}
                          >
                            →
                          </button>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => insertRow(tableData.cells.length - 1)}
            style={{ padding: '4px 12px', backgroundColor: '#22c55e', color: '#fff', fontSize: '14px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            + 添加行
          </button>
          <button
            onClick={() => insertColumn(tableData.cells[0].length - 1)}
            style={{ padding: '4px 12px', backgroundColor: '#3b82f6', color: '#fff', fontSize: '14px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            + 添加列
          </button>
        </div>

        <div style={{ marginBottom: '24px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--preview-bg)' }}>
          <div style={{ fontSize: '12px', color: 'var(--sidebar-text)', marginBottom: '8px' }}>Markdown预览:</div>
          <pre style={{ fontSize: '14px', overflow: 'auto', whiteSpace: 'pre-wrap', color: 'var(--editor-text)' }}>{generateMarkdown()}</pre>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={insertTable}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--button-primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--button-primary)'}
          >
            插入表格
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid var(--editor-border)',
              backgroundColor: 'var(--sidebar-bg)',
              color: 'var(--sidebar-text)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
