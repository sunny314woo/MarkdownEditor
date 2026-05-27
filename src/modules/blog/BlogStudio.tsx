import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { generateSingleFileBlog, generateBlog, downloadBlogAsZip, BlogGenerationResult } from './blogGenerator'
import { BlogConfig, ThemeStyle } from './blogTemplates'
import { parseFrontMatter } from './frontMatter'

interface BlogStudioProps {
  isOpen: boolean
  onClose: () => void
  currentFile: Array<{ name: string; content: string }>
}

interface BlogDesignConfig {
  siteTitle: string
  siteDescription: string
  author: string
  language: string
  layout: 'magazine' | 'minimal' | 'classic'
  colorScheme: 'warm' | 'ocean' | 'forest' | 'rose' | 'violet'
  theme: 'light' | 'dark'
  font: 'serif' | 'sans' | 'mono'
  themeStyle: ThemeStyle
}

const DEFAULT_DESIGN_CONFIG: BlogDesignConfig = {
  siteTitle: 'My Blog',
  siteDescription: 'A simple static blog',
  author: 'Anonymous',
  language: 'zh-CN',
  layout: 'magazine',
  colorScheme: 'warm',
  theme: 'light',
  font: 'serif',
  themeStyle: 'magazine',
}

const COLOR_SCHEMES: Array<{ key: BlogDesignConfig['colorScheme']; label: string; color: string }> = [
  { key: 'warm', label: '暖金', color: '#d97706' },
  { key: 'ocean', label: '海洋', color: '#0284c7' },
  { key: 'forest', label: '森林', color: '#059669' },
  { key: 'rose', label: '玫瑰', color: '#e11d48' },
  { key: 'violet', label: '紫罗兰', color: '#7c3aed' },
]

const FONT_OPTIONS: Array<{ key: BlogDesignConfig['font']; label: string; sample: string }> = [
  { key: 'serif', label: '衬线', sample: 'Playfair Display' },
  { key: 'sans', label: '无衬线', sample: 'Inter' },
  { key: 'mono', label: '等宽', sample: 'JetBrains Mono' },
]

