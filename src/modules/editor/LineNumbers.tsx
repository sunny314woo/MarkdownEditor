import { useMemo, useRef, useEffect } from 'react'

interface LineNumbersProps {
  content: string
  scrollTop: number
  focusMode?: boolean
}

const LineNumbers = ({ content, scrollTop, focusMode = false }: LineNumbersProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInitialRender = useRef(true)

  const fontSize = focusMode ? 16 : 14
  const lineHeightPx = focusMode ? 32 : 22.75

  const lineCount = useMemo(() => {
    return content.split('\n').length
  }, [content])

  const lineNumbers = useMemo(() => {
    const maxLines = 9999
    if (lineCount > maxLines) {
      const numbers: string[] = []
      for (let i = 1; i <= maxLines; i++) {
        numbers.push(String(i))
      }
      numbers.push('...')
      return numbers
    }
    return Array.from({ length: lineCount }, (_, i) => String(i + 1))
  }, [lineCount])

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false
      if (containerRef.current) {
        containerRef.current.scrollTop = 0
      }
      return
    }

    if (containerRef.current) {
      const target = Math.round(scrollTop)
      if (Math.abs(containerRef.current.scrollTop - target) > 1) {
        containerRef.current.scrollTop = target
      }
    }
  }, [scrollTop])

  return (
    <div
      ref={containerRef}
      className="line-numbers-container"
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: `${lineHeightPx}px`,
        paddingTop: '16px',
        paddingBottom: focusMode ? '50vh' : '40px',
      }}
    >
      {lineNumbers.map((number, index) => (
        <div
          key={index}
          className="line-number"
          style={{
            height: `${lineHeightPx}px`,
            lineHeight: `${lineHeightPx}px`,
          }}
        >
          {number}
        </div>
      ))}
    </div>
  )
}

export default LineNumbers
