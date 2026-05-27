import { marked } from 'marked'
import { parseFrontMatter, FrontMatter, ParsedDocument } from './frontMatter'
import {
  BlogConfig,
  BlogPost,
  slugify,
  generatePostHtml,
  generateIndexHtml,
  generateArchiveHtml,
  generateTagsHtml,
  generateRssXml,
  generateSitemapXml,
  DEFAULT_BLOG_CONFIG,
  ThemeStyle,
} from './blogTemplates'
import { textToStorage } from '../shared/imageStore'
import { getThemeStyleCss } from './blogThemeStyles'

export interface BlogFile {
  path: string
  content: string
}

export interface BlogGenerationResult {
  files: BlogFile[]
  posts: BlogPost[]
  config: BlogConfig
}

function extractTitleFromContent(content: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : ''
}

function inferTagsFromContent(content: string): string[] {
  const tags: string[] = []
  const h2Matches = content.match(/^##\s+(.+)$/gm)
  if (h2Matches) {
    for (const m of h2Matches) {
      const heading = m.replace(/^##\s+/, '').replace(/[*_`~\[\]]/g, '').trim()
      if (heading.length >= 2 && heading.length <= 20) {
        tags.push(heading)
      } else if (heading.length > 20) {
        const short = heading.substring(0, 20).split(/\s+/).slice(0, -1).join(' ') || heading.substring(0, 15)
        tags.push(short.trim())
      }
    }
  }
  const h3Matches = content.match(/^###\s+(.+)$/gm)
  if (h3Matches && tags.length < 3) {
    for (const m of h3Matches) {
      const heading = m.replace(/^###\s+/, '').replace(/[*_`~\[\]]/g, '').trim()
      if (heading.length >= 2 && heading.length <= 20) {
        tags.push(heading)
      }
      if (tags.length >= 5) break
    }
  }
  const unique = [...new Set(tags)]
  return unique.slice(0, 5)
}

function inferDateFromContent(content: string): string {
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{4}\/\d{2}\/\d{2})/,
    /(\d{4}年\d{1,2}月\d{1,2}日)/,
  ]
  for (const pattern of datePatterns) {
    const match = content.match(pattern)
    if (match) {
      let dateStr = match[1]
      dateStr = dateStr.replace(/\//g, '-').replace(/年|月/g, '-').replace(/日/g, '')
      return dateStr
    }
  }
  return new Date().toISOString().split('T')[0]
}

function extractExcerpt(html: string, maxLength: number = 200): string {
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLength) return text
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > maxLength * 0.6 ? truncated.substring(0, lastSpace) : truncated) + '...'
}

export function generateBlog(
  files: Array<{ name: string; content: string }>,
  config?: Partial<BlogConfig>
): BlogGenerationResult {
  const mergedConfig: BlogConfig = { ...DEFAULT_BLOG_CONFIG, ...config }
  const posts: BlogPost[] = []

  for (const file of files) {
    if (!file.name.endsWith('.md')) continue
    if (!file.content || !file.content.trim()) continue

    const parsed: ParsedDocument = parseFrontMatter(file.content)
    const resolvedContent = textToStorage(parsed.content)
    const htmlContent = marked.parse(resolvedContent, { gfm: true, breaks: true }) as string
    const fm: FrontMatter = parsed.frontMatter

    const title = fm.title || extractTitleFromContent(parsed.content) || file.name.replace(/\.md$/, '')
    const slug = slugify(title)

    const post: BlogPost = {
      title,
      slug,
      date: fm.date || inferDateFromContent(parsed.content),
      tags: Array.isArray(fm.tags) && fm.tags.length > 0 ? fm.tags : inferTagsFromContent(parsed.content),
      category: fm.category || '',
      description: fm.description || '',
      author: fm.author || mergedConfig.author,
      coverImage: fm.coverImage || '',
      draft: fm.draft === true,
      content: htmlContent,
      rawContent: resolvedContent,
    }

    posts.push(post)
  }

  posts.sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date.localeCompare(a.date)
  })

  const blogFiles: BlogFile[] = []

  blogFiles.push({
    path: 'index.html',
    content: generateIndexHtml(posts, mergedConfig),
  })

  blogFiles.push({
    path: 'archive.html',
    content: generateArchiveHtml(posts, mergedConfig),
  })

  blogFiles.push({
    path: 'tags.html',
    content: generateTagsHtml(posts, mergedConfig),
  })

  blogFiles.push({
    path: 'rss.xml',
    content: generateRssXml(posts, mergedConfig),
  })

  blogFiles.push({
    path: 'sitemap.xml',
    content: generateSitemapXml(posts, mergedConfig),
  })

  for (const post of posts) {
    blogFiles.push({
      path: `posts/${post.slug}/index.html`,
      content: generatePostHtml(post, mergedConfig),
    })
  }

  return { files: blogFiles, posts, config: mergedConfig }
}

