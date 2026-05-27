import { useMemo } from 'react'
import { marked, type Token } from 'marked'
import { markedHighlight } from 'marked-highlight'
import markedFootnote from 'marked-footnote'
import hljs from 'highlight.js'
import { getFlatHeadingList } from '../outline/outlineUtils'
import { textToStorage } from '../shared/imageStore'

marked.use({ gfm: true, breaks: true })

marked.use(markedFootnote())

marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    }
  })
)

export function useMarkdownRender(content: string): { html: string } {
  const html = useMemo(() => {
    try {
      const contentForPreview = textToStorage(content)
      const headings = getFlatHeadingList(contentForPreview)
      let headingIndex = 0

      const renderer = new marked.Renderer()

      renderer.heading = function({ text, depth, tokens }: { text: string; depth: number; tokens?: Token[] }) {
        headingIndex++
        const id = headingIndex <= headings.length ? headings[headingIndex - 1].id : `heading-${headingIndex}`
        const renderedContent = tokens ? this.parser.parseInline(tokens) : text
        return `<h${depth} id="${id}" class="heading-link">${renderedContent}</h${depth}>\n`
      }

      let renderedHtml = marked.parse(contentForPreview, { renderer }) as string

      renderedHtml = renderedHtml.replace(
        /<pre><code class="language-(mermaid|mindmap)">([\s\S]*?)<\/code><\/pre>/g,
        (_match, _lang, code) => {
          const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          const decodedCode = code
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
          return `<div class="mermaid-diagram" id="${diagramId}">${decodedCode}</div>`
        }
      )

      renderedHtml = renderedHtml.replace(
        /<pre><code(?:\s+class="([^"]*)")?>([\s\S]*?)<\/code><\/pre>/g,
        (_match, classes, code) => {
          const langMatch = classes?.match(/language-(\w+)/)
          const lang = langMatch ? langMatch[1] : ''
          const lineCount = (code.match(/\n/g) || []).length + 1
          const isLong = lineCount > 10
          const collapsedStyle = isLong ? ' style="max-height:150px"' : ''

          return `<div class="code-block-wrapper${isLong ? ' code-block-collapsed' : ''}">
  <div class="code-block-header" contenteditable="false">
    <span class="code-block-lang">${lang || 'CODE'}</span>
    <div class="code-block-actions">
      <button class="code-copy-btn" title="复制代码">复制</button>
      ${isLong ? '<button class="code-fold-btn" title="展开代码">展开</button>' : ''}
    </div>
  </div>
  <div class="code-block-body"${collapsedStyle}>
    <pre><code${classes ? ` class="${classes}"` : ''}>${code}</code></pre>
  </div>
  ${isLong ? `<div class="code-block-footer" contenteditable="false"><span>展开全部 (${lineCount} 行)</span></div>` : ''}
</div>`
        }
      )

      return renderedHtml
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Markdown render error:', error)
      return '<p>Render error</p>'
    }
  }, [content])

  return { html }
}
