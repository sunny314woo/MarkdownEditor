import { render, screen } from '@testing-library/react'
import { forwardRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import MarkdownEditor from '../MarkdownEditor'
import { resolveMarkdownEditorFeatures } from '../markdownEditorFeatures'

vi.mock('../../editor/useScrollSync', () => ({
  useScrollSync: () => ({
    handleEditorScroll: vi.fn(),
    handlePreviewScroll: vi.fn(),
  }),
}))

vi.mock('../../preview/useMarkdownRender', () => ({
  useMarkdownRender: (content: string) => ({ html: `<p>${content}</p>` }),
}))

vi.mock('../../preview/useKaTeX', () => ({
  useKaTeX: (html: string) => ({ renderedHtml: html }),
}))

vi.mock('../../preview/useMermaid', () => ({
  useMermaid: vi.fn(),
}))

interface MockEditorProps {
  features?: Record<string, boolean>
  focusMode?: boolean
  typewriterMode?: boolean
}

vi.mock('../../editor/Editor', () => ({
  default: forwardRef<HTMLTextAreaElement, MockEditorProps>(({ features, focusMode, typewriterMode }, _ref) => (
    <div
      data-testid="editor"
      data-features={JSON.stringify(features)}
      data-focus-mode={String(focusMode)}
      data-typewriter-mode={String(typewriterMode)}
    />
  )),
}))

interface MockPreviewProps {
  editable?: boolean
  showThemeToggle?: boolean
}

vi.mock('../../preview/Preview', () => ({
  default: forwardRef<HTMLDivElement, MockPreviewProps>(({ editable, showThemeToggle }, _ref) => (
    <div
      data-testid="preview"
      data-editable={String(editable)}
      data-theme-toggle={String(showThemeToggle)}
    />
  )),
}))

vi.mock('../../outline/Outline', () => ({
  default: () => <div data-testid="outline" />,
}))

vi.mock('../../../components/FootnoteSidebar', () => ({
  default: () => <div data-testid="footnote-sidebar" />,
}))

function renderEditor(features?: Parameters<typeof MarkdownEditor>[0]['features'], overrides = {}) {
  return render(
    <MarkdownEditor
      value="# Title"
      onChange={vi.fn()}
      theme="dark"
      onToggleTheme={vi.fn()}
      {...overrides}
      features={features}
    />
  )
}

function getEditorFeatures(): Record<string, boolean> {
  const rawFeatures = screen.getByTestId('editor').getAttribute('data-features')
  if (!rawFeatures) throw new Error('Editor mock did not receive features')
  return JSON.parse(rawFeatures) as Record<string, boolean>
}

describe('MarkdownEditor feature flags', () => {
  it('defaults to the full editor workspace', () => {
    renderEditor()

    expect(screen.getByTestId('editor')).toBeInTheDocument()
    expect(screen.getByTestId('preview')).toHaveAttribute('data-editable', 'true')
    expect(screen.getByTestId('preview')).toHaveAttribute('data-theme-toggle', 'true')
    expect(screen.getByTestId('outline')).toBeInTheDocument()
    expect(screen.getByTestId('footnote-sidebar')).toBeInTheDocument()

    const features = getEditorFeatures()
    expect(features.exportFile).toBe(true)
    expect(features.imageUpload).toBe(true)
    expect(features.frontMatter).toBe(true)
    expect(features.previewToggle).toBe(true)
  })

  it('can hide preview, outline, and footnote chrome for host integrations', () => {
    renderEditor({
      previewPane: false,
      outlinePane: false,
      footnoteSidebar: false,
    })

    expect(screen.getByTestId('editor')).toBeInTheDocument()
    expect(screen.queryByTestId('preview')).not.toBeInTheDocument()
    expect(screen.queryByTestId('outline')).not.toBeInTheDocument()
    expect(screen.queryByTestId('footnote-sidebar')).not.toBeInTheDocument()
    expect(getEditorFeatures().previewToggle).toBe(false)
  })

  it('passes toolbar-level feature switches down to Editor', () => {
    renderEditor({
      fileImport: false,
      exportFile: false,
      imageUpload: false,
      imageOptimize: false,
      frontMatter: false,
      searchReplace: false,
      footnotes: false,
      lint: false,
      stats: false,
    })

    expect(getEditorFeatures()).toEqual(expect.objectContaining({
      fileImport: false,
      exportFile: false,
      imageUpload: false,
      imageOptimize: false,
      frontMatter: false,
      searchReplace: false,
      footnotes: false,
      lint: false,
      stats: false,
    }))
    expect(screen.queryByTestId('footnote-sidebar')).not.toBeInTheDocument()
  })

  it('coerces disabled focus and typewriter modes off even if host state is true', () => {
    renderEditor(
      { focusMode: false, typewriterMode: false },
      { focusMode: true, typewriterMode: true }
    )

    expect(screen.getByTestId('editor')).toHaveAttribute('data-focus-mode', 'false')
    expect(screen.getByTestId('editor')).toHaveAttribute('data-typewriter-mode', 'false')
  })

  it('resolves defaults without mutating host-provided overrides', () => {
    const overrides = { previewPane: false, exportFile: false }
    const resolved = resolveMarkdownEditorFeatures(overrides)

    expect(resolved.previewPane).toBe(false)
    expect(resolved.exportFile).toBe(false)
    expect(resolved.imageUpload).toBe(true)
    expect(overrides).toEqual({ previewPane: false, exportFile: false })
  })
})
