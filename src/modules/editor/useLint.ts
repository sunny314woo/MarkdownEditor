import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { lintMarkdown, type LintIssue } from '../lint/markdownLinter'
import { scrollToLine } from './editorHelpers'

interface UseLintOptions {
  content: string
  textareaRef: RefObject<HTMLTextAreaElement>
  scrollContainerRef: RefObject<HTMLDivElement>
  onApplyFix: (newContent: string) => void
}

export function useLint({
  content,
  textareaRef,
  scrollContainerRef,
  onApplyFix,
}: UseLintOptions) {
  const [lintIssues, setLintIssues] = useState<LintIssue[]>([])
  const [showLintPopover, setShowLintPopover] = useState(false)
  const lintAnchorRef = useRef<HTMLDivElement>(null)
  const lintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lintCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (lintTimerRef.current) clearTimeout(lintTimerRef.current)
    lintTimerRef.current = setTimeout(() => {
      const issues = lintMarkdown(content)
      setLintIssues(issues)
    }, 500)

    return () => {
      if (lintTimerRef.current) clearTimeout(lintTimerRef.current)
    }
  }, [content])

  useEffect(() => {
    return () => {
      if (lintCloseTimerRef.current) clearTimeout(lintCloseTimerRef.current)
    }
  }, [])

  const cancelCloseLintPopover = useCallback(() => {
    if (lintCloseTimerRef.current) {
      clearTimeout(lintCloseTimerRef.current)
      lintCloseTimerRef.current = null
    }
  }, [])

  const openLintPopover = useCallback(() => {
    cancelCloseLintPopover()
    setShowLintPopover(true)
  }, [cancelCloseLintPopover])

  const scheduleCloseLintPopover = useCallback(() => {
    lintCloseTimerRef.current = setTimeout(() => {
      setShowLintPopover(false)
    }, 300)
  }, [])

  const closeLintPopover = useCallback(() => {
    setShowLintPopover(false)
  }, [])

  const handleJumpToIssue = useCallback((issue: LintIssue) => {
    if (!textareaRef.current || !scrollContainerRef.current) return
    scrollToLine(textareaRef.current, scrollContainerRef.current, issue.line, issue.startCol)
  }, [scrollContainerRef, textareaRef])

  const handleFixIssue = useCallback((newContent: string) => {
    onApplyFix(newContent)
  }, [onApplyFix])

  return {
    lintIssues,
    showLintPopover,
    lintAnchorRef,
    openLintPopover,
    scheduleCloseLintPopover,
    cancelCloseLintPopover,
    closeLintPopover,
    handleJumpToIssue,
    handleFixIssue,
  }
}