const THEME_STYLE_OPTIONS: Array<{ key: ThemeStyle; label: string; desc: string; gradient: string; icon: string }> = [
  { key: 'magazine', label: '杂志', desc: 'Featured + Grid', gradient: 'linear-gradient(135deg, #d97706, #e11d48)', icon: 'M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h3v3H8V8zm5 0h3v3h-3V8zm-5 5h8v2H8v-2z' },
  { key: 'minimal', label: '极简', desc: 'Clean List', gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)', icon: 'M4 6h16M4 10h16M4 14h10M4 18h7' },
  { key: 'classic', label: '经典', desc: 'Cards + Sidebar', gradient: 'linear-gradient(135deg, #059669, #34d399)', icon: 'M4 4h8v8H4V4zm10 0h6v3h-6V4zm0 5h6v3h-6V9zM4 14h16v6H4v-6z' },
  { key: 'ink-wash', label: '水墨禅意', desc: '东方韵味', gradient: 'linear-gradient(135deg, #1a1a1a, #c23b22)', icon: 'M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm0 2c.5 0 1 .1 1.5.2C12.5 7 10 10 7 10.5 7.5 7 9.5 5 12 5z' },
  { key: 'terminal', label: '终端极客', desc: 'Hacker Style', gradient: 'linear-gradient(135deg, #0a0a0a, #00ff41)', icon: 'M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2l3 2-3 2m5 0h3' },
  { key: 'newspaper', label: '报纸编辑', desc: 'Newsprint', gradient: 'linear-gradient(135deg, #f5f0e1, #8b0000)', icon: 'M3 4h18v16H3V4zm2 2v12h14V6H5zm2 2h4v4H7V8zm6 0h4v1h-4V8zm0 3h4v1h-4v-1zm-6 3h10v1H7v-1z' },
  { key: 'glassmorphism', label: '玻璃拟态', desc: 'Frosted Glass', gradient: 'linear-gradient(135deg, #a78bfa, #f472b6, #38bdf8)', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { key: 'bento', label: '便当盒', desc: 'Grid Layout', gradient: 'linear-gradient(135deg, #fbbf24, #f97316, #ef4444)', icon: 'M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h5v8H3v-8zm8 0h10v8H11v-8z' },
  { key: 'narrative', label: '故事叙述', desc: 'Storytelling', gradient: 'linear-gradient(135deg, #92400e, #d97706, #fbbf24)', icon: 'M4 4h16v2H4V4zm0 4h12v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z' },
]

type LeftTab = 'style' | 'color' | 'content'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function designConfigToBlogConfig(design: BlogDesignConfig): Partial<BlogConfig> {
  return {
    siteTitle: design.siteTitle,
    siteDescription: design.siteDescription,
    author: design.author,
    language: design.language,
    theme: design.theme,
    layout: design.layout,
    colorScheme: design.colorScheme,
    font: design.font,
    themeStyle: design.themeStyle,
  }
}

export default function BlogStudio({ isOpen, onClose, currentFile }: BlogStudioProps) {
  const [designConfig, setDesignConfig] = useState<BlogDesignConfig>({ ...DEFAULT_DESIGN_CONFIG })
  const [result, setResult] = useState<BlogGenerationResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [leftTab, setLeftTab] = useState<LeftTab>('style')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [excludedFiles, setExcludedFiles] = useState<Set<string>>(new Set())
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mdFiles = useMemo(
    () => currentFile.filter(f => f.name.endsWith('.md')),
    [currentFile]
  )

  const selectedMdFiles = useMemo(
    () => mdFiles.filter(f => !excludedFiles.has(f.name)),
    [mdFiles, excludedFiles]
  )

  const totalWordCount = useMemo(() => {
    return selectedMdFiles.reduce((sum, f) => {
      const text = f.content.replace(/[#*_`~\[\]()>|+-]/g, '').trim()
      return sum + text.length
    }, 0)
  }, [selectedMdFiles])

  const updatePreview = useCallback((design: BlogDesignConfig) => {
    if (selectedMdFiles.length === 0) {
      setPreviewHtml('')
      return
    }
    try {
      const blogConfig = designConfigToBlogConfig(design)
      const html = generateSingleFileBlog(
        selectedMdFiles.map(f => {
          const parsed = parseFrontMatter(f.content)
          return {
            name: f.name.replace(/\.md$/, ''),
            content: parsed.content,
            frontMatter: parsed.frontMatter,
          }
        }),
        blogConfig
      )
      setPreviewHtml(html)
    } catch {
      setPreviewHtml('')
    }
  }, [selectedMdFiles])

  const debouncedUpdatePreview = useCallback((design: BlogDesignConfig) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      updatePreview(design)
    }, 500)
  }, [updatePreview])

  const handleDesignChange = useCallback(<K extends keyof BlogDesignConfig>(key: K, value: BlogDesignConfig[K]) => {
    setDesignConfig(prev => {
      const next = { ...prev, [key]: value }
      debouncedUpdatePreview(next)
      return next
    })
  }, [debouncedUpdatePreview])

  const updatePreviewRef = useRef(updatePreview)
  updatePreviewRef.current = updatePreview

  useEffect(() => {
    if (isOpen) {
      setDesignConfig({ ...DEFAULT_DESIGN_CONFIG })
      setResult(null)
      setIsGenerating(false)
      setIsDownloading(false)
      setPreviewHtml('')
      setError(null)
      setLeftTab('style')
      setPreviewDevice('desktop')
      setExcludedFiles(new Set())
      updatePreviewRef.current({ ...DEFAULT_DESIGN_CONFIG })
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || selectedMdFiles.length === 0) return
    debouncedUpdatePreview(designConfig)
  }, [selectedMdFiles])

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
      const blogConfig = designConfigToBlogConfig(designConfig)
      const genResult = generateBlog(selectedMdFiles, blogConfig)
      setResult(genResult)
    } catch (err: any) {
      const msg = err.message || '未知错误'
      setError(`生成失败: ${msg}`)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedMdFiles, designConfig])

  const handleDownloadFolder = useCallback(async () => {
    if (!result) return
    setIsDownloading(true)
    setError(null)
    try {
      await downloadBlogAsZip(result)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setIsDownloading(false)
        return
      }
      const msg = err.message || '未知错误'
      setError(`下载失败: ${msg}`)
    } finally {
      setIsDownloading(false)
    }
  }, [result])

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
    } catch (err: any) {
      const msg = err.message || '未知错误'
      setError(`下载失败: ${msg}`)
    } finally {
      setIsDownloading(false)
    }
  }, [result])

  const totalSize = result
    ? result.files.reduce((sum, f) => sum + new Blob([f.content]).size, 0)
    : 0

  const previewSize = previewHtml ? (new Blob([previewHtml]).size / 1024).toFixed(1) : ''

  if (!isOpen) return null

  const TAB_CONFIG: Array<{ key: LeftTab; label: string; icon: string }> = [
    { key: 'style', label: '风格', icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42' },
    { key: 'color', label: '配色', icon: 'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z' },
    { key: 'content', label: '内容', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  ]

  const DEVICE_CONFIG: Array<{ key: 'desktop' | 'tablet' | 'mobile'; label: string; width: string; icon: string }> = [
    { key: 'desktop', label: '桌面', width: '100%', icon: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z' },
    { key: 'tablet', label: '平板', width: '768px', icon: 'M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25V4.5a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z' },
    { key: 'mobile', label: '手机', width: '375px', icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3' },
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0f0f14',
      color: '#e4e4e7',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 52,
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, #a78bfa, #f472b6, #38bdf8)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>
              Blog Studio
            </span>
            <span style={{ fontSize: 11, opacity: 0.35, marginLeft: 8, fontWeight: 400 }}>
              创意博客工坊
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {mdFiles.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: 11,
              opacity: 0.6,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399' }} />
              {selectedMdFiles.length}/{mdFiles.length} 篇文档 · {totalWordCount.toLocaleString()} 字
            </div>
          )}
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{
          width: 300,
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            padding: '8px 8px 0',
            gap: 2,
          }}>
            {TAB_CONFIG.map(tab => (
              <button
                key={tab.key}
                onClick={() => setLeftTab(tab.key)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '7px 0',
                  border: 'none',
                  borderRadius: '6px 6px 0 0',
                  background: leftTab === tab.key
                    ? 'rgba(255,255,255,0.06)'
                    : 'transparent',
                  color: leftTab === tab.key
                    ? '#e4e4e7'
                    : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: leftTab === tab.key ? 600 : 400,
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
                {leftTab === tab.key && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 8,
                    right: 8,
                    height: 2,
                    borderRadius: 1,
                    background: 'linear-gradient(90deg, #a78bfa, #f472b6)',
                  }} />
                )}
              </button>
            ))}
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
          }}>
            {leftTab === 'style' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <SectionLabel>博客风格</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {THEME_STYLE_OPTIONS.map(opt => {
                      const isActive = designConfig.themeStyle === opt.key
                      return (
                        <button
                          key={opt.key}
                          onClick={() => {
                            handleDesignChange('themeStyle', opt.key)
                            if (opt.key === 'magazine' || opt.key === 'minimal' || opt.key === 'classic') {
                              handleDesignChange('layout', opt.key)
                            }
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            padding: '10px 4px 8px',
                            border: isActive
                              ? '1px solid rgba(167,139,250,0.5)'
                              : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 10,
                            backgroundColor: isActive
                              ? 'rgba(167,139,250,0.08)'
                              : 'rgba(255,255,255,0.02)',
                            color: isActive ? '#e4e4e7' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                            }
                          }}
                        >
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: opt.gradient,
                            flexShrink: 0,
                            boxShadow: isActive ? '0 2px 8px rgba(167,139,250,0.3)' : 'none',
                            transition: 'box-shadow 0.2s ease',
                          }} />
                          <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, lineHeight: 1.2 }}>
                            {opt.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <SectionLabel>主题模式</SectionLabel>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { key: 'light' as const, label: '浅色', icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' },
                      { key: 'dark' as const, label: '深色', icon: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z' },
                    ].map(opt => {
                      const isActive = designConfig.theme === opt.key
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleDesignChange('theme', opt.key)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '8px 0',
                            border: isActive
                              ? '1px solid rgba(167,139,250,0.5)'
                              : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 8,
                            background: isActive
                              ? 'rgba(167,139,250,0.08)'
                              : 'rgba(255,255,255,0.02)',
                            color: isActive ? '#e4e4e7' : 'rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 500,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
                          </svg>
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <SectionLabel>字体风格</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {FONT_OPTIONS.map(opt => {
                      const isActive = designConfig.font === opt.key
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleDesignChange('font', opt.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            border: isActive
                              ? '1px solid rgba(167,139,250,0.5)'
                              : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 8,
                            background: isActive
                              ? 'rgba(167,139,250,0.08)'
                              : 'rgba(255,255,255,0.02)',
                            color: isActive ? '#e4e4e7' : 'rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{opt.label}</span>
                          <span style={{
                            fontSize: 10,
                            opacity: 0.5,
                            fontFamily: opt.key === 'serif'
                              ? "'Playfair Display', Georgia, serif"
                              : opt.key === 'mono'
                                ? "'JetBrains Mono', monospace"
                                : "'Inter', sans-serif",
                          }}>
                            {opt.sample}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {leftTab === 'color' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <SectionLabel>配色方案</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {COLOR_SCHEMES.map(scheme => {
                      const isActive = designConfig.colorScheme === scheme.key
                      return (
                        <button
                          key={scheme.key}
                          onClick={() => handleDesignChange('colorScheme', scheme.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            border: isActive
                              ? '1px solid rgba(167,139,250,0.5)'
                              : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 8,
                            background: isActive
                              ? 'rgba(167,139,250,0.08)'
                              : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: scheme.color,
                            flexShrink: 0,
                            boxShadow: isActive
                              ? `0 0 0 2px #0f0f14, 0 0 0 4px ${scheme.color}40`
                              : 'none',
                            transition: 'box-shadow 0.2s ease',
                          }} />
                          <span style={{
                            fontSize: 12,
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? '#e4e4e7' : 'rgba(255,255,255,0.5)',
                          }}>
                            {scheme.label}
                          </span>
                          {isActive && (
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={scheme.color} strokeWidth={2.5} style={{ marginLeft: 'auto' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <SectionLabel>当前风格预览</SectionLabel>
                  <div style={{
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {(() => {
                      const activeStyle = THEME_STYLE_OPTIONS.find(s => s.key === designConfig.themeStyle)
                      const activeColor = COLOR_SCHEMES.find(c => c.key === designConfig.colorScheme)
                      return (
                        <div style={{ position: 'relative' }}>
                          <div style={{
                            height: 80,
                            background: activeStyle?.gradient || 'linear-gradient(135deg, #666, #999)',
                            position: 'relative',
                          }}>
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: 40,
                              background: 'linear-gradient(to top, rgba(15,15,20,0.8), transparent)',
                            }} />
                          </div>
                          <div style={{
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>
                              {activeStyle?.label} · {activeColor?.label}
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <div style={{ width: 10, height: 10, borderRadius: 3, background: activeColor?.color }} />
                              <div style={{ width: 10, height: 10, borderRadius: 3, background: designConfig.theme === 'dark' ? '#1a1a2e' : '#f8f8f8', border: '1px solid rgba(255,255,255,0.1)' }} />
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}

            {leftTab === 'content' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <SectionLabel>站点标题</SectionLabel>
                  <StudioInput
                    value={designConfig.siteTitle}
                    onChange={(v) => handleDesignChange('siteTitle', v)}
                    placeholder="My Blog"
                  />
                </div>
                <div>
                  <SectionLabel>站点描述</SectionLabel>
                  <StudioTextarea
                    value={designConfig.siteDescription}
                    onChange={(v) => handleDesignChange('siteDescription', v)}
                    placeholder="A simple static blog"
                  />
                </div>
                <div>
                  <SectionLabel>作者</SectionLabel>
                  <StudioInput
                    value={designConfig.author}
                    onChange={(v) => handleDesignChange('author', v)}
                    placeholder="Anonymous"
                  />
                </div>
                <div>
                  <SectionLabel>语言</SectionLabel>
                  <StudioSelect
                    value={designConfig.language}
                    onChange={(v) => handleDesignChange('language', v)}
                    options={[
                      { value: 'zh-CN', label: '中文 (zh-CN)' },
                      { value: 'en', label: 'English (en)' },
                    ]}
                  />
                </div>

                <div style={{ marginTop: 8 }}>
                  <SectionLabel>文档列表</SectionLabel>
                  {mdFiles.length === 0 ? (
                    <div style={{
                      padding: '20px 0',
                      textAlign: 'center',
                      fontSize: 12,
                      opacity: 0.3,
                    }}>
                      暂无 Markdown 文档
                    </div>
                  ) : (
                    <>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}>
                        <span style={{ fontSize: 10, opacity: 0.3 }}>
                          已选 {selectedMdFiles.length}/{mdFiles.length}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => setExcludedFiles(new Set())}
                            style={{
                              fontSize: 10,
                              padding: '2px 8px',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 4,
                              background: 'rgba(255,255,255,0.03)',
                              color: 'rgba(255,255,255,0.4)',
                              cursor: 'pointer',
                            }}
                          >
                            全选
                          </button>
                          <button
                            onClick={() => setExcludedFiles(new Set(mdFiles.map(f => f.name)))}
                            style={{
                              fontSize: 10,
                              padding: '2px 8px',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 4,
                              background: 'rgba(255,255,255,0.03)',
                              color: 'rgba(255,255,255,0.4)',
                              cursor: 'pointer',
                            }}
                          >
                            全不选
                          </button>
                        </div>
                      </div>
                      <div style={{
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                      }}>
                        {mdFiles.map((file, idx) => {
                          const isIncluded = !excludedFiles.has(file.name)
                          return (
                            <div
                              key={file.name}
                              style={{
                                padding: '7px 10px',
                                borderBottom: idx < mdFiles.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 11,
                                opacity: isIncluded ? 0.7 : 0.3,
                                transition: 'opacity 0.15s ease',
                              }}
                            >
                              <button
                                onClick={() => {
                                  setExcludedFiles(prev => {
                                    const next = new Set(prev)
                                    if (next.has(file.name)) {
                                      next.delete(file.name)
                                    } else {
                                      next.add(file.name)
                                    }
                                    return next
                                  })
                                }}
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 4,
                                  border: isIncluded
                                    ? '1px solid rgba(167,139,250,0.6)'
                                    : '1px solid rgba(255,255,255,0.15)',
                                  background: isIncluded
                                    ? 'rgba(167,139,250,0.2)'
                                    : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  padding: 0,
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {isIncluded && (
                                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                )}
                              </button>
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ opacity: 0.4, flexShrink: 0 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontFamily: "'Fira Code', 'Consolas', monospace",
                              }}>
                                {file.name}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
            background: 'rgba(255,255,255,0.01)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {DEVICE_CONFIG.map(device => {
                const isActive = previewDevice === device.key
                return (
                  <button
                    key={device.key}
                    onClick={() => setPreviewDevice(device.key)}
                    title={device.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      border: 'none',
                      borderRadius: 6,
                      background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={device.icon} />
                    </svg>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {previewSize && (
                <span style={{ fontSize: 10, opacity: 0.25, fontFamily: "'Fira Code', monospace" }}>
                  {previewSize} KB
                </span>
              )}
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: previewHtml ? '#34d399' : 'rgba(255,255,255,0.15)',
                transition: 'background 0.3s ease',
              }} />
            </div>
          </div>

          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflow: 'auto',
            padding: 20,
            background: 'radial-gradient(ellipse at center, rgba(167,139,250,0.03) 0%, transparent 70%)',
          }}>
            {previewHtml ? (
              <div style={{
                width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '375px',
                maxWidth: '100%',
                height: previewDevice === 'desktop' ? '100%' : 'auto',
                minHeight: previewDevice !== 'desktop' ? 600 : undefined,
                borderRadius: previewDevice === 'desktop' ? 0 : 12,
                overflow: 'hidden',
                border: previewDevice === 'desktop' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: previewDevice === 'desktop' ? 'none' : '0 8px 40px rgba(0,0,0,0.4)',
                position: 'relative',
                transition: 'width 0.3s ease, border-radius 0.3s ease',
              }}>
                {previewDevice !== 'desktop' && (
                  <div style={{
                    height: 28,
                    background: 'rgba(255,255,255,0.04)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  </div>
                )}
                <iframe
                  srcDoc={previewHtml}
                  style={{
                    width: '100%',
                    height: previewDevice === 'desktop' ? '100%' : '600px',
                    border: 'none',
                    backgroundColor: '#fff',
                    display: 'block',
                  }}
                  sandbox="allow-scripts"
                  title="博客预览"
                />
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 16,
                opacity: 0.3,
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span style={{ fontSize: 13 }}>
                  {selectedMdFiles.length === 0 ? '没有选中的 Markdown 文件' : '正在生成预览...'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{
          width: 220,
          flexShrink: 0,
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 14px 0',
          }}>
            <SectionLabel>生成博客</SectionLabel>
          </div>

          <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || selectedMdFiles.length === 0}
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                cursor: isGenerating || selectedMdFiles.length === 0 ? 'not-allowed' : 'pointer',
                background: isGenerating || selectedMdFiles.length === 0
                  ? 'rgba(167,139,250,0.15)'
                  : 'linear-gradient(135deg, #a78bfa, #f472b6)',
                color: isGenerating || selectedMdFiles.length === 0
                  ? 'rgba(255,255,255,0.3)'
                  : '#ffffff',
                transition: 'all 0.2s ease',
                letterSpacing: '0.02em',
              }}
            >
              {isGenerating ? '生成中...' : '生成博客'}
            </button>

            {result && (
              <>
                <button
                  onClick={handleDownloadFolder}
                  disabled={isDownloading}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    fontSize: 11,
                    fontWeight: 500,
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: isDownloading ? 'not-allowed' : 'pointer',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'rgba(255,255,255,0.6)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                >
                  {isDownloading ? '下载中...' : '下载（文件夹）'}
                </button>
                <button
                  onClick={handleDownloadSingleFile}
                  disabled={isDownloading}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    fontSize: 11,
                    fontWeight: 500,
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: isDownloading ? 'not-allowed' : 'pointer',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'rgba(255,255,255,0.6)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                >
                  下载（单文件）
                </button>
              </>
            )}
          </div>

          {error && (
            <div style={{
              margin: '4px 14px',
              padding: '8px 10px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              fontSize: 11,
              color: '#f87171',
              lineHeight: 1.4,
            }}>
              {error}
            </div>
          )}

          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <SectionLabel>项目统计</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <StatRow label="文档数" value={`${selectedMdFiles.length}/${mdFiles.length}`} color="#a78bfa" />
              <StatRow label="总字数" value={totalWordCount.toLocaleString()} color="#f472b6" />
              <StatRow label="风格" value={THEME_STYLE_OPTIONS.find(s => s.key === designConfig.themeStyle)?.label || '-'} color="#38bdf8" />
            </div>
          </div>

          {result && (
            <div style={{ padding: '12px 14px', flex: 1, overflowY: 'auto' }}>
              <SectionLabel>生成结果</SectionLabel>
              <div style={{
                fontSize: 10,
                opacity: 0.35,
                marginTop: 6,
                marginBottom: 8,
              }}>
                {result.files.length} 个文件 · {formatSize(totalSize)}
              </div>
              <div style={{
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}>
                {result.files.map((file, idx) => (
                  <div
                    key={file.path}
                    style={{
                      padding: '5px 8px',
                      borderBottom: idx < result.files.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{
                      fontSize: 10,
                      fontFamily: "'Fira Code', 'Consolas', monospace",
                      opacity: 0.45,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 120,
                    }}>
                      {file.path}
                    </span>
                    <span style={{
                      fontSize: 9,
                      opacity: 0.25,
                      flexShrink: 0,
                    }}>
                      {formatSize(new Blob([file.content]).size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 600,
      color: 'rgba(255,255,255,0.35)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      marginBottom: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <div style={{
        width: 2,
        height: 10,
        borderRadius: 1,
        background: 'linear-gradient(180deg, #a78bfa, #f472b6)',
        flexShrink: 0,
      }} />
      {children}
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 11,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.5 }}>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: color, flexShrink: 0 }} />
        {label}
      </div>
      <span style={{ fontWeight: 500, opacity: 0.7, fontFamily: "'Fira Code', monospace", fontSize: 11 }}>
        {value}
      </span>
    </div>
  )
}

function StudioInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        padding: '7px 10px',
        fontSize: 12,
        border: focused
          ? '1px solid rgba(167,139,250,0.5)'
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        backgroundColor: focused
          ? 'rgba(167,139,250,0.04)'
          : 'rgba(255,255,255,0.02)',
        color: '#e4e4e7',
        outline: 'none',
        fontFamily: "'Inter', -apple-system, sans-serif",
        boxSizing: 'border-box',
        transition: 'all 0.15s ease',
        boxShadow: focused ? '0 0 0 3px rgba(167,139,250,0.1)' : 'none',
      }}
    />
  )
}

function StudioTextarea({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        padding: '7px 10px',
        fontSize: 12,
        border: focused
          ? '1px solid rgba(167,139,250,0.5)'
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        backgroundColor: focused
          ? 'rgba(167,139,250,0.04)'
          : 'rgba(255,255,255,0.02)',
        color: '#e4e4e7',
        outline: 'none',
        fontFamily: "'Inter', -apple-system, sans-serif",
        boxSizing: 'border-box',
        transition: 'all 0.15s ease',
        resize: 'vertical',
        boxShadow: focused ? '0 0 0 3px rgba(167,139,250,0.1)' : 'none',
      }}
    />
  )
}

function StudioSelect({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        padding: '7px 10px',
        fontSize: 12,
        border: focused
          ? '1px solid rgba(167,139,250,0.5)'
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        backgroundColor: focused
          ? 'rgba(167,139,250,0.04)'
          : 'rgba(255,255,255,0.02)',
        color: '#e4e4e7',
        outline: 'none',
        fontFamily: "'Inter', -apple-system, sans-serif",
        boxSizing: 'border-box',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
        boxShadow: focused ? '0 0 0 3px rgba(167,139,250,0.1)' : 'none',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
