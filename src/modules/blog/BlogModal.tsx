import { useState, useCallback, useRef, useEffect } from 'react'
import { generateBlog, downloadBlogAsZip, generateSingleFileBlog, BlogGenerationResult } from './blogGenerator'
import { BlogConfig, DEFAULT_BLOG_CONFIG } from './blogTemplates'
import { parseFrontMatter } from './frontMatter'

interface BlogModalProps {
  isOpen: boolean
  onClose: () => void
  files: Array<{ name: string; content: string }>
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

interface FileInfo {
  name: string
  title: string
  date: string
  tags: string[]
  draft: boolean
}

const fsAccessSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window

function getErrorInfo(err: unknown): { name: string; message: string } {
  if (err instanceof Error) {
    return { name: err.name, message: err.message || '未知错误' }
  }
  return { name: '', message: '未知错误' }
}

function extractFileInfo(file: { name: string; content: string }): FileInfo {
  const { frontMatter, content } = parseFrontMatter(file.content)
  const title = frontMatter.title || (() => {
    const match = content.match(/^#\s+(.+)$/m)
    return match ? match[1].trim() : file.name.replace(/\.md$/, '')
  })()

  return {
    name: file.name,
    title,
    date: frontMatter.date || '',
    tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : [],
    draft: frontMatter.draft === true,
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function BlogModal({ isOpen, onClose, files, onSuccess, onError }: BlogModalProps) {
  const [config, setConfig] = useState<BlogConfig>({ ...DEFAULT_BLOG_CONFIG })
  const [result, setResult] = useState<BlogGenerationResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const previewUrlRef = useRef<string | null>(null)

  const mdFiles = files.filter(f => f.name.endsWith('.md'))
  const fileInfos = mdFiles.map(extractFileInfo)
  const publishedCount = fileInfos.filter(f => !f.draft).length

  useEffect(() => {
    if (isOpen) {
      setConfig({ ...DEFAULT_BLOG_CONFIG })
      setResult(null)
      setIsGenerating(false)
      setIsDownloading(false)
      setError(null)
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
      setPreviewUrl(null)
    }
  }, [isOpen])

  useEffect(() => {
    previewUrlRef.current = previewUrl
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleGenerate = useCallback(() => {
    setIsGenerating(true)
    setError(null)
    try {
      const genResult = generateBlog(mdFiles, {
        siteTitle: config.siteTitle,
        siteDescription: config.siteDescription,
        author: config.author,
        siteUrl: config.siteUrl,
        language: config.language,
        theme: config.theme,
      })
      setResult(genResult)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      onSuccess(`博客生成成功！共 ${genResult.posts.length} 篇文章，${genResult.files.length} 个文件`)
    } catch (err) {
      const { message: msg } = getErrorInfo(err)
      setError(`生成失败: ${msg}`)
      onError(`博客生成失败: ${msg}`)
    } finally {
      setIsGenerating(false)
    }
  }, [mdFiles, config, previewUrl, onSuccess, onError])

  const handleDownloadFolder = useCallback(async () => {
    if (!result) return
    setIsDownloading(true)
    setError(null)
    try {
      await downloadBlogAsZip(result)
      onSuccess('博客文件已保存到所选文件夹')
    } catch (err) {
      const { name, message: msg } = getErrorInfo(err)
      if (name === 'AbortError') {
        setIsDownloading(false)
        return
      }
      setError(`下载失败: ${msg}`)
      onError(`博客下载失败: ${msg}`)
    } finally {
      setIsDownloading(false)
    }
  }, [result, onSuccess, onError])

  const handleDownloadSingleFile = useCallback(() => {
    if (!result) return
    setIsDownloading(true)
    setError(null)
    try {
      const html = generateSingleFileBlog(
        result.posts.map(p => ({
          name: p.slug,
          content: p.rawContent,
          frontMatter: {
            title: p.title,
            date: p.date,
            tags: p.tags,
            category: p.category,
            description: p.description,
            author: p.author,
            coverImage: p.coverImage,
            draft: p.draft,
          },
        })),
        result.config
      )
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'blog.html'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      onSuccess('单文件博客已下载')
    } catch (err) {
      const { message: msg } = getErrorInfo(err)
      setError(`下载失败: ${msg}`)
      onError(`单文件下载失败: ${msg}`)
    } finally {
      setIsDownloading(false)
    }
  }, [result, onSuccess, onError])

  const handlePreview = useCallback(() => {
    if (!result) return

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const html = generateSingleFileBlog(
      result.posts.map(p => ({
        name: p.slug,
        content: p.rawContent,
        frontMatter: {
          title: p.title,
          date: p.date,
          tags: p.tags,
          category: p.category,
          description: p.description,
          author: p.author,
          coverImage: p.coverImage,
          draft: p.draft,
        },
      })),
      result.config
    )
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)
    window.open(url, '_blank')
  }, [result, previewUrl])

  const totalSize = result
    ? result.files.reduce((sum, f) => sum + new Blob([f.content]).size, 0)
    : 0

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
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="生成博客"
        style={{
          width: 800,
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
            生成博客
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
          gap: 20,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--editor-text)', opacity: 0.8, fontFamily: "'Inter', -apple-system, sans-serif" }}>
                  站点标题
                </label>
                <input
                  type="text"
                  value={config.siteTitle}
                  onChange={(e) => setConfig(prev => ({ ...prev, siteTitle: e.target.value }))}
                  placeholder="My Blog"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 14,
                    border: '1px solid var(--editor-border)',
                    borderRadius: 6,
                    backgroundColor: 'var(--editor-bg)',
                    color: 'var(--editor-text)',
                    outline: 'none',
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--link-color)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--editor-border)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--editor-text)', opacity: 0.8, fontFamily: "'Inter', -apple-system, sans-serif" }}>
                  站点描述
                </label>
                <textarea
                  value={config.siteDescription}
                  onChange={(e) => setConfig(prev => ({ ...prev, siteDescription: e.target.value }))}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 14,
                    border: '1px solid var(--editor-border)',
                    borderRadius: 6,
                    backgroundColor: 'var(--editor-bg)',
                    color: 'var(--editor-text)',
                    outline: 'none',
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--link-color)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--editor-border)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--editor-text)', opacity: 0.8, fontFamily: "'Inter', -apple-system, sans-serif" }}>
                  作者
                </label>
                <input
                  type="text"
                  value={config.author}
                  onChange={(e) => setConfig(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Anonymous"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 14,
                    border: '1px solid var(--editor-border)',
                    borderRadius: 6,
                    backgroundColor: 'var(--editor-bg)',
                    color: 'var(--editor-text)',
                    outline: 'none',
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--link-color)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--editor-border)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--editor-text)', opacity: 0.8, fontFamily: "'Inter', -apple-system, sans-serif" }}>
                  站点 URL
                </label>
                <input
                  type="text"
                  value={config.siteUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, siteUrl: e.target.value }))}
                  placeholder="https://example.com"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 14,
                    border: '1px solid var(--editor-border)',
                    borderRadius: 6,
                    backgroundColor: 'var(--editor-bg)',
                    color: 'var(--editor-text)',
                    outline: 'none',
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--link-color)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--editor-border)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--editor-text)', opacity: 0.8, fontFamily: "'Inter', -apple-system, sans-serif" }}>
                  主题
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, theme: 'light' }))}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 500,
                      border: config.theme === 'light' ? '2px solid var(--link-color)' : '1px solid var(--editor-border)',
                      borderRadius: 6,
                      backgroundColor: config.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      color: 'var(--editor-text)',
                      cursor: 'pointer',
                      fontFamily: "'Inter', -apple-system, sans-serif",
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ☀️ 浅色
                  </button>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, theme: 'dark' }))}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 500,
                      border: config.theme === 'dark' ? '2px solid var(--link-color)' : '1px solid var(--editor-border)',
                      borderRadius: 6,
                      backgroundColor: config.theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      color: 'var(--editor-text)',
                      cursor: 'pointer',
                      fontFamily: "'Inter', -apple-system, sans-serif",
                      transition: 'all 0.15s ease',
                    }}
                  >
                    🌙 深色
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--editor-text)', opacity: 0.8, fontFamily: "'Inter', -apple-system, sans-serif" }}>
                  语言
                </label>
                <select
                  value={config.language}
                  onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 14,
                    border: '1px solid var(--editor-border)',
                    borderRadius: 6,
                    backgroundColor: 'var(--editor-bg)',
                    color: 'var(--editor-text)',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--link-color)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--editor-border)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <option value="zh-CN">中文 (zh-CN)</option>
                  <option value="en">English (en)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--editor-text)', opacity: 0.8, fontFamily: "'Inter', -apple-system, sans-serif" }}>
                  文件预览
                </label>
                <span style={{ fontSize: 11, color: 'var(--editor-text)', opacity: 0.5, fontFamily: "'Inter', -apple-system, sans-serif" }}>
                  共 {mdFiles.length} 个文件，{publishedCount} 个已发布
                </span>
              </div>
              <div style={{
                border: '1px solid var(--editor-border)',
                borderRadius: 6,
                maxHeight: 340,
                overflowY: 'auto',
                backgroundColor: 'var(--editor-bg)',
              }}>
                {fileInfos.length === 0 ? (
                  <div style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--editor-text)',
                    opacity: 0.5,
                    fontSize: 13,
                    fontFamily: "'Inter', -apple-system, sans-serif",
                  }}>
                    没有 Markdown 文件
                  </div>
                ) : (
                  fileInfos.map((fi, idx) => (
                    <div
                      key={fi.name}
                      style={{
                        padding: '8px 12px',
                        borderBottom: idx < fileInfos.length - 1 ? '1px solid var(--editor-border)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--editor-text)',
                          fontFamily: "'Inter', -apple-system, sans-serif",
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {fi.title}
                        </span>
                        {fi.draft && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 3,
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#d97706',
                            fontFamily: "'Inter', -apple-system, sans-serif",
                            flexShrink: 0,
                          }}>
                            草稿
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: 'var(--editor-text)',
                        opacity: 0.5,
                        fontFamily: "'Inter', -apple-system, sans-serif",
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}>
                        <span>{fi.name}</span>
                        {fi.date && <span>{fi.date}</span>}
                        {fi.tags.length > 0 && (
                          <span>{fi.tags.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || mdFiles.length === 0}
              style={{
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 6,
                border: 'none',
                cursor: isGenerating || mdFiles.length === 0 ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--button-primary)',
                color: '#ffffff',
                fontFamily: "'Inter', -apple-system, sans-serif",
                opacity: isGenerating || mdFiles.length === 0 ? 0.5 : 1,
                transition: 'background-color 0.15s ease, opacity 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--button-primary)' }}
            >
              {isGenerating ? '生成中...' : '生成博客'}
            </button>

            {result && (
              <>
                <button
                  onClick={handleDownloadFolder}
                  disabled={isDownloading}
                  style={{
                    padding: '8px 20px',
                    fontSize: 13,
                    fontWeight: 500,
                    borderRadius: 6,
                    border: '1px solid var(--editor-border)',
                    cursor: isDownloading ? 'not-allowed' : 'pointer',
                    backgroundColor: 'transparent',
                    color: 'var(--editor-text)',
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    opacity: isDownloading ? 0.5 : 1,
                    transition: 'background-color 0.15s ease, opacity 0.15s ease',
                  }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {isDownloading ? '下载中...' : '下载博客（文件夹）'}
                </button>
                <button
                  onClick={handleDownloadSingleFile}
                  disabled={isDownloading}
                  style={{
                    padding: '8px 20px',
                    fontSize: 13,
                    fontWeight: 500,
                    borderRadius: 6,
                    border: '1px solid var(--editor-border)',
                    cursor: isDownloading ? 'not-allowed' : 'pointer',
                    backgroundColor: 'transparent',
                    color: 'var(--editor-text)',
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    opacity: isDownloading ? 0.5 : 1,
                    transition: 'background-color 0.15s ease, opacity 0.15s ease',
                  }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  下载博客（单文件）
                </button>
              </>
            )}
          </div>

          {!fsAccessSupported && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 6,
              fontSize: 12,
              color: '#b45309',
              fontFamily: "'Inter', -apple-system, sans-serif",
              lineHeight: 1.4,
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>当前浏览器不支持文件夹选择，"下载博客（文件夹）"将回退为单文件下载</span>
            </div>
          )}

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              backgroundColor: 'rgba(220, 53, 69, 0.08)',
              border: '1px solid rgba(220, 53, 69, 0.2)',
              borderRadius: 6,
              fontSize: 12,
              color: '#dc3545',
              fontFamily: "'Inter', -apple-system, sans-serif",
              lineHeight: 1.4,
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div style={{
              border: '1px solid var(--editor-border)',
              borderRadius: 6,
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                backgroundColor: 'rgba(59, 130, 246, 0.06)',
                borderBottom: '1px solid var(--editor-border)',
              }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--editor-text)',
                  fontFamily: "'Inter', -apple-system, sans-serif",
                }}>
                  生成结果（{result.files.length} 个文件，总大小 {formatSize(totalSize)}）
                </span>
                <button
                  onClick={handlePreview}
                  style={{
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 4,
                    border: '1px solid var(--link-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--link-color)',
                    cursor: 'pointer',
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  预览
                </button>
              </div>
              <div style={{
                maxHeight: 200,
                overflowY: 'auto',
                backgroundColor: 'var(--editor-bg)',
              }}>
                {result.files.map((file, idx) => (
                  <div
                    key={file.path}
                    style={{
                      padding: '6px 12px',
                      borderBottom: idx < result.files.length - 1 ? '1px solid var(--editor-border)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{
                      fontSize: 12,
                      fontFamily: "'Fira Code', 'Consolas', monospace",
                      color: 'var(--editor-text)',
                      opacity: 0.8,
                    }}>
                      {file.path}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontFamily: "'Inter', -apple-system, sans-serif",
                      color: 'var(--editor-text)',
                      opacity: 0.4,
                    }}>
                      {formatSize(new Blob([file.content]).size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              backgroundColor: 'transparent',
              color: 'var(--editor-text)',
              cursor: 'pointer',
              fontFamily: "'Inter', -apple-system, sans-serif",
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
