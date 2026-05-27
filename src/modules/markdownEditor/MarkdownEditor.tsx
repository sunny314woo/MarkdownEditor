import { useCallback, useRef, useState } from 'react'
import FootnoteSidebar from '../../components/FootnoteSidebar'
import type { EditorFeatureConfig } from '../editor/editorFeatures'
import Editor from '../editor/Editor'
import { useScrollSync } from '../editor/useScrollSync'
import Outline from '../outline/Outline'
import Preview from '../preview/Preview'
import { useKaTeX } from '../preview/useKaTeX'
import { useMarkdownRender } from '../preview/useMarkdownRender'
import { useMermaid } from '../preview/useMermaid'
import type { ThemeType } from '../settings/ThemeContext'

export interface MarkdownEditorFeatureConfig extends EditorFeatureConfig {
  previewPane?: boolean
  outlinePane?: boolean
  footnoteSidebar?: boolean
  previewEditing?: boolean
  imageDeletion?: boolean
  themeToggle?: boolean
}

const DEFAULT_MARKDOWN_EDITOR_FEATURES: Required<MarkdownEditorFeatureConfig> = {
  fileImport: true,
  exportFile: true,
  imageUpload: true,
  imageOptimize: true,
  frontMatter: true,
  searchReplace: true,
  footnotes: true,
  previewToggle: true,
  focusMode: true,
  typewriterMode: true,
  lint: true,
  stats: true,
  previewPane: true,
  outlinePane: true,
  footnoteSidebar: true,
  previewEditing: true,
  imageDeletion: true,
  themeToggle: true,
}

export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  fileId?: string | null
  theme: ThemeType
  onToggleTheme: () => void
  showPreview?: boolean
  showOutline?: boolean
  focusMode?: boolean
  typewriterMode?: boolean
  onTogglePreview?: () => void
  onToggleFocusMode?: () => void
  onToggleTypewriterMode?: () => void
  onPreviewContentChange?: (newMarkdown: string) => void
  onDeleteImage?: (imageIndex: number) => void
  features?: MarkdownEditorFeatureConfig
}