async function writeFilesToDirectory(
  dirHandle: FileSystemDirectoryHandle,
  files: BlogFile[]
): Promise<void> {
  for (const file of files) {
    const parts = file.path.split('/')
    let currentHandle = dirHandle

    for (let i = 0; i < parts.length - 1; i++) {
      currentHandle = await currentHandle.getDirectoryHandle(parts[i], { create: true })
    }

    const fileName = parts[parts.length - 1]
    const fileHandle = await currentHandle.getFileHandle(fileName, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(file.content)
    await writable.close()
  }
}

export async function downloadBlogAsZip(result: BlogGenerationResult): Promise<void> {
  if ('showDirectoryPicker' in window) {
    try {
      const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()
      await writeFilesToDirectory(dirHandle, result.files)
      return
    } catch {
    }
  }

  const singleFile = generateSingleFileBlog(
    result.posts.map((p) => ({
      name: p.slug,
      content: p.rawContent,
      frontMatter: {
        title: p.title,
        date: p.date,
        tags: p.tags,
        category: p.category,
        description: p.description,
        author: p.author,
        coverImage: p.coverImage,
        draft: p.draft,
      },
    })),
    result.config
  )

  const blob = new Blob([singleFile], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'blog.html'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function tagId(tag: string): string {
  return 'tag-' + tag.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')
}

function sectionIdFromText(text: string): string {
  return 'section-' + text.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-').toLowerCase()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toISOString().split('T')[0]
  } catch {
    return dateStr
  }
}

function estimateReadingTime(html: string): string {
  const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const englishWords = text.replace(/[\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(w => w.length > 0).length
  const minutes = Math.max(1, Math.ceil(chineseChars / 300 + englishWords / 200))
  return minutes + ' min read'
}

function extractToc(html: string): Array<{ id: string; text: string; level: number }> {
  const toc: Array<{ id: string; text: string; level: number }> = []
  const regex = /<h([23])[^>]*>(.*?)<\/h[23]>/g
  let match
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1])
    const text = match[2].replace(/<[^>]+>/g, '').trim()
    const id = 'section-' + text.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-').toLowerCase()
    toc.push({ id, text, level })
  }
  return toc
}

export function generateSingleFileBlog(
  files: Array<{
    name: string
    content: string
    frontMatter?: Partial<FrontMatter>
  }>,
  config?: Partial<BlogConfig>
): string {
  const mergedConfig: BlogConfig = { ...DEFAULT_BLOG_CONFIG, ...config }
  const isDark = mergedConfig.theme === 'dark'
  const colorSchemes: Record<string, { primary: string; secondary: string; accent: string; primaryLight: string; secondaryLight: string; accentLight: string }> = {
    warm: { primary: '#d97706', secondary: '#e11d48', accent: '#7c3aed', primaryLight: 'rgba(217,119,6,0.06)', secondaryLight: 'rgba(225,29,72,0.04)', accentLight: 'rgba(124,58,237,0.04)' },
    ocean: { primary: '#0284c7', secondary: '#06b6d4', accent: '#0ea5e9', primaryLight: 'rgba(2,132,199,0.06)', secondaryLight: 'rgba(6,182,212,0.04)', accentLight: 'rgba(14,165,233,0.04)' },
    forest: { primary: '#059669', secondary: '#34d399', accent: '#10b981', primaryLight: 'rgba(5,150,105,0.06)', secondaryLight: 'rgba(52,211,153,0.04)', accentLight: 'rgba(16,185,129,0.04)' },
    rose: { primary: '#e11d48', secondary: '#fb7185', accent: '#f43f5e', primaryLight: 'rgba(225,29,72,0.06)', secondaryLight: 'rgba(251,113,133,0.04)', accentLight: 'rgba(244,63,94,0.04)' },
    violet: { primary: '#7c3aed', secondary: '#a78bfa', accent: '#8b5cf6', primaryLight: 'rgba(124,58,237,0.06)', secondaryLight: 'rgba(167,139,250,0.04)', accentLight: 'rgba(139,92,246,0.04)' },
  }
  const colors = colorSchemes[mergedConfig.colorScheme] || colorSchemes.warm
  const fontFamilies: Record<string, { heading: string; body: string; mono: string }> = {
    serif: { heading: "'Playfair Display', 'Noto Serif SC', Georgia, serif", body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" },
    sans: { heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" },
    mono: { heading: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace", body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" },
  }
  const fonts = fontFamilies[mergedConfig.font] || fontFamilies.serif
  const layout = mergedConfig.layout || 'magazine'
  const posts: BlogPost[] = []

  for (const file of files) {
    const fm = file.frontMatter || {}
    const resolvedContent = textToStorage(file.content)
    if (!resolvedContent || !resolvedContent.trim()) continue
    const htmlContent = marked.parse(resolvedContent, { gfm: true, breaks: true }) as string
    const title = fm.title || extractTitleFromContent(resolvedContent) || file.name
    const slug = slugify(title)

    posts.push({
      title,
      slug,
      date: fm.date || inferDateFromContent(resolvedContent),
      tags: Array.isArray(fm.tags) && fm.tags.length > 0 ? fm.tags : inferTagsFromContent(resolvedContent),
      category: fm.category || '',
      description: fm.description || '',
      author: fm.author || mergedConfig.author,
      coverImage: fm.coverImage || '',
      draft: fm.draft === true,
      content: htmlContent,
      rawContent: resolvedContent,
    })
  }

  posts.sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date.localeCompare(a.date)
  })

  const published = posts.filter((p) => !p.draft)

  const themeStyle = mergedConfig.themeStyle || 'magazine'
  const isNewTheme = ['ink-wash', 'terminal', 'newspaper', 'glassmorphism', 'bento', 'narrative'].includes(themeStyle)

  if (isNewTheme) {
    return generateNewThemeSingleFileBlog(posts, published, mergedConfig, isDark, themeStyle as ThemeStyle)
  }

  const featuredCard = published.length > 0
    ? (() => {
        const post = published[0]
        const metaParts: string[] = []
        if (post.date) metaParts.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escapeHtml(formatDate(post.date))}</span>`)
        if (post.author) metaParts.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${escapeHtml(post.author)}</span>`)
        const tagsHtml = post.tags.map(t => `<a href="#tags" class="tag" data-tag-filter="${escapeAttr(t)}">${escapeHtml(t)}</a>`).join('')
        const excerpt = post.description ? escapeHtml(post.description) : escapeHtml(extractExcerpt(post.content, 260))
        return `<div class="featured-card">
  <div class="featured-card-inner">
    <div class="featured-badge">Featured</div>
    <div class="featured-number">01</div>
    <h2><a href="#post/${escapeAttr(post.slug)}">${escapeHtml(post.title)}</a></h2>
    <div class="post-meta">${metaParts.join('')}</div>
    <p class="featured-excerpt">${excerpt}</p>
    ${tagsHtml ? `<div class="tag-list">${tagsHtml}</div>` : ''}
    <a href="#post/${escapeAttr(post.slug)}" class="featured-cta">阅读全文 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
  </div>
  <div class="featured-deco">
    <div class="deco-circle"></div>
    <div class="deco-diamond"></div>
    <div class="deco-dot"></div>
  </div>
</div>`
      })()
    : ''

  const gridCards = published.slice(1)
    .map((post, idx) => {
      const num = String(idx + 2).padStart(2, '0')
      const metaParts: string[] = []
      if (post.date) metaParts.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escapeHtml(formatDate(post.date))}</span>`)
      if (post.author) metaParts.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${escapeHtml(post.author)}</span>`)
      const tagsHtml = post.tags.map(t => `<a href="#tags" class="tag" data-tag-filter="${escapeAttr(t)}">${escapeHtml(t)}</a>`).join('')
      const excerpt = post.description ? escapeHtml(post.description) : escapeHtml(extractExcerpt(post.content, 120))
      const isEven = idx % 2 === 0
      return `<div class="grid-card ${isEven ? 'grid-card--left' : 'grid-card--right'}">
  <div class="grid-card-inner">
    <div class="grid-card-num">${num}</div>
    <div class="grid-card-line"></div>
    <h3><a href="#post/${escapeAttr(post.slug)}">${escapeHtml(post.title)}</a></h3>
    <div class="post-meta">${metaParts.join('')}</div>
    <p class="grid-excerpt">${excerpt}</p>
    ${tagsHtml ? `<div class="tag-list">${tagsHtml}</div>` : ''}
    <a href="#post/${escapeAttr(post.slug)}" class="grid-cta">阅读 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
  </div>
</div>`
    })
    .join('')

  const minimalListHtml = published
    .map((post) =>
      `<a href="#post/${escapeAttr(post.slug)}" class="minimal-item"><span class="minimal-date">${escapeHtml(formatDate(post.date))}</span><span class="minimal-title">${escapeHtml(post.title)}</span></a>`
    )
    .join('')

  const classicCardsHtml = published
    .map((post) => {
      const metaParts: string[] = []
      if (post.date) metaParts.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escapeHtml(formatDate(post.date))}</span>`)
      if (post.author) metaParts.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${escapeHtml(post.author)}</span>`)
      const excerpt = post.description ? escapeHtml(post.description) : escapeHtml(extractExcerpt(post.content, 140))
      const tagsHtml = post.tags.map(t => `<a href="#tags" class="tag" data-tag-filter="${escapeAttr(t)}">${escapeHtml(t)}</a>`).join('')
      return `<a href="#post/${escapeAttr(post.slug)}" class="classic-card"><h3>${escapeHtml(post.title)}</h3><div class="post-meta">${metaParts.join('')}</div><p class="classic-excerpt">${excerpt}</p>${tagsHtml ? `<div class="tag-list">${tagsHtml}</div>` : ''}</a>`
    })
    .join('')

  const archiveByYear = new Map<string, BlogPost[]>()
  for (const post of published) {
    const year = post.date ? new Date(post.date).getFullYear().toString() : '未知'
    const list = archiveByYear.get(year) || []
    list.push(post)
    archiveByYear.set(year, list)
  }
  const archiveYears = [...archiveByYear.keys()].sort((a, b) => b.localeCompare(a))
  const archiveSection = archiveYears
    .map((year) => {
      const yearPosts = archiveByYear.get(year)!
      const items = yearPosts
        .map((post) =>
          `<a href="#post/${escapeAttr(post.slug)}" class="timeline-item"><div class="timeline-dot"></div><div class="timeline-content"><span class="timeline-date">${escapeHtml(formatDate(post.date))}</span><span class="timeline-title">${escapeHtml(post.title)}</span></div></a>`
        )
        .join('')
      return `<div class="timeline-year"><div class="timeline-year-label">${escapeHtml(year)}</div><div class="timeline-group">${items}</div></div>`
    })
    .join('')

  const tagMap = new Map<string, BlogPost[]>()
  for (const post of published) {
    for (const tag of post.tags) {
      const list = tagMap.get(tag) || []
      list.push(post)
      tagMap.set(tag, list)
    }
  }
  const sortedTags = [...tagMap.keys()].sort()
  const tagCloud = sortedTags
    .map((tag) =>
      `<a href="#tags" class="tag tag--cloud" data-tag-filter="${escapeAttr(tag)}">${escapeHtml(tag)}<span class="tag-num">${tagMap.get(tag)!.length}</span></a>`
    )
    .join('')
  const tagGroups = sortedTags
    .map((tag) => {
      const tagPosts = tagMap.get(tag)!
      const items = tagPosts
        .map((post) =>
          `<a href="#post/${escapeAttr(post.slug)}" class="tag-post-item tag-item" data-tag="${escapeAttr(tag)}" data-section="${escapeAttr(sectionIdFromText(tag))}"><span class="tag-post-date">${escapeHtml(formatDate(post.date))}</span><span class="tag-post-title">${escapeHtml(post.title)}</span></a>`
        )
        .join('')
      return `<div class="tag-group" id="${tagId(tag)}"><h3 data-tag-heading="${escapeAttr(tag)}">${escapeHtml(tag)}<span class="tag-count">${tagPosts.length}</span></h3>${items}</div>`
    })
    .join('')

  const classicSidebarHtml = (() => {
    const recentPosts = published.slice(0, 5)
    const recentHtml = recentPosts
      .map((post) =>
        `<a href="#post/${escapeAttr(post.slug)}" class="sidebar-recent-item"><span class="sidebar-recent-title">${escapeHtml(post.title)}</span><span class="sidebar-recent-date">${escapeHtml(formatDate(post.date))}</span></a>`
      )
      .join('')
    const sidebarTagCloud = sortedTags
      .map((tag) =>
        `<a href="#tags" class="tag tag--cloud" data-tag-filter="${escapeAttr(tag)}">${escapeHtml(tag)}<span class="tag-num">${tagMap.get(tag)!.length}</span></a>`
      )
      .join('')
    return `<aside class="classic-sidebar"><div class="sidebar-section"><h4 class="sidebar-title">标签</h4><div class="sidebar-tag-cloud">${sidebarTagCloud}</div></div><div class="sidebar-section"><h4 class="sidebar-title">最近文章</h4><div class="sidebar-recent">${recentHtml}</div></div></aside>`
  })()

  const indexContentHtml = layout === 'minimal'
    ? `<div class="minimal-list">${minimalListHtml}</div>`
    : layout === 'classic'
      ? `<div class="classic-layout"><div class="classic-main">${classicCardsHtml}</div>${classicSidebarHtml}</div>`
      : `${featuredCard}${gridCards ? `<div class="post-grid">${gridCards}</div>` : ''}`

  const heroHtml = layout === 'minimal'
    ? ''
    : `<div class="hero-section">
        <div class="hero-left">
          <div class="hero-label">Personal Blog</div>
          <h2 class="hero-title"><span>${escapeHtml(mergedConfig.siteTitle)}</span></h2>
          <p class="hero-desc">${escapeHtml(mergedConfig.siteDescription)}</p>
        </div>
        <div class="hero-right">
          <div class="vline"></div>
          <div class="vlabel">${escapeHtml(mergedConfig.author)}</div>
        </div>
        <div class="hero-divider">
          <div class="line"></div>
          <div class="diamond"></div>
          <div class="line"></div>
        </div>
      </div>`

  const postSections = posts
    .map((post) => {
      const tagsHtml = post.tags.map(t => `<a href="#tags" class="tag" data-tag-filter="${escapeAttr(t)}">${escapeHtml(t)}</a>`).join('')
      const metaParts: string[] = []
      if (post.date) metaParts.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escapeHtml(formatDate(post.date))}</span>`)
      if (post.author) metaParts.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${escapeHtml(post.author)}</span>`)
      if (post.category) metaParts.push(`<span class="category-badge">${escapeHtml(post.category)}</span>`)

      let contentWithIds = post.content
      const tocItems = extractToc(contentWithIds)
      for (const item of tocItems) {
        const tag = `h${item.level}`
        contentWithIds = contentWithIds.replace(
          `<${tag}>${item.text}</${tag}>`,
          `<${tag} id="${item.id}">${item.text}</${tag}>`
        )
      }

      const tocHtml = tocItems.map(item =>
        `<a href="#${item.id}" class="toc-h${item.level}">${escapeHtml(item.text)}</a>`
      ).join('')

      const readingTime = estimateReadingTime(post.content)
      metaParts.push(`<span class="reading-time meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${readingTime}</span>`)

      const author = post.author || mergedConfig.author || 'A'
      const authorInitial = author.charAt(0).toUpperCase()

      return `<div class="page-section" id="post-${escapeAttr(post.slug)}" data-section="post">
  <div class="reading-progress-bar" id="reading-progress"></div>
  <div class="post-detail-wrapper">
    <div class="post-header">
      <div class="post-header-deco"></div>
      <div class="post-header-ornament">
        <div class="ornament-line"></div>
        <div class="ornament-dot"></div>
        <div class="ornament-line"></div>
      </div>
      <h1>${escapeHtml(post.title)}</h1>
      <div class="post-meta">${metaParts.join('')}</div>
    </div>
    <div class="post-body-layout">
      <div class="post-content">${contentWithIds}</div>
      <aside class="post-toc">
        <div class="toc-title">目录</div>
        <nav class="toc-nav">${tocHtml}</nav>
      </aside>
    </div>
    ${tagsHtml ? `<div class="post-tags"><span class="post-tags-label">标签</span>${tagsHtml}</div>` : ''}
    <div class="post-author-card">
      <div class="author-avatar">${authorInitial}</div>
      <div class="author-info">
        <div class="author-name">${escapeHtml(author)}</div>
        <div class="author-bio">Writer & Creator</div>
      </div>
    </div>
    <div class="post-share">
      <span class="share-label">分享本文</span>
      <button class="share-copy-btn" onclick="copyPostLink()">复制链接</button>
    </div>
    <a href="#index" class="back-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>返回首页</a>
  </div>
</div>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="${escapeAttr(mergedConfig.language)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(mergedConfig.siteTitle)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Noto+Serif+SC:wght@400;600;700;900&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg-primary: ${isDark ? '#0a0a0f' : '#fafaf8'};
      --bg-secondary: ${isDark ? '#12121a' : '#f5f3ef'};
      --bg-card: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)'};
      --bg-card-hover: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)'};
      --bg-code: ${isDark ? '#0d0d15' : '#f0ede8'};
      --text-primary: ${isDark ? '#e8e6e3' : '#1a1a1a'};
      --text-secondary: ${isDark ? '#8a8a9a' : '#5a5a5a'};
      --text-muted: ${isDark ? '#5a5a6a' : '#9a9a9a'};
      --border-color: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
      --border-hover: ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'};
      --accent-warm: ${colors.primary};
      --accent-cool: ${colors.secondary};
      --accent-violet: ${colors.accent};
      --accent-rose: ${colors.secondary};
      --accent-emerald: ${isDark ? '#34d399' : '#059669'};
      --accent: var(--accent-warm);
      --shadow-card: ${isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.04)'};
      --shadow-card-hover: ${isDark ? '0 16px 48px rgba(0,0,0,0.4)' : '0 16px 48px rgba(0,0,0,0.08)'};
      --radius: 16px;
      --radius-sm: 10px;
      --max-width: 900px;
      --transition: 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: ${fonts.body};
      line-height: 1.8;
      color: var(--text-primary);
      background: var(--bg-secondary);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-x: hidden;
    }

    body::before {
      content: '';
      position: fixed;
      top: -50%;
      right: -30%;
      width: 80vw;
      height: 80vw;
      background: radial-gradient(circle, ${colors.primaryLight} 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    body::after {
      content: '';
      position: fixed;
      bottom: -40%;
      left: -20%;
      width: 70vw;
      height: 70vw;
      background: radial-gradient(circle, ${colors.accentLight} 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    a { color: var(--accent-warm); text-decoration: none; transition: all var(--transition); }
    a:hover { color: var(--accent-rose); }

    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      background: ${isDark ? 'rgba(10,10,15,0.75)' : 'rgba(250,250,248,0.75)'};
      border-bottom: 1px solid var(--border-color);
    }

    .header-inner {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 16px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .site-title {
      font-family: ${fonts.heading};
      font-size: 1.5em;
      font-weight: 900;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      position: relative;
    }

    .site-title a { color: inherit; }
    .site-title a::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--accent-warm), var(--accent-rose));
      transition: width var(--transition);
    }
    .site-title a:hover::after { width: 100%; }

    .site-nav { display: flex; gap: 2px; align-items: center; }

    .site-nav a {
      padding: 8px 20px;
      border-radius: 24px;
      font-size: 0.82em;
      font-weight: 500;
      color: var(--text-secondary);
      transition: all var(--transition);
      cursor: pointer;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .site-nav a:hover {
      background: ${colors.primaryLight};
      color: var(--accent-warm);
    }

    .main-content {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 0 40px 100px;
      position: relative;
      z-index: 1;
    }

    .hero-section {
      padding: 100px 0 80px;
      position: relative;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 40px;
      align-items: end;
    }

    .hero-left { position: relative; }

    .hero-left::before {
      content: '';
      position: absolute;
      top: -20px;
      left: -80px;
      width: 160px;
      height: 160px;
      border: 2px solid ${colors.primaryLight};
      border-radius: 50%;
      animation: float 8s ease-in-out infinite;
    }

    .hero-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.7em;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      background: ${colors.primaryLight};
      color: var(--accent-warm);
      margin-bottom: 28px;
      border: 1px solid ${colors.primaryLight};
    }

    .hero-label::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent-warm);
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    .hero-title {
      font-family: ${fonts.heading};
      font-size: 3.8em;
      font-weight: 900;
      line-height: 1.08;
      margin-bottom: 20px;
      color: var(--text-primary);
      letter-spacing: -0.04em;
    }

    .hero-title span {
      background: linear-gradient(135deg, var(--accent-warm), var(--accent-rose), var(--accent-violet));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-desc {
      font-size: 1.1em;
      color: var(--text-secondary);
      max-width: 480px;
      line-height: 1.9;
      font-weight: 300;
    }

    .hero-right {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding-bottom: 20px;
    }

    .hero-right .vline {
      width: 1px;
      height: 80px;
      background: linear-gradient(to bottom, var(--accent-warm), transparent);
    }

    .hero-right .vlabel {
      writing-mode: vertical-rl;
      font-size: 0.65em;
      font-weight: 500;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .hero-divider {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 20px;
    }

    .hero-divider .line {
      flex: 1;
      height: 1px;
      background: var(--border-color);
    }

    .hero-divider .diamond {
      width: 8px;
      height: 8px;
      background: var(--accent-warm);
      transform: rotate(45deg);
      flex-shrink: 0;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(5deg); }
    }

    .featured-card {
      display: block;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 48px 52px;
      margin-bottom: 48px;
      transition: all var(--transition);
      box-shadow: var(--shadow-card);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(10px);
      color: var(--text-primary);
    }

    .featured-card:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-6px);
      border-color: var(--accent-warm);
      background: var(--bg-card-hover);
    }

    .featured-card-inner { position: relative; z-index: 1; }

    .featured-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 14px;
      border-radius: 4px;
      font-size: 0.65em;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      background: linear-gradient(135deg, var(--accent-warm), var(--accent-rose));
      color: #fff;
      margin-bottom: 24px;
    }

    .featured-number {
      position: absolute;
      top: -16px;
      right: -8px;
      font-family: ${fonts.heading};
      font-size: 7em;
      font-weight: 900;
      color: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
      line-height: 1;
      transition: color var(--transition);
    }

    .featured-card:hover .featured-number {
      color: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
    }

    .featured-card h2 {
      font-family: ${fonts.heading};
      font-size: 2em;
      font-weight: 900;
      margin-bottom: 16px;
      line-height: 1.25;
      letter-spacing: -0.02em;
      color: var(--text-primary);
    }

    .featured-card h2 a { color: inherit; }
    .featured-card h2 a:hover { color: var(--accent-warm); }

    .featured-card:hover h2 a { color: var(--accent-warm); }

    .featured-excerpt {
      color: var(--text-secondary);
      font-size: 1em;
      line-height: 1.9;
      margin-bottom: 20px;
      font-weight: 300;
      max-width: 600px;
    }

    .featured-cta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.88em;
      font-weight: 600;
      color: var(--accent-warm);
      transition: all var(--transition);
    }

    .featured-cta svg { transition: transform var(--transition); }
    .featured-card:hover .featured-cta svg { transform: translateX(6px); }

    .featured-deco {
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 100%;
      pointer-events: none;
      opacity: 0.4;
    }

    .deco-circle {
      position: absolute;
      top: 30px;
      right: 20px;
      width: 100px;
      height: 100px;
      border: 2px solid ${colors.primaryLight};
      border-radius: 50%;
    }

    .deco-diamond {
      position: absolute;
      top: 80px;
      right: 60px;
      width: 40px;
      height: 40px;
      border: 2px solid ${colors.accentLight};
      transform: rotate(45deg);
    }

    .deco-dot {
      position: absolute;
      top: 140px;
      right: 40px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${colors.secondaryLight};
    }

    .post-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 48px;
    }

    .grid-card {
      display: block;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      transition: all var(--transition);
      box-shadow: var(--shadow-card);
      overflow: hidden;
      backdrop-filter: blur(10px);
      color: var(--text-primary);
    }

    .grid-card:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-4px);
      border-color: var(--border-hover);
      background: var(--bg-card-hover);
    }

    .grid-card-inner {
      padding: 32px 28px;
      position: relative;
    }

    .grid-card--left .grid-card-inner { padding-left: 36px; }
    .grid-card--right .grid-card-inner { padding-right: 36px; }

    .grid-card-num {
      font-family: ${fonts.heading};
      font-size: 2.4em;
      font-weight: 900;
      color: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'};
      line-height: 1;
      margin-bottom: 8px;
      transition: color var(--transition);
    }

    .grid-card:hover .grid-card-num {
      color: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
    }

    .grid-card-line {
      width: 32px;
      height: 2px;
      background: linear-gradient(90deg, var(--accent-warm), var(--accent-rose));
      margin-bottom: 16px;
      transition: width var(--transition);
    }

    .grid-card:hover .grid-card-line { width: 64px; }

    .grid-card h3 {
      font-family: ${fonts.heading};
      font-size: 1.25em;
      font-weight: 700;
      margin-bottom: 10px;
      line-height: 1.35;
      letter-spacing: -0.01em;
      color: var(--text-primary);
    }

    .grid-card h3 a { color: inherit; }
    .grid-card h3 a:hover { color: var(--accent-warm); }

    .grid-card:hover h3 a { color: var(--accent-warm); }

    .grid-excerpt {
      color: var(--text-secondary);
      font-size: 0.88em;
      line-height: 1.7;
      margin-bottom: 14px;
      font-weight: 300;
    }

    .grid-cta {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8em;
      font-weight: 500;
      color: var(--accent-warm);
      transition: all var(--transition);
    }

    .grid-cta svg { transition: transform var(--transition); }
    .grid-card:hover .grid-cta svg { transform: translateX(4px); }

    .post-meta {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
      color: var(--text-muted);
      font-size: 0.78em;
      margin-bottom: 12px;
      font-weight: 400;
    }

    .post-meta .meta-item { display: flex; align-items: center; gap: 5px; }
    .post-meta svg { width: 13px; height: 13px; opacity: 0.6; }

    .tag-list { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 12px; }

    .tag {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.72em;
      font-weight: 500;
      background: ${colors.primaryLight};
      color: var(--accent-warm);
      transition: all var(--transition);
      cursor: pointer;
      border: 1px solid transparent;
      letter-spacing: 0.02em;
    }

    .tag:hover {
      border-color: var(--accent-warm);
      background: ${colors.primaryLight};
    }

    .tag--cloud {
      padding: 8px 20px;
      font-size: 0.85em;
      border-radius: 24px;
      gap: 6px;
    }

    .tag-num {
      font-size: 0.8em;
      opacity: 0.6;
    }

    .category-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.72em;
      font-weight: 500;
      background: ${isDark ? 'rgba(52,211,153,0.08)' : 'rgba(5,150,105,0.05)'};
      color: var(--accent-emerald);
      border: 1px solid ${isDark ? 'rgba(52,211,153,0.15)' : 'rgba(5,150,105,0.1)'};
    }

    .page-header {
      padding: 80px 0 48px;
      position: relative;
    }

    .page-header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, var(--accent-warm), var(--accent-rose), var(--accent-violet), transparent);
    }

    .page-title {
      font-family: ${fonts.heading};
      font-size: 3em;
      font-weight: 900;
      margin-bottom: 8px;
      color: var(--text-primary);
      letter-spacing: -0.03em;
    }

    .page-subtitle {
      color: var(--text-secondary);
      font-size: 1em;
      margin-bottom: 0;
      font-weight: 300;
    }

    .timeline-year { margin-bottom: 48px; }

    .timeline-year-label {
      font-family: ${fonts.heading};
      font-size: 2.4em;
      font-weight: 900;
      color: var(--text-primary);
      margin-bottom: 24px;
      letter-spacing: -0.03em;
      position: relative;
      display: inline-block;
    }

    .timeline-year-label::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, var(--accent-warm), var(--accent-rose));
      border-radius: 2px;
    }

    .timeline-group {
      position: relative;
      padding-left: 32px;
      border-left: 2px solid var(--border-color);
    }

    .timeline-item {
      display: flex;
      align-items: baseline;
      gap: 0;
      padding: 16px 0;
      position: relative;
      color: var(--text-primary);
      transition: all var(--transition);
    }

    .timeline-item:hover { padding-left: 12px; }

    .timeline-dot {
      position: absolute;
      left: -38px;
      top: 22px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid var(--accent-warm);
      background: var(--bg-secondary);
      transition: all var(--transition);
    }

    .timeline-item:hover .timeline-dot {
      background: var(--accent-warm);
      box-shadow: 0 0 0 4px ${colors.primaryLight};
    }

    .timeline-content {
      display: flex;
      align-items: baseline;
      gap: 20px;
    }

    .timeline-date {
      font-family: ${fonts.mono};
      font-size: 0.8em;
      color: var(--text-muted);
      min-width: 100px;
      flex-shrink: 0;
    }

    .timeline-title {
      font-family: ${fonts.heading};
      font-weight: 600;
      font-size: 1.05em;
    }

    .timeline-item:hover .timeline-title { color: var(--accent-warm); }

    .tag-cloud-section {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 48px;
      padding: 32px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      backdrop-filter: blur(10px);
    }

    .tag-group { margin-bottom: 36px; }

    .tag-group h3 {
      font-size: 1.3em;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: ${fonts.heading};
    }

    .tag-group h3 .tag-count {
      font-size: 0.65em;
      font-weight: 500;
      background: ${colors.primaryLight};
      color: var(--accent-warm);
      padding: 3px 10px;
      border-radius: 12px;
      font-family: ${fonts.body};
    }

    .tag-post-item {
      display: flex;
      align-items: baseline;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
      transition: all var(--transition);
    }

    .tag-post-item:hover { padding-left: 8px; }
    .tag-post-item:last-child { border-bottom: none; }

    .tag-post-date {
      font-family: ${fonts.mono};
      font-size: 0.78em;
      color: var(--text-muted);
      min-width: 90px;
    }

    .tag-post-title {
      font-family: ${fonts.heading};
      font-weight: 500;
    }

    .tag-post-item:hover .tag-post-title { color: var(--accent-warm); }

    .post-detail-wrapper {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 0 40px 100px;
      position: relative;
      z-index: 1;
    }

    .post-header {
      margin-bottom: 56px;
      padding: 80px 0 40px;
      position: relative;
    }

    .post-header-deco {
      position: absolute;
      top: 0;
      left: 0;
      width: 100px;
      height: 4px;
      background: linear-gradient(90deg, var(--accent-warm), var(--accent-rose), var(--accent-violet));
      border-radius: 2px;
    }

    .post-header-ornament {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 32px;
    }

    .ornament-line {
      width: 40px;
      height: 1px;
      background: var(--border-color);
    }

    .ornament-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent-warm);
    }

    .post-header h1 {
      font-family: ${fonts.heading};
      font-size: 3em;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 24px;
      color: var(--text-primary);
      letter-spacing: -0.03em;
    }

    .post-content {
      font-size: 1.05em;
      line-height: 2;
      color: var(--text-primary);
      position: relative;
    }

    .post-content::before {
      content: '';
      position: absolute;
      left: -24px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(to bottom, var(--accent-warm), var(--accent-rose), var(--accent-violet), transparent);
      border-radius: 1px;
    }

    .post-content h1, .post-content h2, .post-content h3, .post-content h4 {
      font-family: ${fonts.heading};
      margin-top: 2.5em;
      margin-bottom: 0.8em;
      line-height: 1.35;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }

    .post-content h2[id], .post-content h3[id] {
      scroll-margin-top: 80px;
    }

    .post-content h2 {
      font-size: 1.6em;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);
      position: relative;
    }

    .post-content h2::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 50px;
      height: 2px;
      background: linear-gradient(90deg, var(--accent-warm), var(--accent-rose));
    }

    .post-content h3 { font-size: 1.3em; }
    .post-content p { margin-bottom: 1.4em; }
    .post-content p:first-of-type::first-letter {
      font-family: ${fonts.heading};
      font-size: 3.2em;
      font-weight: 900;
      float: left;
      line-height: 0.8;
      margin: 6px 12px 0 0;
      color: var(--accent-warm);
    }
    .post-content ul, .post-content ol { margin-bottom: 1.4em; padding-left: 1.8em; }
    .post-content li { margin-bottom: 0.5em; }

    .post-content blockquote {
      border-left: 3px solid var(--accent-warm);
      padding: 20px 28px;
      margin: 1.5em 0;
      margin-left: -20px;
      background: ${colors.primaryLight};
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      color: var(--text-secondary);
      font-style: italic;
      position: relative;
    }

    .post-content blockquote::before {
      content: '"';
      position: absolute;
      top: -12px;
      left: 16px;
      font-family: ${fonts.heading};
      font-size: 3.5em;
      color: var(--accent-warm);
      opacity: 0.15;
      line-height: 1;
    }

    .post-content pre {
      background: var(--bg-code);
      border: 1px solid var(--border-color);
      padding: 24px;
      border-radius: var(--radius-sm);
      overflow-x: auto;
      margin: 1.5em 0;
      font-size: 0.88em;
      line-height: 1.7;
      position: relative;
    }

    .post-content code {
      font-family: ${fonts.mono};
      font-size: 0.88em;
    }

    .post-content :not(pre) > code {
      background: ${colors.primaryLight};
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.82em;
      color: var(--accent-warm);
      border: 1px solid ${colors.primaryLight};
    }

    .post-content img {
      max-width: 100%;
      height: auto;
      border-radius: var(--radius-sm);
      margin: 2em 0;
      box-shadow: var(--shadow-card);
    }

    .post-content table {
      border-collapse: collapse;
      width: 100%;
      margin: 1.5em 0;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .post-content th {
      background: ${colors.primaryLight};
      font-weight: 600;
      font-size: 0.88em;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .post-content th, .post-content td {
      border: 1px solid var(--border-color);
      padding: 12px 18px;
      text-align: left;
    }

    .post-content hr {
      border: none;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border-color), transparent);
      margin: 3em 0;
    }

    .post-tags {
      margin-top: 56px;
      padding-top: 36px;
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .post-tags-label {
      font-size: 0.75em;
      color: var(--text-muted);
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 56px;
      padding: 14px 28px;
      border-radius: 28px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 0.88em;
      font-weight: 500;
      transition: all var(--transition);
      backdrop-filter: blur(10px);
    }

    .back-link:hover {
      border-color: var(--accent-warm);
      color: var(--accent-warm);
      background: ${colors.primaryLight};
      transform: translateX(-4px);
    }

    .site-footer {
      border-top: 1px solid var(--border-color);
      padding: 48px 40px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.8em;
      position: relative;
      z-index: 1;
    }

    .site-footer::before {
      content: '';
      display: block;
      width: 40px;
      height: 2px;
      background: linear-gradient(90deg, var(--accent-warm), var(--accent-rose));
      margin: 0 auto 24px;
      border-radius: 1px;
    }

    .page-section { display: none; }
    .page-section.active { display: block; animation: fadeIn 0.5s ease; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .tag-filter-active .tag-item { display: none; }
    .tag-filter-active .tag-group { display: none; }
    .tag-filter-active .tag-item.show { display: flex; }
    .tag-filter-active .tag-group.show { display: block; }

    @media (max-width: 768px) {
      .header-inner { padding: 14px 20px; }
      .hero-section { grid-template-columns: 1fr; padding: 60px 0 48px; gap: 0; }
      .hero-right { display: none; }
      .hero-title { font-size: 2.2em; }
      .post-grid { grid-template-columns: 1fr; }
      .featured-card { padding: 32px 24px; }
      .featured-card h2 { font-size: 1.5em; }
      .featured-number { font-size: 4em; }
      .featured-deco { display: none; }
      .post-header h1 { font-size: 2em; }
      .main-content, .post-detail-wrapper { padding-left: 20px; padding-right: 20px; }
      .timeline-content { flex-direction: column; gap: 4px; }
      .timeline-date { min-width: auto; }
      .post-content::before { display: none; }
      .post-content blockquote { margin-left: 0; }
      .post-body-layout { grid-template-columns: 1fr; }
      .post-toc { display: none; }
    }

    .reading-progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, var(--accent-warm), var(--accent-rose), var(--accent-violet));
      z-index: 200;
      transition: width 0.1s linear;
    }

    .post-body-layout {
      display: grid;
      grid-template-columns: 1fr 200px;
      gap: 40px;
      align-items: start;
    }

    .post-toc {
      position: sticky;
      top: 80px;
      padding: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      backdrop-filter: blur(10px);
    }

    .toc-title {
      font-size: 0.72em;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .toc-nav a {
      display: block;
      padding: 4px 0;
      font-size: 0.78em;
      color: var(--text-muted);
      transition: all var(--transition);
      line-height: 1.5;
    }

    .toc-nav a.toc-h3 { padding-left: 12px; }
    .toc-nav a:hover, .toc-nav a.active { color: var(--accent-warm); }

    .post-author-card {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 48px;
      padding: 24px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      backdrop-filter: blur(10px);
    }

    .author-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-warm), var(--accent-rose));
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ${fonts.heading};
      font-size: 1.4em;
      font-weight: 900;
      color: #fff;
      flex-shrink: 0;
    }

    .author-name {
      font-family: ${fonts.heading};
      font-weight: 700;
      font-size: 1.05em;
      color: var(--text-primary);
    }

    .author-bio {
      font-size: 0.85em;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .post-share {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 24px;
      padding: 16px 0;
      border-top: 1px solid var(--border-color);
    }

    .share-label {
      font-size: 0.78em;
      font-weight: 500;
      color: var(--text-muted);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .share-copy-btn {
      padding: 8px 18px;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-secondary);
      font-size: 0.82em;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition);
    }

    .share-copy-btn:hover {
      border-color: var(--accent-warm);
      color: var(--accent-warm);
      background: ${colors.primaryLight};
    }

    .reading-time {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .minimal-list {
      display: flex;
      flex-direction: column;
      padding-top: 80px;
    }

    .minimal-item {
      display: flex;
      align-items: baseline;
      gap: 24px;
      padding: 18px 0;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
      transition: all var(--transition);
    }

    .minimal-item:first-child {
      border-top: 1px solid var(--border-color);
    }

    .minimal-item:hover {
      padding-left: 12px;
    }

    .minimal-item:hover .minimal-title {
      color: var(--accent-warm);
    }

    .minimal-date {
      font-family: ${fonts.mono};
      font-size: 0.82em;
      color: var(--text-muted);
      min-width: 100px;
      flex-shrink: 0;
    }

    .minimal-title {
      font-family: ${fonts.heading};
      font-weight: 600;
      font-size: 1.1em;
      transition: color var(--transition);
    }

    .classic-layout {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 48px;
      align-items: start;
    }

    .classic-main {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .classic-card {
      display: block;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 28px 32px;
      transition: all var(--transition);
      box-shadow: var(--shadow-card);
      backdrop-filter: blur(10px);
      color: var(--text-primary);
    }

    .classic-card:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-3px);
      border-color: var(--border-hover);
      background: var(--bg-card-hover);
    }

    .classic-card h3 {
      font-family: ${fonts.heading};
      font-size: 1.3em;
      font-weight: 700;
      margin-bottom: 10px;
      line-height: 1.35;
      letter-spacing: -0.01em;
      color: var(--text-primary);
      transition: color var(--transition);
    }

    .classic-card:hover h3 {
      color: var(--accent-warm);
    }

    .classic-excerpt {
      color: var(--text-secondary);
      font-size: 0.9em;
      line-height: 1.7;
      margin-bottom: 12px;
      font-weight: 300;
    }

    .classic-sidebar {
      position: sticky;
      top: 80px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .sidebar-section {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 24px;
      backdrop-filter: blur(10px);
    }

    .sidebar-title {
      font-family: ${fonts.heading};
      font-size: 0.82em;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-color);
    }

    .sidebar-tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .sidebar-recent {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .sidebar-recent-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
      transition: all var(--transition);
    }

    .sidebar-recent-item:last-child {
      border-bottom: none;
    }

    .sidebar-recent-item:hover {
      padding-left: 8px;
    }

    .sidebar-recent-item:hover .sidebar-recent-title {
      color: var(--accent-warm);
    }

    .sidebar-recent-title {
      font-family: ${fonts.heading};
      font-weight: 500;
      font-size: 0.92em;
      line-height: 1.4;
      transition: color var(--transition);
    }

    .sidebar-recent-date {
      font-family: ${fonts.mono};
      font-size: 0.75em;
      color: var(--text-muted);
    }

    @media (max-width: 768px) {
      .classic-layout {
        grid-template-columns: 1fr;
      }
      .classic-sidebar {
        position: static;
        flex-direction: row;
        flex-wrap: wrap;
      }
      .sidebar-section {
        flex: 1;
        min-width: 240px;
      }
      .minimal-item {
        flex-direction: column;
        gap: 4px;
      }
      .minimal-date {
        min-width: auto;
      }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <div class="site-title"><a href="#index">${escapeHtml(mergedConfig.siteTitle)}</a></div>
      <nav class="site-nav">
        <a href="#index">首页</a>
        <a href="#archive">归档</a>
        <a href="#tags">标签</a>
      </nav>
    </div>
  </header>
  <div class="page-section active" id="page-index" data-section="index">
    <div class="main-content">
      ${heroHtml}
      ${indexContentHtml}
    </div>
  </div>
  <div class="page-section" id="page-archive" data-section="archive">
    <div class="main-content">
      <div class="page-header">
        <h1 class="page-title">Archive</h1>
        <p class="page-subtitle">共 ${published.length} 篇文章</p>
      </div>
      ${archiveSection}
    </div>
  </div>
  <div class="page-section" id="page-tags" data-section="tags">
    <div class="main-content">
      <div class="page-header">
        <h1 class="page-title">Tags</h1>
        <p class="page-subtitle">共 ${sortedTags.length} 个标签</p>
      </div>
      <div class="tag-cloud-section">${tagCloud}</div>
      <div id="tag-groups-container">${tagGroups}</div>
    </div>
  </div>
  ${postSections}
  <footer class="site-footer">
    <p>&copy; ${new Date().getFullYear()} ${escapeHtml(mergedConfig.author)} &middot; Crafted with passion</p>
  </footer>
  <script>
    function showPage(pageId) {
      var sections = document.querySelectorAll('.page-section');
      for (var i = 0; i < sections.length; i++) sections[i].classList.remove('active');
      var el = document.getElementById(pageId);
      if (el) el.classList.add('active');
      window.scrollTo(0, 0);
    }

    function navigateToPost(slug, sectionId) {
      showPage('post-' + slug);
      if (sectionId) {
        setTimeout(function() {
          var target = document.getElementById(sectionId);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }

    function navigateToIndex() {
      showPage('page-index');
    }

    function navigateToArchive() {
      showPage('page-archive');
    }

    function navigateToTags() {
      showPage('page-tags');
      resetTagFilter();
    }

    function resetTagFilter() {
      var container = document.getElementById('tag-groups-container');
      if (container) container.classList.remove('tag-filter-active');
      var items = document.querySelectorAll('.tag-item');
      var groups = document.querySelectorAll('.tag-group');
      for (var i = 0; i < items.length; i++) { items[i].classList.remove('show'); }
      for (var j = 0; j < groups.length; j++) { groups[j].classList.remove('show'); }
    }

    function filterByTag(tagName) {
      var container = document.getElementById('tag-groups-container');
      if (!container) return;
      container.classList.add('tag-filter-active');

      var items = document.querySelectorAll('.tag-item');
      var groups = document.querySelectorAll('.tag-group');

      for (var i = 0; i < items.length; i++) {
        if (items[i].getAttribute('data-tag') === tagName) {
          items[i].classList.add('show');
        } else {
          items[i].classList.remove('show');
        }
      }

      for (var j = 0; j < groups.length; j++) {
        var heading = groups[j].querySelector('[data-tag-heading]');
        if (heading && heading.getAttribute('data-tag-heading') === tagName) {
          groups[j].classList.add('show');
        } else {
          groups[j].classList.remove('show');
        }
      }

      var tagSection = document.getElementById('page-tags');
      if (tagSection && !tagSection.classList.contains('active')) {
        showPage('page-tags');
      }
    }

    document.addEventListener('click', function(e) {
      var el = e.target;
      while (el && el !== document) {
        if (el.tagName === 'A') {
          var href = el.getAttribute('href') || '';
          if (href.indexOf('#post/') === 0) {
            e.preventDefault();
            var slugPart = href.replace('#post/', '');
            var parts = slugPart.split('/');
            navigateToPost(parts[0], parts[1] || '');
            return;
          }
          if (href === '#index' || href === '#') {
            e.preventDefault();
            navigateToIndex();
            return;
          }
          if (href === '#archive') {
            e.preventDefault();
            navigateToArchive();
            return;
          }
          if (href === '#tags') {
            e.preventDefault();
            navigateToTags();
            return;
          }
          if (href.indexOf('#section-') === 0) {
            e.preventDefault();
            var targetId = href.slice(1);
            var anchor = document.getElementById(targetId);
            if (anchor) {
              anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
              updateTocActive();
            }
            return;
          }
        }
        var sectionAttr = el.getAttribute('data-section');
        if (sectionAttr && el.classList.contains('tag-post-item')) {
          e.preventDefault();
          var postHref = el.getAttribute('href');
          if (postHref) {
            var slugPart = postHref.replace('#post/', '');
            navigateToPost(slugPart, sectionAttr);
          }
          return;
        }
        var tagFilter = el.getAttribute('data-tag-filter');
        if (tagFilter) {
          e.preventDefault();
          filterByTag(tagFilter);
          return;
        }
        el = el.parentElement;
      }
    });

    window.addEventListener('scroll', function() {
      var bar = document.getElementById('reading-progress');
      if (!bar) return;
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + '%';
    });

    function updateTocActive() {
      var sections = document.querySelectorAll('.post-content h2[id], .post-content h3[id]');
      var tocLinks = document.querySelectorAll('.toc-nav a');
      if (sections.length === 0 || tocLinks.length === 0) return;

      var current = '';
      for (var i = sections.length - 1; i >= 0; i--) {
        var rect = sections[i].getBoundingClientRect();
        if (rect.top <= 120) {
          current = sections[i].id;
          break;
        }
      }

      for (var j = 0; j < tocLinks.length; j++) {
        tocLinks[j].classList.remove('active');
        if (tocLinks[j].getAttribute('href') === '#' + current) {
          tocLinks[j].classList.add('active');
        }
      }
    }

    window.addEventListener('scroll', updateTocActive);

    function copyPostLink() {
      var input = document.createElement('input');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      try { document.execCommand('copy'); } catch(e) {}
      document.body.removeChild(input);
      var btn = document.querySelector('.share-copy-btn');
      if (btn) {
        var original = btn.textContent;
        btn.textContent = '已复制!';
        setTimeout(function() { btn.textContent = original; }, 2000);
      }
    }

    navigateToIndex();
  </script>
</body>
</html>`
}

