export type ThemeStyle = 'magazine' | 'minimal' | 'classic' | 'ink-wash' | 'terminal' | 'newspaper' | 'glassmorphism' | 'bento' | 'narrative'

export interface BlogConfig {
  siteUrl: string
  siteTitle: string
  siteDescription: string
  author: string
  language: string
  postsPerPage: number
  dateFormat: string
  theme: 'light' | 'dark' | 'auto'
  layout: 'magazine' | 'minimal' | 'classic'
  colorScheme: 'warm' | 'ocean' | 'forest' | 'rose' | 'violet'
  font: 'serif' | 'sans' | 'mono'
  themeStyle: ThemeStyle
}

export interface BlogPost {
  title: string
  slug: string
  date: string
  tags: string[]
  category: string
  description: string
  author: string
  coverImage: string
  draft: boolean
  content: string
  rawContent: string
}

export const DEFAULT_BLOG_CONFIG: BlogConfig = {
  siteUrl: 'https://example.com',
  siteTitle: 'My Blog',
  siteDescription: 'A simple static blog',
  author: 'Anonymous',
  language: 'zh-CN',
  postsPerPage: 10,
  dateFormat: 'YYYY-MM-DD',
  theme: 'auto',
  layout: 'magazine',
  colorScheme: 'warm',
  font: 'serif',
  themeStyle: 'magazine',
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
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

function tagId(tag: string): string {
  return 'tag-' + tag.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')
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

function getStyles(config: BlogConfig): string {
  const isDark = config.theme === 'dark'
  return `
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
      --accent-warm: ${isDark ? '#f59e0b' : '#d97706'};
      --accent-cool: ${isDark ? '#06b6d4' : '#0891b2'};
      --accent-violet: ${isDark ? '#a78bfa' : '#7c3aed'};
      --accent-rose: ${isDark ? '#fb7185' : '#e11d48'};
      --accent-emerald: ${isDark ? '#34d399' : '#059669'};
      --accent: var(--accent-warm);
      --accent-light: ${isDark ? 'rgba(245,158,11,0.08)' : 'rgba(217,119,6,0.04)'};
      --shadow-card: ${isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.04)'};
      --shadow-card-hover: ${isDark ? '0 12px 40px rgba(0,0,0,0.4)' : '0 12px 40px rgba(0,0,0,0.08)'};
      --radius: 16px;
      --radius-sm: 10px;
      --max-width: 800px;
      --transition: 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
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
      background: radial-gradient(circle, ${isDark ? 'rgba(245,158,11,0.04)' : 'rgba(217,119,6,0.03)'} 0%, transparent 70%);
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
      background: radial-gradient(circle, ${isDark ? 'rgba(167,139,250,0.03)' : 'rgba(124,58,237,0.02)'} 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    a { color: var(--accent-warm); text-decoration: none; transition: all var(--transition); }
    a:hover { color: var(--accent-rose); }

    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      background: ${isDark ? 'rgba(10,10,15,0.8)' : 'rgba(250,250,248,0.8)'};
      border-bottom: 1px solid var(--border-color);
    }

    .header-inner {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 18px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .site-title {
      font-family: 'Playfair Display', 'Noto Serif SC', Georgia, serif;
      font-size: 1.6em;
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

    .site-nav {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .site-nav a {
      padding: 8px 18px;
      border-radius: 24px;
      font-size: 0.85em;
      font-weight: 500;
      color: var(--text-secondary);
      transition: all var(--transition);
      letter-spacing: 0.02em;
    }

    .site-nav a:hover {
      background: ${isDark ? 'rgba(245,158,11,0.1)' : 'rgba(217,119,6,0.06)'};
      color: var(--accent-warm);
    }

    .main-content {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 0 32px 80px;
      position: relative;
      z-index: 1;
    }

    .hero-section {
      padding: 80px 0 60px;
      position: relative;
    }

    .hero-section::before {
      content: '';
      position: absolute;
      top: 40px;
      left: -60px;
      width: 120px;
      height: 120px;
      border: 2px solid ${isDark ? 'rgba(245,158,11,0.1)' : 'rgba(217,119,6,0.08)'};
      border-radius: 50%;
      animation: float 8s ease-in-out infinite;
    }

    .hero-section::after {
      content: '';
      position: absolute;
      top: 100px;
      right: -40px;
      width: 80px;
      height: 80px;
      border: 2px solid ${isDark ? 'rgba(167,139,250,0.1)' : 'rgba(124,58,237,0.06)'};
      border-radius: 4px;
      transform: rotate(45deg);
      animation: float 10s ease-in-out infinite reverse;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(5deg); }
    }

    .hero-section h2 {
      font-family: 'Playfair Display', 'Noto Serif SC', Georgia, serif;
      font-size: 3.2em;
      font-weight: 900;
      margin-bottom: 16px;
      color: var(--text-primary);
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, var(--accent-warm), var(--accent-rose), var(--accent-violet));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-section p {
      font-size: 1.15em;
      color: var(--text-secondary);
      font-weight: 300;
      max-width: 560px;
    }
      color: var(--text-secondary);
    }

    .post-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 24px 28px;
      margin-bottom: 20px;
      transition: all 0.25s ease;
      box-shadow: var(--shadow-sm);
    }

    .post-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
      border-color: var(--accent);
    }

    .post-card h2 {
      font-family: 'Noto Serif SC', Georgia, serif;
      font-size: 1.35em;
      font-weight: 600;
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .post-card h2 a { color: var(--text-primary); }
    .post-card h2 a:hover { color: var(--accent); }

    .post-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      color: var(--text-muted);
      font-size: 0.85em;
      margin-bottom: 10px;
    }

    .post-meta .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .post-meta svg { width: 14px; height: 14px; opacity: 0.7; }

    .post-description {
      color: var(--text-secondary);
      font-size: 0.95em;
      line-height: 1.7;
      margin-bottom: 12px;
    }

    .tag-list { display: flex; flex-wrap: wrap; gap: 6px; }

    .tag {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.78em;
      font-weight: 500;
      background: var(--accent-light);
      color: var(--accent);
      transition: all 0.2s;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .tag:hover {
      border-color: var(--accent);
      background: var(--accent-light);
    }

    .category-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.78em;
      font-weight: 500;
      background: ${isDark ? 'rgba(52,211,153,0.1)' : 'rgba(16,185,129,0.08)'};
      color: ${isDark ? '#34d399' : '#059669'};
    }

    .page-title {
      font-family: 'Noto Serif SC', Georgia, serif;
      font-size: 1.8em;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .page-subtitle {
      color: var(--text-secondary);
      font-size: 1em;
      margin-bottom: 32px;
    }

    .archive-section { margin-bottom: 36px; }

    .archive-year {
      font-family: 'Noto Serif SC', Georgia, serif;
      font-size: 1.6em;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border-color);
    }

    .archive-item {
      display: flex;
      align-items: baseline;
      gap: 16px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border-color);
    }

    .archive-item:last-child { border-bottom: none; }

    .archive-item .date {
      color: var(--text-muted);
      font-size: 0.85em;
      font-family: 'Inter', monospace;
      min-width: 90px;
      flex-shrink: 0;
    }

    .archive-item a {
      font-size: 1em;
      font-weight: 500;
      color: var(--text-primary);
    }

    .archive-item a:hover { color: var(--accent); }

    .tag-cloud-section {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 40px;
      padding: 24px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
    }

    .tag-cloud-section .tag {
      font-size: 0.9em;
      padding: 6px 16px;
    }

    .tag-group {
      margin-bottom: 32px;
    }

    .tag-group h3 {
      font-size: 1.2em;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tag-group h3 .tag-count {
      font-size: 0.7em;
      font-weight: 500;
      background: var(--accent-light);
      color: var(--accent);
      padding: 2px 8px;
      border-radius: 10px;
    }

    .post-detail { max-width: var(--max-width); margin: 0 auto; padding: 32px 24px 64px; }

    .post-header {
      margin-bottom: 36px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .post-header h1 {
      font-family: 'Noto Serif SC', Georgia, serif;
      font-size: 2em;
      font-weight: 700;
      line-height: 1.35;
      margin-bottom: 16px;
      color: var(--text-primary);
    }

    .post-content {
      font-size: 1.05em;
      line-height: 1.9;
      color: var(--text-primary);
    }

    .post-content h1, .post-content h2, .post-content h3, .post-content h4 {
      font-family: 'Noto Serif SC', Georgia, serif;
      margin-top: 2em;
      margin-bottom: 0.8em;
      line-height: 1.4;
      color: var(--text-primary);
    }

    .post-content h2 { font-size: 1.5em; padding-bottom: 6px; border-bottom: 1px solid var(--border-color); }
    .post-content h3 { font-size: 1.25em; }

    .post-content p { margin-bottom: 1.2em; }

    .post-content ul, .post-content ol {
      margin-bottom: 1.2em;
      padding-left: 1.8em;
    }

    .post-content li { margin-bottom: 0.4em; }

    .post-content blockquote {
      border-left: 4px solid var(--accent);
      padding: 12px 20px;
      margin: 1.2em 0;
      background: var(--accent-light);
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      color: var(--text-secondary);
      font-style: italic;
    }

    .post-content pre {
      background: var(--bg-code);
      border: 1px solid var(--border-color);
      padding: 20px;
      border-radius: var(--radius-sm);
      overflow-x: auto;
      margin: 1.2em 0;
      font-size: 0.9em;
      line-height: 1.6;
    }

    .post-content code {
      font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
      font-size: 0.9em;
    }

    .post-content :not(pre) > code {
      background: var(--accent-light);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      color: var(--accent);
    }

    .post-content img {
      max-width: 100%;
      height: auto;
      border-radius: var(--radius-sm);
      margin: 1.5em 0;
      box-shadow: var(--shadow-md);
    }

    .post-content table {
      border-collapse: collapse;
      width: 100%;
      margin: 1.2em 0;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .post-content th {
      background: var(--bg-secondary);
      font-weight: 600;
    }

    .post-content th, .post-content td {
      border: 1px solid var(--border-color);
      padding: 10px 16px;
      text-align: left;
    }

    .post-content hr {
      border: none;
      border-top: 2px solid var(--border-color);
      margin: 2em 0;
    }

    .post-tags {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .post-tags-label {
      font-size: 0.85em;
      color: var(--text-muted);
      font-weight: 500;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 40px;
      padding: 10px 20px;
      border-radius: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 0.9em;
      font-weight: 500;
      transition: all 0.2s;
    }

    .back-link:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-light);
    }

    .site-footer {
      border-top: 1px solid var(--border-color);
      padding: 24px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85em;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .empty-state svg { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.4; }
    .empty-state p { font-size: 1.1em; }

    @media (max-width: 640px) {
      .header-inner { flex-direction: column; gap: 12px; }
      .hero-section h2 { font-size: 1.5em; }
      .post-card { padding: 18px 20px; }
      .post-header h1 { font-size: 1.5em; }
      .archive-item { flex-direction: column; gap: 4px; }
      .archive-item .date { min-width: auto; }
    }
  `
}

function wrapHtml(title: string, body: string, config: BlogConfig, extraClass?: string): string {
  return `<!DOCTYPE html>
<html lang="${escapeAttr(config.language)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - ${escapeHtml(config.siteTitle)}</title>
  <meta name="description" content="${escapeAttr(config.siteDescription)}">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:site_name" content="${escapeAttr(config.siteTitle)}">
  <meta property="og:type" content="website">
  <meta property="og:description" content="${escapeAttr(config.siteDescription)}">
  <style>${getStyles(config)}</style>
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <div class="site-title"><a href="index.html">${escapeHtml(config.siteTitle)}</a></div>
      <nav class="site-nav">
        <a href="index.html">首页</a>
        <a href="archive.html">归档</a>
        <a href="tags.html">标签</a>
      </nav>
    </div>
  </header>
  <div class="${extraClass || 'main-content'}">
${body}
  </div>
  <footer class="site-footer">
    <p>&copy; ${new Date().getFullYear()} ${escapeHtml(config.author)} &middot; Powered by MarkdownEditor</p>
  </footer>
</body>
</html>`
}

export function generatePostHtml(post: BlogPost, config: BlogConfig): string {
  const tagsHtml = post.tags.map(t =>
    `<a href="../tags.html#${tagId(t)}" class="tag">${escapeHtml(t)}</a>`
  ).join('')

  const categoryHtml = post.category
    ? `<span class="category-badge">${escapeHtml(post.category)}</span>`
    : ''

  const metaParts: string[] = []
  if (post.date) metaParts.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escapeHtml(formatDate(post.date))}</span>`)
  if (post.author) metaParts.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${escapeHtml(post.author)}</span>`)
  if (categoryHtml) metaParts.push(categoryHtml)

  const body = `
  <div class="post-header">
    <h1>${escapeHtml(post.title)}</h1>
    <div class="post-meta">${metaParts.join('')}</div>
  </div>
  <div class="post-content">${post.content}</div>
  ${tagsHtml ? `<div class="post-tags"><span class="post-tags-label">标签：</span>${tagsHtml}</div>` : ''}
  <a href="../index.html" class="back-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>返回首页</a>`

  return wrapHtml(post.title, body, config, 'post-detail')
}

