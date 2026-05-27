import { useEffect } from 'react'
import mermaid from 'mermaid'

export function useMermaid(html: string, sourceContent: string, theme: string): void {
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
        mindmap: {
          padding: 16,
          useMaxWidth: true,
        },
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis',
        },
        sequence: {
          useMaxWidth: true,
        },
      })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Mermaid init skipped:', e)
    }
  }, [theme])

  useEffect(() => {
    const renderMermaid = async () => {
      try {
        const diagrams = document.querySelectorAll('.mermaid-diagram')
        for (let i = 0; i < diagrams.length; i++) {
          const diagram = diagrams[i] as HTMLElement
          if (diagram.dataset.rendered === 'true') continue

          const id = `mermaid-svg-${i}-${Date.now()}`
          let code = diagram.textContent || ''

          code = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")

          if (!code.trim()) continue

          try {
            const { svg } = await mermaid.render(id, code)
            diagram.innerHTML = svg
            diagram.dataset.rendered = 'true'
          } catch (_mErr) {
            diagram.innerHTML = `<div style="padding:1rem;color:#e74c3c;background:rgba(231,76,60,0.1);border-radius:0.5rem;font-size:0.875rem;"><strong>图表渲染失败</strong><pre style="margin-top:0.5rem;white-space:pre-wrap;font-size:0.75rem;opacity:0.8;">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></div>`
            diagram.dataset.rendered = 'true'
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Mermaid init failure:', error)
      }
    }

    if (sourceContent.includes('mermaid') || sourceContent.includes('mindmap')) {
      const timer = setTimeout(renderMermaid, 200)
      return () => clearTimeout(timer)
    }
  }, [html, sourceContent])
}
