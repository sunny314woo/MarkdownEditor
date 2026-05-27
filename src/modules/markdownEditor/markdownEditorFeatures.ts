import type { EditorFeatureConfig } from '../editor/editorFeatures'

export interface MarkdownEditorFeatureConfig extends EditorFeatureConfig {
  previewPane?: boolean
  outlinePane?: boolean
  footnoteSidebar?: boolean
  previewEditing?: boolean
  imageDeletion?: boolean
  themeToggle?: boolean
}

export const DEFAULT_MARKDOWN_EDITOR_FEATURES: Required<MarkdownEditorFeatureConfig> = {
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

export function resolveMarkdownEditorFeatures(
  features?: MarkdownEditorFeatureConfig
): Required<MarkdownEditorFeatureConfig> {
  return { ...DEFAULT_MARKDOWN_EDITOR_FEATURES, ...features }
}