export function generateIndexHtml(posts: BlogPost[], config: BlogConfig): string {
  const published = posts.filter(p => !p.draft)

  if (published.length === 0) {
    const body = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg><p>暂无文章</p></div>`
    return wrapHtml(config.siteTitle, body, config)
  }

  const heroSection = `<div class="hero-section">
    <h2>${escapeHtml(config.siteTitle)}</h2>
    <p>${escapeHtml(config.siteDescription)}</p>
  </div>`

  const cards = published.map(post => {
    const metaParts: string[] = []
    if (post.date) metaParts.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escapeHtml(formatDate(post.date))}</span>`)
    if (post.author) metaParts.push(`<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${escapeHtml(post.author)}</span>`)
    if (post.category) metaParts.push(`<span class="category-badge">${escapeHtml(post.category)}</span>`)

    const tagsHtml = post.tags.map(t =>
      `<a href="tags.html#${tagId(t)}" class="tag">${escapeHtml(t)}</a>`
    ).join('')

    return `<div class="post-card">
  <h2><a href="posts/${escapeAttr(post.slug)}/index.html">${escapeHtml(post.title)}</a></h2>
  <div class="post-meta">${metaParts.join('')}</div>
  ${post.description ? `<p class="post-description">${escapeHtml(post.description)}</p>` : ''}
  ${tagsHtml ? `<div class="tag-list">${tagsHtml}</div>` : ''}
</div>`
  }).join('\n')

  return wrapHtml(config.siteTitle, heroSection + cards, config)
}

