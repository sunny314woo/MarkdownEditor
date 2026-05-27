import { useEffect, useRef, useState } from 'react'
import { renderMathInHtml, renderMathInHtmlAsync } from './mathRenderer'

export function useKaTeX(html: string): { renderedHtml: string } {
  const [renderedHtml, setRenderedHtml] = useState(html)
  const mathDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mathAbortRef = useRef<boolean>(false)

  useEffect(() => {
    if (!html.includes('$')) {
      setRenderedHtml(html)
      return
    }

    if (mathDebounceRef.current) {
      clearTimeout(mathDebounceRef.current)
    }
    mathAbortRef.current = false

    const isLargeDoc = html.length > 50000

    mathDebounceRef.current = setTimeout(async () => {
      if (mathAbortRef.current) return

      try {
        if (isLargeDoc) {
          const result = await renderMathInHtmlAsync(html)
          if (!mathAbortRef.current) {
            setRenderedHtml(result)
          }
        } else {
          const result = renderMathInHtml(html)
          if (!mathAbortRef.current) {
            setRenderedHtml(result)
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[KaTeX] Render failed:', error)
        if (!mathAbortRef.current) {
          setRenderedHtml(html)
        }
      }
    }, 300)

    return () => {
      if (mathDebounceRef.current) {
        clearTimeout(mathDebounceRef.current)
      }
      mathAbortRef.current = true
    }
  }, [html])

  return { renderedHtml }
}
