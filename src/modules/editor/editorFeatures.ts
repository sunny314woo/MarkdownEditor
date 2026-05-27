export interface EditorFeatureConfig {
  fileImport?: boolean
  exportFile?: boolean
  imageUpload?: boolean
  imageOptimize?: boolean
  frontMatter?: boolean
  searchReplace?: boolean
  footnotes?: boolean
  previewToggle?: boolean
  focusMode?: boolean
  typewriterMode?: boolean
  lint?: boolean
  stats?: boolean
}

export const DEFAULT_EDITOR_FEATURES: Required<EditorFeatureConfig> = {
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
}

export function resolveEditorFeatures(features?: EditorFeatureConfig): Required<EditorFeatureConfig> {
  return { ...DEFAULT_EDITOR_FEATURES, ...features }
}
