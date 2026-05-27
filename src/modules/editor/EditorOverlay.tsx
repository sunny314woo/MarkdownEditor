import React, { useRef, useEffect, useCallback } from 'react'
import type { LintIssue } from '../lint/markdownLinter'

interface EditorOverlayProps {
  lintIssues: LintIssue[]
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  content: string
  focusMode: boolean
}

interface LineIssue {
  line: number
  severity: 'error' | 'warning'
}

const EditorOverlay: React.FC<EditorOverlayProps> = ({
  lintIssues,
  textareaRef,
  scrollContainerRef,
  content,
  focusMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const lintIssuesRef = useRef(lintIssues)
  const contentRef = useRef(content)
  const focusModeRef = useRef(focusMode)

  useEffect(() => { lintIssuesRef.current = lintIssues }, [lintIssues])
  useEffect(() => { contentRef.current = content }, [content])
  useEffect(() => { focusModeRef.current = focusMode }, [focusMode])

  const getLineIssues = useCallback((): LineIssue[] => {
    const lineMap = new Map<number, 'error' | 'warning'>()
    for (const issue of lintIssuesRef.current) {
      const existing = lineMap.get(issue.line)
      if (existing === 'error') continue
      if (issue.severity === 'error' || !existing) {
        lineMap.set(issue.line, issue.severity)
      }
    }
    return Array.from(lineMap.entries()).map(([line, severity]) => ({ line, severity }))
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const textarea = textareaRef.current
    const scrollContainer = scrollContainerRef.current
    if (!canvas || !textarea || !scrollContainer) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = scrollContainer.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, rect.width, rect.height)

    const lineIssues = getLineIssues()
    if (lineIssues.length === 0) return

    const computedStyle = getComputedStyle(textarea)
    const fm = focusModeRef.current
    const lineHeight = parseFloat(computedStyle.lineHeight) || (fm ? 32 : 22.75)
    const paddingTop = parseFloat(computedStyle.paddingTop) || 16
    const paddingRight = parseFloat(computedStyle.paddingRight) || 16
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 16
    const fontSize = fm ? 16 : 14
    const fontFamily = computedStyle.fontFamily || 'Consolas, Monaco, Fira Code, monospace'

    const availableWidth = rect.width - paddingLeft - paddingRight

    ctx.font = `${fontSize}px ${fontFamily}`

    const lines = contentRef.current.split('\n')

    const lineYPositions: number[] = []
    let currentY = paddingTop
    for (let i = 0; i < lines.length; i++) {
      lineYPositions.push(currentY)
      const textWidth = ctx.measureText(lines[i]).width
      const wrappedLines = Math.max(1, Math.ceil(textWidth / availableWidth))
      currentY += wrappedLines * lineHeight
    }

    const scrollTop = scrollContainer.scrollTop

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light'

    for (const { line, severity } of lineIssues) {
      if (line >= lines.length) continue

      const lineY = lineYPositions[line]
      const textWidth = ctx.measureText(lines[line]).width
      const wrappedLines = Math.max(1, Math.ceil(textWidth / availableWidth))
      const lineBlockHeight = wrappedLines * lineHeight

      const drawY = lineY - scrollTop
      if (drawY + lineBlockHeight < 0 || drawY > rect.height) continue

      const dotColor = severity === 'error'
        ? (isDark ? '#ff4444' : '#ef4444')
        : (isDark ? '#ffaa44' : '#f59e0b')
      const underlineColor = severity === 'error'
        ? (isDark ? 'rgba(255,68,68,0.7)' : 'rgba(239,68,68,0.5)')
        : (isDark ? 'rgba(255,170,68,0.7)' : 'rgba(245,158,11,0.5)')

      const dotX = rect.width - paddingRight - 18
      const dotY = drawY + lineBlockHeight / 2
      ctx.beginPath()
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2)
      ctx.fillStyle = dotColor
      ctx.fill()

      const underlineY = drawY + lineBlockHeight - 3
      const underlineStartX = paddingLeft
      const underlineEndX = rect.width - paddingRight - 30

      ctx.beginPath()
      ctx.setLineDash([3, 6])
      ctx.lineWidth = 1.5
      ctx.strokeStyle = underlineColor
      ctx.moveTo(underlineStartX, underlineY)
      ctx.lineTo(underlineEndX, underlineY)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [getLineIssues, textareaRef, scrollContainerRef])

  const scheduleDraw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(draw)
  }, [draw])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    scrollContainer.addEventListener('scroll', scheduleDraw, { passive: true })
    window.addEventListener('resize', scheduleDraw)

    scheduleDraw()

    return () => {
      scrollContainer.removeEventListener('scroll', scheduleDraw)
      window.removeEventListener('resize', scheduleDraw)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [scheduleDraw, scrollContainerRef])

  useEffect(() => {
    scheduleDraw()
  }, [lintIssues, content, focusMode, scheduleDraw])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    />
  )
}

export default EditorOverlay