export function generateArchiveHtml(posts: BlogPost[], config: BlogConfig): string {
  const published = posts.filter(p => !p.draft)
  const byYear = new Map<string, BlogPost[]>()
  for (const post of published) {
    const year = post.date ? new Date(post.date).getFullYear().toString() : '未知'
    const list = byYear.get(year) || []
    list.push(post)
    byYear.set(year, list)
  }

  const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a))

  const body = `<h1 class="page-title">归档</h1>
<p class="page-subtitle">共 ${published.length} 篇文章</p>
${years.map(year => {
    const yearPosts = byYear.get(year)!
    const items = yearPosts.map(post =>
      `<div class="archive-item"><span class="date">${escapeHtml(formatDate(post.date))}</span><a href="posts/${escapeAttr(post.slug)}/index.html">${escapeHtml(post.title)}</a></div>`
    ).join('\n')
    return `<div class="archive-section"><div class="archive-year">${escapeHtml(year)}</div>${items}</div>`
  }).join('\n')}`

  return wrapHtml('归档', body, config)
}

export function generateTagsHtml(posts: BlogPost[], config: BlogConfig): string {
  const published = posts.filter(p => !p.draft)
  const tagMap = new Map<string, BlogPost[]>()
  for (const post of published) {
    for (const tag of post.tags) {
      const list = tagMap.get(tag) || []
      list.push(post)
      tagMap.set(tag, list)
    }
  }

  const tags = [...tagMap.keys()].sort()

  const cloud = tags.map(tag =>
    `<a href="#${tagId(tag)}" class="tag">${escapeHtml(tag)} (${tagMap.get(tag)!.length})</a>`
  ).join('\n')

  const groups = tags.map(tag => {
    const tagPosts = tagMap.get(tag)!
    const items = tagPosts.map(post =>
      `<div class="archive-item"><span class="date">${escapeHtml(formatDate(post.date))}</span><a href="posts/${escapeAttr(post.slug)}/index.html">${escapeHtml(post.title)}</a></div>`
    ).join('\n')
    return `<div class="tag-group" id="${tagId(tag)}"><h3>${escapeHtml(tag)}<span class="tag-count">${tagPosts.length}</span></h3>${items}</div>`
  }).join('\n')

  const body = `<h1 class="page-title">标签</h1>
<p class="page-subtitle">共 ${tags.length} 个标签</p>
<div class="tag-cloud-section">${cloud}</div>
${groups}`

  return wrapHtml('标签', body, config)
}