export default function MarkdownEditor({
  value,
  onChange,
  fileId,
  theme,
  onToggleTheme,
  showPreview = true,
  showOutline = true,
  focusMode = false,
  typewriterMode = false,
  onTogglePreview,
  onToggleFocusMode,
  onToggleTypewriterMode,
  onPreviewContentChange,
  onDeleteImage,
  features: featureConfig,
}: MarkdownEditorProps) {
  const features = { ...DEFAULT_MARKDOWN_EDITOR_FEATURES, ...featureConfig }
  const editorFeatures: EditorFeatureConfig = {
    fileImport: features.fileImport,
    exportFile: features.exportFile,
    imageUpload: features.imageUpload,
    imageOptimize: features.imageOptimize,
    frontMatter: features.frontMatter,
    searchReplace: features.searchReplace,
    footnotes: features.footnotes,
    previewToggle: features.previewToggle && features.previewPane,
    focusMode: features.focusMode,
    typewriterMode: features.typewriterMode,
    lint: features.lint,
    stats: features.stats,
  }
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { handleEditorScroll, handlePreviewScroll } = useScrollSync(editorRef, previewRef)

  const { html: baseHtml } = useMarkdownRender(value)
  const { renderedHtml } = useKaTeX(baseHtml)
  useMermaid(renderedHtml, value, theme)

  const [highlightedHeading, setHighlightedHeading] = useState<string | null>(null)
  const [scrollActiveHeading, setScrollActiveHeading] = useState<string | null>(null)
  const [activeFootnoteId, setActiveFootnoteId] = useState<string | null>(null)

  const effectiveFocusMode = features.focusMode && focusMode
  const effectiveTypewriterMode = features.typewriterMode && typewriterMode
  const effectiveShowPreview = effectiveFocusMode ? false : features.previewPane && showPreview
  const effectiveShowOutline = effectiveFocusMode ? false : features.outlinePane && showOutline
  const effectiveFootnoteSidebar = features.footnoteSidebar && features.footnotes
  const gridColumns = effectiveShowPreview
    ? (effectiveShowOutline ? '1fr 1fr 200px' : '1fr 1fr')
    : (effectiveShowOutline ? '1fr 200px' : '1fr')

  const handlePreviewScrollWithDetection = useCallback((scrollTop: number, previewElement: HTMLElement) => {
    handlePreviewScroll(scrollTop, previewElement)

    const headings = document.querySelectorAll('.heading-link') as NodeListOf<HTMLElement>
    let visibleHeading: string | null = null

    for (const heading of headings) {
      const relativeTop = heading.offsetTop - previewElement.scrollTop
      if (relativeTop <= previewElement.clientHeight * 0.3 && relativeTop + heading.clientHeight >= 0) {
        visibleHeading = heading.id
        break
      }
    }

    if (visibleHeading && visibleHeading !== scrollActiveHeading) {
      setScrollActiveHeading(visibleHeading)
    }
  }, [handlePreviewScroll, scrollActiveHeading])

  const handleOutlineClick = useCallback((headingId: string) => {
    if (!previewRef.current) return

    const element = document.getElementById(headingId)
    if (element && previewRef.current) {
      const prevHighlighted = document.querySelector('.heading-highlight')
      if (prevHighlighted) {
        prevHighlighted.classList.remove('heading-highlight')
      }

      const previewContainer = previewRef.current
      const elementRect = element.getBoundingClientRect()
      const containerRect = previewContainer.getBoundingClientRect()
      const scrollTop = elementRect.top - containerRect.top + previewContainer.scrollTop - 20

      previewContainer.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      })

      element.classList.add('heading-highlight')
      setHighlightedHeading(headingId)

      setTimeout(() => {
        element.classList.remove('heading-highlight')
        setHighlightedHeading(current => current === headingId ? null : current)
      }, 3000)
    }
  }, [])

  const handleFootnoteClick = useCallback((footnoteId: string, _line: number) => {
    if (!previewRef.current) return

    const refElement = document.getElementById(`footnote-ref-${footnoteId}`)
    const defElement = document.getElementById(`footnote-${footnoteId}`)
    const targetElement = refElement || defElement

    if (targetElement && previewRef.current) {
      const prevHighlighted = document.querySelector('.footnote-highlight')
      if (prevHighlighted) {
        prevHighlighted.classList.remove('footnote-highlight')
      }

      const previewContainer = previewRef.current
      const elementRect = targetElement.getBoundingClientRect()
      const containerRect = previewContainer.getBoundingClientRect()
      const scrollTop = elementRect.top - containerRect.top + previewContainer.scrollTop - 40

      previewContainer.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      })

      targetElement.classList.add('footnote-highlight')
      setActiveFootnoteId(footnoteId)

      setTimeout(() => {
        targetElement.classList.remove('footnote-highlight')
        setActiveFootnoteId(current => current === footnoteId ? null : current)
      }, 3000)
    }
  }, [])

  return (
    <div className="h-full min-h-0 overflow-hidden" style={{ display: 'grid', gridTemplateColumns: gridColumns }}>
      <div
          className={`border-r min-h-0 overflow-hidden ${effectiveFocusMode ? 'focus-editor-container' : ''}`}
        style={{
          borderColor: effectiveShowPreview ? 'var(--editor-border)' : 'transparent',
        }}
      >
        <Editor
          value={value}
          onChange={onChange}
          ref={editorRef}
          onScroll={handleEditorScroll}
          showPreview={effectiveShowPreview}
          onTogglePreview={onTogglePreview}
          focusMode={effectiveFocusMode}
          typewriterMode={effectiveTypewriterMode}
          onToggleFocusMode={onToggleFocusMode}
          onToggleTypewriterMode={onToggleTypewriterMode}
          fileId={fileId}
          features={editorFeatures}
        />
      </div>

      {effectiveShowPreview && (
        <div className="min-h-0 overflow-hidden">
          <Preview
            content={renderedHtml}
            theme={theme}
            onToggleTheme={features.themeToggle ? onToggleTheme : undefined}
            ref={previewRef}
            onScroll={handlePreviewScrollWithDetection}
            onContentChange={features.previewEditing ? onPreviewContentChange : undefined}
            onDeleteImage={features.imageDeletion ? onDeleteImage : undefined}
            editable={features.previewEditing}
            showThemeToggle={features.themeToggle}
          />
        </div>
      )}

      {effectiveShowOutline && (
        <div
          className="border-l flex flex-col min-h-0 overflow-hidden"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <div className="flex-1 overflow-hidden flex flex-col">
            <Outline
              content={value}
              onHeadingClick={handleOutlineClick}
              activeHeadingId={highlightedHeading || scrollActiveHeading}
            />
          </div>
          {effectiveFootnoteSidebar && (
            <FootnoteSidebar
              content={value}
              onFootnoteClick={handleFootnoteClick}
              activeFootnoteId={activeFootnoteId}
            />
          )}
        </div>
      )}
    </div>
  )
}
