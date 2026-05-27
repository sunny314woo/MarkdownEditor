import type { ThemeType } from '../settings/ThemeContext'
import { useRef, useCallback, useEffect, useState, forwardRef, ForwardedRef } from 'react'
import TurndownService from 'turndown'
import ScrollButtons from '../shared/ScrollButtons'

interface PreviewProps {
  content: string
  theme: ThemeType
  onToggleTheme: () => void
  onScroll?: (scrollPosition: number, element: HTMLElement) => void
  onContentChange?: (markdown: string) => void
  onDeleteImage?: (imageIndex: number) => void
}

const copyToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
  }
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      resolve()
    } catch (err) {
      reject(err)
    } finally {
      document.body.removeChild(textarea)
    }
  })
}

const Preview = forwardRef(function Preview(
  { content, theme, onToggleTheme, onScroll, onContentChange, onDeleteImage }: PreviewProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const turndownServiceRef = useRef<TurndownService | null>(null)

  useEffect(() => {
    turndownServiceRef.current = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
      strongDelimiter: '**'
    })

    turndownServiceRef.current.addRule('code', {
      filter: ['pre'],
      replacement: function(content, node) {
        const pre = node as HTMLElement
        const codeElement = pre.querySelector('code')
        if (codeElement) {
          const className = codeElement.className
          const langMatch = className.match(/language-(\w+)/)
          const lang = langMatch ? langMatch[1] : ''
          const code = codeElement.textContent || ''
          return '\n```' + lang + '\n' + code.trim() + '\n```\n'
        }
        return '\n```\n' + content.trim() + '\n```\n'
      }
    })

    turndownServiceRef.current.addRule('codeBlockWrapper', {
      filter: function(node) {
        return node.classList && node.classList.contains('code-block-wrapper')
      },
      replacement: function(content) {
        return content
      }
    })

    turndownServiceRef.current.addRule('codeBlockHeader', {
      filter: function(node) {
        return node.classList && (node.classList.contains('code-block-header') || node.classList.contains('code-block-footer'))
      },
      replacement: function() {
        return ''
      }
    })

    turndownServiceRef.current.addRule('codeBlockBody', {
      filter: function(node) {
        return node.classList && node.classList.contains('code-block-body')
      },
      replacement: function(content) {
        return content
      }
    })

    turndownServiceRef.current.addRule('mermaid', {
      filter: function(node) {
        return node.classList && node.classList.contains('mermaid-diagram')
      },
      replacement: function() {
        return ''
      }
    })

    turndownServiceRef.current.addRule('katexDisplay', {
      filter: function(node) {
        return node.classList && node.classList.contains('katex-display-wrapper')
      },
      replacement: function(_content, node) {
        const el = node as HTMLElement
        const formula = el.getAttribute('title') || ''
        return '\n$$' + formula + '$$\n'
      }
    })

    turndownServiceRef.current.addRule('katexInline', {
      filter: function(node) {
        return node.classList && node.classList.contains('katex-inline-wrapper')
      },
      replacement: function(_content, node) {
        const el = node as HTMLElement
        const formula = el.getAttribute('title') || ''
        return '$' + formula + '$'
      }
    })

    turndownServiceRef.current.addRule('katexError', {
      filter: function(node) {
        return node.classList && node.classList.contains('katex-error-wrapper')
      },
      replacement: function(_content, node) {
        const el = node as HTMLElement
        const formula = el.getAttribute('title') || ''
        const formulaEl = el.querySelector('.katex-error-formula')
        const formulaText = formulaEl?.textContent || formula
        if (el.classList.contains('katex-error-display')) {
          return '\n$$' + formulaText + '$$\n'
        }
        return '$' + formulaText + '$'
      }
    })
  }, [])

  const handlePreviewScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) {
      onScroll(e.currentTarget.scrollTop, e.currentTarget)
    }
  }, [onScroll])

  const originalHtmlRef = useRef('')

  const handleContentInput = useCallback(() => {
    if (!onContentChange || isSyncing) return

    const debounceTimer = setTimeout(() => {
      if (!previewContainerRef.current || !turndownServiceRef.current) return

      const html = previewContainerRef.current.innerHTML
      let cleanHtml = html.replace(/<div class="mermaid-diagram"[^>]*>[\s\S]*?<\/div>/g, '')
      cleanHtml = cleanHtml.replace(/<div class="preview-image-container"[^>]*>/g, '')
      cleanHtml = cleanHtml.replace(/<button class="preview-image-delete-btn"[^>]*>[\s\S]*?<\/button>/g, '')

      try {
        const markdown = turndownServiceRef.current.turndown(cleanHtml)
        if (markdown !== undefined && markdown !== null && markdown.trim() !== '') {
          onContentChange(markdown)
        }
      } catch (error) {
        console.error('HTML to Markdown conversion failed:', error)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [onContentChange, isSyncing])

  const attachDeleteButtons = useCallback(() => {
    const container = previewContainerRef.current
    if (!container) return

    const images = container.querySelectorAll('.markdown-preview img, img')
    images.forEach((img, index) => {
      const imgEl = img as HTMLImageElement
      const parent = imgEl.parentElement
      if (parent && parent.classList.contains('preview-image-container')) return

      const wrapper = document.createElement('div')
      wrapper.className = 'preview-image-container'
      wrapper.setAttribute('data-image-index', String(index))

      const deleteBtn = document.createElement('button')
      deleteBtn.className = 'preview-image-delete-btn'
      deleteBtn.setAttribute('data-image-index', String(index))
      deleteBtn.setAttribute('title', '删除图片')
      deleteBtn.setAttribute('aria-label', '删除图片')
      deleteBtn.innerHTML = '&times;'

      imgEl.parentNode?.insertBefore(wrapper, imgEl)
      wrapper.appendChild(imgEl)
      wrapper.appendChild(deleteBtn)
    })
  }, [])

  useEffect(() => {
    if (previewContainerRef.current && content !== originalHtmlRef.current) {
      setIsSyncing(true)
      const currentScrollTop = previewContainerRef.current.scrollTop
      originalHtmlRef.current = content
      previewContainerRef.current.innerHTML = content
      previewContainerRef.current.scrollTop = currentScrollTop
      requestAnimationFrame(() => {
        attachDeleteButtons()
      })
      setTimeout(() => setIsSyncing(false), 50)
    }
  }, [content, attachDeleteButtons])

  useEffect(() => {
    if (previewContainerRef.current) {
      previewContainerRef.current.innerHTML = content
      originalHtmlRef.current = content
      requestAnimationFrame(() => {
        attachDeleteButtons()
      })
    }
  }, [content, attachDeleteButtons])

  useEffect(() => {
    if (typeof ref === 'function') {
      ref(previewContainerRef.current)
    } else if (ref) {
      ref.current = previewContainerRef.current
    }
  }, [ref])

  useEffect(() => {
    const container = previewContainerRef.current
    if (!container) return

    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement

      const link = target.closest('a') as HTMLAnchorElement
      if (link && link.getAttribute('href')?.startsWith('#')) {
        e.preventDefault()
        e.stopPropagation()
        const href = link.getAttribute('href') || ''
        const targetId = href.slice(1)
        const targetElement = document.getElementById(targetId)
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        return
      }

      const deleteBtn = target.closest('.preview-image-delete-btn') as HTMLElement
      if (deleteBtn) {
        e.preventDefault()
        e.stopPropagation()
        const imageIndex = parseInt(deleteBtn.getAttribute('data-image-index') || '-1', 10)
        if (imageIndex >= 0 && onDeleteImage) {
          onDeleteImage(imageIndex)
        }
        return
      }

      const copyBtn = target.closest('.code-copy-btn') as HTMLElement
      if (copyBtn) {
        e.preventDefault()
        e.stopPropagation()
        const wrapper = copyBtn.closest('.code-block-wrapper')
        if (!wrapper) return
        const codeEl = wrapper.querySelector('code')
        if (!codeEl) return
        const text = codeEl.textContent || ''

        try {
          await copyToClipboard(text)
          copyBtn.textContent = '已复制'
          copyBtn.classList.add('copied')
          setTimeout(() => {
            copyBtn.textContent = '复制'
            copyBtn.classList.remove('copied')
          }, 2000)
        } catch {
          copyBtn.textContent = '失败'
          setTimeout(() => {
            copyBtn.textContent = '复制'
          }, 2000)
        }
        return
      }

      const foldBtn = target.closest('.code-fold-btn') as HTMLElement
      if (foldBtn) {
        e.preventDefault()
        e.stopPropagation()
        const wrapper = foldBtn.closest('.code-block-wrapper')
        if (!wrapper) return
        const body = wrapper.querySelector('.code-block-body') as HTMLElement
        if (!body) return
        const isCollapsed = wrapper.classList.contains('code-block-collapsed')

        if (isCollapsed) {
          body.style.maxHeight = body.scrollHeight + 'px'
          wrapper.classList.remove('code-block-collapsed')
          foldBtn.textContent = '收起'
          foldBtn.title = '收起代码'
          const footer = wrapper.querySelector('.code-block-footer') as HTMLElement
          if (footer) footer.style.display = 'none'
          const onEnd = () => {
            body.style.maxHeight = 'none'
            body.removeEventListener('transitionend', onEnd)
          }
          body.addEventListener('transitionend', onEnd)
        } else {
          body.style.maxHeight = body.scrollHeight + 'px'
          requestAnimationFrame(() => {
            body.style.maxHeight = '150px'
            wrapper.classList.add('code-block-collapsed')
            foldBtn.textContent = '展开'
            foldBtn.title = '展开代码'
            const footer = wrapper.querySelector('.code-block-footer') as HTMLElement
            if (footer) footer.style.display = ''
          })
        }
        return
      }

      const footer = target.closest('.code-block-footer') as HTMLElement
      if (footer) {
        e.preventDefault()
        e.stopPropagation()
        const wrapper = footer.closest('.code-block-wrapper')
        if (!wrapper) return
        const body = wrapper.querySelector('.code-block-body') as HTMLElement
        if (!body) return
        const foldBtn2 = wrapper.querySelector('.code-fold-btn') as HTMLElement

        body.style.maxHeight = body.scrollHeight + 'px'
        wrapper.classList.remove('code-block-collapsed')
        if (foldBtn2) {
          foldBtn2.textContent = '收起'
          foldBtn2.title = '收起代码'
        }
        footer.style.display = 'none'
        const onEnd = () => {
          body.style.maxHeight = 'none'
          body.removeEventListener('transitionend', onEnd)
        }
        body.addEventListener('transitionend', onEnd)
        return
      }
    }

    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [onDeleteImage])

  return (
    <div className="h-full flex flex-col">
      <div className="preview-toolbar px-4 py-3 flex items-center justify-between" style={{ position: 'relative' }}>
        <div className="flex items-center gap-3">
          <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: 'linear-gradient(to bottom, var(--button-primary), #a78bfa)' }} />
          <span style={{ color: 'var(--toolbar-text)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>Preview</span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="transition-all duration-200"
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: isEditing ? 'var(--button-primary)' : 'rgba(59, 130, 246, 0.08)',
              border: isEditing ? 'none' : '1px solid rgba(59, 130, 246, 0.15)',
              color: isEditing ? 'white' : 'var(--button-primary)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isEditing ? 'var(--button-primary)' : 'rgba(59, 130, 246, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isEditing ? 'var(--button-primary)' : 'rgba(59, 130, 246, 0.08)'
            }}
            aria-label={isEditing ? '退出编辑模式' : '进入编辑模式'}
            title={isEditing ? '退出编辑模式' : '进入编辑模式'}
          >
            {isEditing ? '编辑中' : '编辑'}
          </button>
        </div>
        <button
          onClick={onToggleTheme}
          className="flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            '--tw-ring-offset-color': 'var(--toolbar-bg)' as string,
            '--tw-ring-color': theme === 'dark' ? '#fbbf24' : '#3b82f6'
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          aria-label={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
          title={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fbbf24' }}>
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, var(--button-primary), #a78bfa, #f472b6)' }} />
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={previewContainerRef}
          className="preview-container h-full overflow-y-auto px-6 py-4 markdown-preview"
          data-theme={theme}
          onScroll={handlePreviewScroll}
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          onInput={handleContentInput}
        />
        <ScrollButtons scrollContainerRef={previewContainerRef} />
      </div>
    </div>
  )
})

export default Preview