export function generateRssXml(posts: BlogPost[], config: BlogConfig): string {
  const published = posts.filter(p => !p.draft)
  const items = published.map(post => `    <item>
      <title>${escapeHtml(post.title)}</title>
      <link>${escapeHtml(config.siteUrl)}/posts/${escapeHtml(post.slug)}/</link>
      <description>${escapeHtml(post.description)}</description>
      <author>${escapeHtml(config.author)}</author>
      ${post.date ? `<pubDate>${new Date(post.date).toUTCString()}</pubDate>` : ''}
      <guid>${escapeHtml(config.siteUrl)}/posts/${escapeHtml(post.slug)}/</guid>
    </item>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(config.siteTitle)}</title>
    <link>${escapeHtml(config.siteUrl)}</link>
    <description>${escapeHtml(config.siteDescription)}</description>
    <language>${escapeHtml(config.language)}</language>
    <atom:link href="${escapeHtml(config.siteUrl)}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`
}

export function generateSitemapXml(posts: BlogPost[], config: BlogConfig): string {
  const published = posts.filter(p => !p.draft)
  const urls = [
    `  <url>
    <loc>${escapeHtml(config.siteUrl)}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    ...published.map(post => `  <url>
    <loc>${escapeHtml(config.siteUrl)}/posts/${escapeHtml(post.slug)}/</loc>
    ${post.date ? `<lastmod>${formatDate(post.date)}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`)
  ].join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}