const THEME_NAV_LABELS: Record<string, { home: string; archive: string; tags: string }> = {
  'ink-wash': { home: '首页', archive: '归档', tags: '标签' },
  'terminal': { home: 'ls home', archive: 'cat archive', tags: 'grep tags' },
  'newspaper': { home: 'Front Page', archive: 'Archive', tags: 'Index' },
  'glassmorphism': { home: 'Home', archive: 'Archive', tags: 'Tags' },
  'bento': { home: 'Home', archive: 'Archive', tags: 'Tags' },
  'narrative': { home: 'Prologue', archive: 'Chronicle', tags: 'Themes' },
}

function generateNewThemeSingleFileBlog(
  posts: BlogPost[],
  published: BlogPost[],
  config: BlogConfig,
  isDark: boolean,
  themeStyle: ThemeStyle
): string {
  const themeCss = getThemeStyleCss(themeStyle, isDark)
  const navLabels = THEME_NAV_LABELS[themeStyle] || THEME_NAV_LABELS['ink-wash']

  const sealChar = escapeHtml(config.siteTitle.charAt(0) || 'B')

  const cardsHtml = published.map((post) => {
    const tagsHtml = post.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
    const excerpt = post.description ? escapeHtml(post.description) : escapeHtml(extractExcerpt(post.content, 160))
    return `<a class="card" href="#post/${escapeAttr(post.slug)}">
      <div class="card-title">${escapeHtml(post.title)}</div>
      <div class="card-date">${escapeHtml(formatDate(post.date))}${post.author ? ' · ' + escapeHtml(post.author) : ''}</div>
      <div class="card-excerpt">${excerpt}</div>
      ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
    </a>`
  }).join('')

  const archiveByYear = new Map<string, BlogPost[]>()
  for (const post of published) {
    const year = post.date ? new Date(post.date).getFullYear().toString() : '未知'
    const list = archiveByYear.get(year) || []
    list.push(post)
    archiveByYear.set(year, list)
  }
  const archiveYears = [...archiveByYear.keys()].sort((a, b) => b.localeCompare(a))

  const archiveHtml = archiveYears.map(year => {
    const yearPosts = archiveByYear.get(year)!
    const items = yearPosts.map(p => `
      <div class="archive-item">
        <a href="#post/${escapeAttr(p.slug)}">${escapeHtml(p.title)}</a>
        <span class="archive-item-date">${escapeHtml(formatDate(p.date))}</span>
      </div>
    `).join('')
    return `<div class="archive-year">
      <div class="archive-year-title">${escapeHtml(year)}</div>
      ${items}
    </div>`
  }).join('')

  const tagMap = new Map<string, BlogPost[]>()
  for (const post of published) {
    for (const tag of post.tags) {
      const list = tagMap.get(tag) || []
      list.push(post)
      tagMap.set(tag, list)
    }
  }
  const sortedTags = [...tagMap.keys()].sort()

  const tagCloudHtml = sortedTags.map(tag => {
    const count = tagMap.get(tag)!.length
    return `<a class="tag-cloud-item" data-tag="${escapeAttr(tag)}" href="javascript:void(0)">${escapeHtml(tag)}${themeStyle === 'terminal' ? '[' + count + ']' : ' (' + count + ')'}</a>`
  }).join('')

  const tagPostsHtml = sortedTags.map(tag => {
    const tagPosts = tagMap.get(tag)!
    const items = tagPosts.map(p => `
      <div class="tag-post-item">
        <a href="#post/${escapeAttr(p.slug)}">${escapeHtml(p.title)}</a>
        <span class="tag-post-date">${escapeHtml(formatDate(p.date))}</span>
      </div>
    `).join('')
    return `<div class="tag-posts-section" id="tag-posts-${escapeAttr(tag)}">
      <div class="tag-posts-title">${themeStyle === 'terminal' ? '// ' : ''}${escapeHtml(tag)}</div>
      ${items}
    </div>`
  }).join('')

  const postSectionsHtml = posts.map(post => {
    const tagsHtml = post.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
    const metaParts: string[] = []
    if (post.date) metaParts.push(escapeHtml(formatDate(post.date)))
    if (post.author) metaParts.push(escapeHtml(post.author))

    let contentWithIds = post.content
    const tocItems = extractToc(contentWithIds)
    for (const item of tocItems) {
      const tag = `h${item.level}`
      contentWithIds = contentWithIds.replace(
        `<${tag}>${item.text}</${tag}>`,
        `<${tag} id="${item.id}">${item.text}</${tag}>`
      )
    }

    return `<div class="page-section" id="post-${escapeAttr(post.slug)}" data-section="post">
      <div class="post-detail">
        <a href="#index" class="back-link">&larr; ${themeStyle === 'terminal' ? 'cd ..' : themeStyle === 'narrative' ? 'Back to Story' : '返回'}</a>
        <h1 class="post-title">${escapeHtml(post.title)}</h1>
        <div class="post-meta">${metaParts.join(' · ')}</div>
        <div class="post-body drop-cap">${contentWithIds}</div>
        ${tagsHtml ? `<div class="post-tags-section">${tagsHtml}</div>` : ''}
      </div>
    </div>`
  }).join('')

  const heroExtra = themeStyle === 'terminal' ? '<span class="hero-cursor"></span>' : ''
  const headerExtra = themeStyle === 'ink-wash' ? `<div class="hero-seal">${sealChar}</div>` : ''
  const footerContent = themeStyle === 'terminal'
    ? `<div class="footer-sys-info">Blog engine v1.0.0 | Uptime: ${new Date().toISOString().split('T')[0]}</div><div class="footer-sys-info">&copy; ${escapeHtml(config.author)} | All rights reserved</div>`
    : themeStyle === 'ink-wash'
      ? `<div class="footer-seal">${sealChar}</div><div class="footer-text">&copy; ${new Date().getFullYear()} ${escapeHtml(config.siteTitle)}</div>`
      : themeStyle === 'narrative'
        ? `<div class="footer-ornament">\u2756</div><div class="footer-end-mark">The End</div><div class="footer-text">&copy; ${new Date().getFullYear()} ${escapeHtml(config.author)}</div>`
        : `&copy; ${new Date().getFullYear()} ${escapeHtml(config.author)}`

  return `<!DOCTYPE html>
<html lang="${escapeAttr(config.language)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(config.siteTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Noto+Serif+SC:wght@400;600;700;900&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Lora:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&family=Ma+Shan+Zheng&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
<style>
${themeCss}

.page-section { display: none; }
.page-section.active { display: block; animation: themeFadeIn 0.5s ease; }
@keyframes themeFadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
</head>
<body>
<div class="blog-container">
  <header class="blog-header">
    ${headerExtra}
    <nav class="blog-nav">
      <a class="nav-link active" data-view="home" href="#index">${navLabels.home}</a>
      <a class="nav-link" data-view="archive" href="#archive">${navLabels.archive}</a>
      <a class="nav-link" data-view="tags" href="#tags">${navLabels.tags}</a>
    </nav>
  </header>

  <div class="page-section active" id="page-index" data-section="index">
    <section class="blog-hero blog-view view-home">
      <h1 class="hero-title">${escapeHtml(config.siteTitle)}${heroExtra}</h1>
      <p class="hero-description">${escapeHtml(config.siteDescription)}</p>
    </section>
    <section class="blog-home blog-view view-home">
      <div class="card-grid">${cardsHtml}</div>
    </section>
  </div>

  <div class="page-section" id="page-archive" data-section="archive">
    <section class="blog-archive blog-view view-archive">
      <div class="archive-title">${themeStyle === 'terminal' ? '$ cat archive' : themeStyle === 'narrative' ? 'Chronicle' : '归档'}</div>
      ${archiveHtml}
    </section>
  </div>

  <div class="page-section" id="page-tags" data-section="tags">
    <section class="blog-tags blog-view view-tags">
      <div class="tags-title">${themeStyle === 'terminal' ? '$ grep tags' : themeStyle === 'narrative' ? 'Themes' : '标签'}</div>
      <div class="tag-cloud">${tagCloudHtml}</div>
      ${tagPostsHtml}
    </section>
  </div>

  ${postSectionsHtml}

  <footer class="blog-footer">
    ${footerContent}
  </footer>
</div>

<script>
var currentView = 'home';

function showPage(pageId) {
  var sections = document.querySelectorAll('.page-section');
  for (var i = 0; i < sections.length; i++) sections[i].classList.remove('active');
  var el = document.getElementById(pageId);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
}

function showView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.blog-view').forEach(function(v) { v.style.display = 'none'; });
  document.querySelectorAll('.view-' + viewName).forEach(function(v) { v.style.display = 'block'; });
  document.querySelectorAll('.nav-link').forEach(function(l) {
    l.classList.remove('active');
    if (l.getAttribute('data-view') === viewName) l.classList.add('active');
  });
}

function navigateToPost(slug, sectionId) {
  showPage('post-' + slug);
  showView('');
  if (sectionId) {
    setTimeout(function() {
      var target = document.getElementById(sectionId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

function navigateToIndex() {
  showPage('page-index');
  showView('home');
}

function navigateToArchive() {
  showPage('page-archive');
  showView('archive');
}

function navigateToTags() {
  showPage('page-tags');
  showView('tags');
}

document.addEventListener('click', function(e) {
  var el = e.target;
  while (el && el !== document) {
    if (el.tagName === 'A') {
      var href = el.getAttribute('href') || '';
      if (href.indexOf('#post/') === 0) {
        e.preventDefault();
        var slugPart = href.replace('#post/', '');
        var parts = slugPart.split('/');
        navigateToPost(parts[0], parts[1] || '');
        return;
      }
      if (href === '#index' || href === '#') {
        e.preventDefault();
        navigateToIndex();
        return;
      }
      if (href === '#archive') {
        e.preventDefault();
        navigateToArchive();
        return;
      }
      if (href === '#tags') {
        e.preventDefault();
        navigateToTags();
        return;
      }
      if (href.indexOf('#section-') === 0) {
        e.preventDefault();
        var targetId = href.slice(1);
        var anchor = document.getElementById(targetId);
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    if (el.classList && el.classList.contains('nav-link')) {
      e.preventDefault();
      var view = el.getAttribute('data-view');
      if (view === 'home') navigateToIndex();
      else if (view === 'archive') navigateToArchive();
      else if (view === 'tags') navigateToTags();
      return;
    }
    if (el.classList && el.classList.contains('tag-cloud-item')) {
      e.preventDefault();
      document.querySelectorAll('.tag-posts-section').forEach(function(s) { s.style.display = 'none'; });
      var tag = el.getAttribute('data-tag');
      var sec = document.getElementById('tag-posts-' + tag);
      if (sec) sec.style.display = 'block';
      return;
    }
    el = el.parentElement;
  }
});

navigateToIndex();
</script>
</body>
</html>`
}
