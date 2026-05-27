import { useState, useEffect } from 'react'
import { parseFrontMatter, generateFrontMatter } from './frontMatter'

interface FrontMatterPanelProps {
  isOpen: boolean
  onClose: () => void
  content: string
  onContentChange: (newContent: string) => void
}

function getTodayString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 14,
  border: '1px solid var(--editor-border)',
  borderRadius: 6,
  backgroundColor: 'rgba(128, 128, 128, 0.08)',
  color: 'var(--editor-text)',
  outline: 'none',
  fontFamily: "'Inter', -apple-system, sans-serif",
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--editor-text)',
  opacity: 0.8,
  fontFamily: "'Inter', -apple-system, sans-serif",
}

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--link-color)'
  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)'
}

function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--editor-border)'
  e.currentTarget.style.boxShadow = 'none'
}

export default function FrontMatterPanel({ isOpen, onClose, content, onContentChange }: FrontMatterPanelProps) {
  const [titleValue, setTitleValue] = useState('')
  const [dateValue, setDateValue] = useState('')
  const [tagsValue, setTagsValue] = useState('')
  const [categoryValue, setCategoryValue] = useState('')
  const [descriptionValue, setDescriptionValue] = useState('')
  const [authorValue, setAuthorValue] = useState('')

  useEffect(() => {
    if (isOpen) {
      const parsed = parseFrontMatter(content)
      const fm = parsed.frontMatter
      setTitleValue(fm.title || '')
      setDateValue(fm.date || getTodayString())
      setTagsValue(Array.isArray(fm.tags) ? fm.tags.join(', ') : '')
      setCategoryValue(fm.category || '')
      setDescriptionValue(fm.description || '')
      setAuthorValue(fm.author || '')
    }
  }, [isOpen, content])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleApply = () => {
    const parsed = parseFrontMatter(content)
    const newFrontMatter = {
      title: titleValue,
      date: dateValue,
      tags: tagsValue.split(',').map(t => t.trim()).filter(Boolean),
      category: categoryValue,
      description: descriptionValue,
      author: authorValue,
    }
    const fmString = generateFrontMatter(newFrontMatter)
    const newContent = fmString + '\n' + parsed.content
    onContentChange(newContent)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="文章元信息"
        style={{
          width: 520,
          maxWidth: '90vw',
          maxHeight: '85vh',
          backgroundColor: 'var(--editor-bg)',
          color: 'var(--editor-text)',
          border: '1px solid var(--editor-border)',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--editor-border)',
          flexShrink: 0,
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
            fontFamily: "'Inter', -apple-system, sans-serif",
            color: 'var(--editor-text)',
          }}>
            文章元信息
          </h3>
          <button
            onClick={onClose}
            aria-label="关闭"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              border: 'none',
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--editor-text)',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              opacity: 0.7,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.15)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{
          padding: '16px 20px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>标题</label>
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              placeholder="文章标题"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>日期</label>
            <input
              type="text"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              placeholder="YYYY-MM-DD"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>标签</label>
            <input
              type="text"
              value={tagsValue}
              onChange={(e) => setTagsValue(e.target.value)}
              placeholder="用逗号分隔多个标签"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>分类</label>
            <input
              type="text"
              value={categoryValue}
              onChange={(e) => setCategoryValue(e.target.value)}
              placeholder="文章分类"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>描述</label>
            <textarea
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              placeholder="文章描述"
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>作者</label>
            <input
              type="text"
              value={authorValue}
              onChange={(e) => setAuthorValue(e.target.value)}
              placeholder="作者名称"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '12px 20px 16px',
          borderTop: '1px solid var(--editor-border)',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              border: '1px solid var(--editor-border)',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: 'var(--editor-text)',
              fontFamily: "'Inter', -apple-system, sans-serif",
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            取消
          </button>
          <button
            onClick={handleApply}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: 'var(--button-primary)',
              color: '#ffffff',
              fontFamily: "'Inter', -apple-system, sans-serif",
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--button-primary)' }}
          >
            应用
          </button>
        </div>
      </div>
    </div>
  )
}
