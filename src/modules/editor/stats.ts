export interface DocumentStats {
  wordCountTextMode: number
  wordCountStandardMode: number
  charCount: number
  lineCount: number
}

export function calculateStats(text: string): DocumentStats {
  const charCount = text.length

  const wordCountStandardMode = text.replace(/\n/g, '').length

  const wordCountTextMode = text.replace(/\s+/g, '').length

  const lines = text.split('\n')
  const lineCount = lines.length

  return {
    wordCountTextMode,
    wordCountStandardMode,
    charCount,
    lineCount
  }
}
