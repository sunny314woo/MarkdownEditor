export interface ThemeIndexData {
  siteTitle: string
  siteDescription: string
  author: string
  published: Array<{
    title: string
    slug: string
    date: string
    author: string
    tags: string[]
    description: string
    excerpt: string
    category: string
    content: string
  }>
  archiveByYear: Map<string, Array<{title: string; slug: string; date: string}>>
  tagMap: Map<string, Array<{title: string; slug: string; date: string}>>
  sortedTags: string[]
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function getThemeStyleCss(themeStyle: string, isDark: boolean): string {
  switch (themeStyle) {
    case 'ink-wash': return getInkWashCss(isDark)
    case 'terminal': return getTerminalCss(isDark)
    case 'newspaper': return getNewspaperCss(isDark)
    case 'glassmorphism': return getGlassmorphismCss(isDark)
    case 'bento': return getBentoCss(isDark)
    case 'narrative': return getNarrativeCss(isDark)
    default: return ''
  }
}

export function getThemeStyleIndexHtml(themeStyle: string, data: ThemeIndexData): string {
  switch (themeStyle) {
    case 'ink-wash': return getInkWashIndexHtml(data)
    case 'terminal': return getTerminalIndexHtml(data)
    case 'newspaper': return getNewspaperIndexHtml(data)
    case 'glassmorphism': return getGlassmorphismIndexHtml(data)
    case 'bento': return getBentoIndexHtml(data)
    case 'narrative': return getNarrativeIndexHtml(data)
    default: return ''
  }
}

function getInkWashCss(isDark: boolean): string {
  return `
:root {
  --ink-black: #1a1a1a;
  --rice-paper: #f5f0e8;
  --cinnabar: #c23b22;
  --ink-grey: #6b6b6b;
  --ink-white: #faf8f0;
  --ink-light: #e8e0d0;
  --ink-shadow: rgba(26,26,26,0.08);
  --bg: ${isDark ? '#1a1a1a' : '#f5f0e8'};
  --fg: ${isDark ? '#f5f0e8' : '#1a1a1a'};
  --accent: #c23b22;
  --muted: #6b6b6b;
  --card-bg: ${isDark ? '#2a2a2a' : '#faf8f0'};
  --border: ${isDark ? '#3a3a3a' : '#e0d8c8'};
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Noto Serif SC', serif;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.8;
  min-height: 100vh;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.015) 2px,
      rgba(0,0,0,0.015) 4px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 3px,
      rgba(0,0,0,0.01) 3px,
      rgba(0,0,0,0.01) 6px
    );
}

.blog-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px;
}

.blog-header {
  padding: 40px 0 20px;
  text-align: center;
  border-bottom: 1px solid var(--border);
  position: relative;
}

.blog-header::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cinnabar), transparent);
}

.blog-nav {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 20px;
}

.nav-link {
  font-family: 'Noto Serif SC', serif;
  color: var(--muted);
  text-decoration: none;
  font-size: 14px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: color 0.3s;
  position: relative;
  padding-bottom: 4px;
}

.nav-link:hover, .nav-link.active {
  color: var(--cinnabar);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: var(--cinnabar);
}

.blog-hero {
  text-align: center;
  padding: 80px 0 60px;
  position: relative;
}

.hero-title {
  font-family: 'Ma Shan Zheng', 'Noto Serif SC', serif;
  font-size: 48px;
  font-weight: 400;
  color: var(--fg);
  letter-spacing: 8px;
  margin-bottom: 16px;
  position: relative;
  display: inline-block;
}

.hero-title::before {
  content: '';
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--cinnabar);
  writing-mode: vertical-rl;
}

.hero-description {
  color: var(--muted);
  font-size: 16px;
  letter-spacing: 3px;
}

.hero-seal {
  display: inline-block;
  width: 40px;
  height: 40px;
  background: var(--cinnabar);
  color: var(--ink-white);
  font-family: 'Ma Shan Zheng', serif;
  font-size: 18px;
  line-height: 40px;
  text-align: center;
  margin-top: 24px;
  border-radius: 2px;
}

.blog-view { display: none; }
.view-home { display: block; }

.card-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 40px 0;
}

.card {
  background: var(--card-bg);
  border-radius: 2px;
  padding: 28px 32px;
  position: relative;
  box-shadow: 0 2px 12px var(--ink-shadow);
  border-left: 3px solid var(--cinnabar);
  transition: box-shadow 0.3s, transform 0.3s;
  text-decoration: none;
  color: inherit;
  display: block;
}

.card:hover {
  box-shadow: 0 4px 20px rgba(194,59,34,0.12);
  transform: translateY(-2px);
}

.card-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--fg);
}

.card-date {
  color: var(--muted);
  font-size: 13px;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.card-excerpt {
  color: var(--muted);
  font-size: 15px;
  line-height: 1.7;
}

.card-tags {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 2px 14px;
  background: rgba(194,59,34,0.1);
  color: var(--cinnabar);
  border-radius: 20px;
  font-size: 12px;
  letter-spacing: 1px;
}

.blog-divider {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cinnabar), var(--border), transparent);
  margin: 40px auto;
  width: 80%;
}

.blog-archive {
  padding: 40px 0;
}

.archive-title {
  font-family: 'Ma Shan Zheng', 'Noto Serif SC', serif;
  font-size: 28px;
  text-align: center;
  margin-bottom: 40px;
  letter-spacing: 4px;
}

.archive-year {
  margin-bottom: 32px;
  position: relative;
  padding-left: 24px;
  border-left: 2px solid var(--border);
}

.archive-year-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 22px;
  color: var(--cinnabar);
  margin-bottom: 16px;
  position: relative;
}

.archive-year-title::before {
  content: '';
  position: absolute;
  left: -31px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: var(--cinnabar);
  border-radius: 50%;
}

.archive-item {
  padding: 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.archive-item a {
  color: var(--fg);
  text-decoration: none;
  transition: color 0.3s;
}

.archive-item a:hover {
  color: var(--cinnabar);
}

.archive-item-date {
  color: var(--muted);
  font-size: 13px;
}

.blog-tags {
  padding: 40px 0;
}

.tags-title {
  font-family: 'Ma Shan Zheng', 'Noto Serif SC', serif;
  font-size: 28px;
  text-align: center;
  margin-bottom: 40px;
  letter-spacing: 4px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 40px;
}

.tag-cloud-item {
  padding: 6px 20px;
  background: rgba(194,59,34,0.08);
  color: var(--cinnabar);
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
  text-decoration: none;
}

.tag-cloud-item:hover {
  background: rgba(194,59,34,0.18);
  transform: scale(1.05);
}

.tag-posts-section { display: none; }
.tag-posts-section.active { display: block; }

.tag-posts-title {
  font-size: 20px;
  color: var(--cinnabar);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.tag-post-item {
  padding: 10px 0;
  border-bottom: 1px dashed var(--border);
}

.tag-post-item a {
  color: var(--fg);
  text-decoration: none;
}

.tag-post-item a:hover {
  color: var(--cinnabar);
}

.tag-post-date {
  color: var(--muted);
  font-size: 13px;
  margin-left: 12px;
}

.blog-footer {
  text-align: center;
  padding: 40px 0;
  border-top: 1px solid var(--border);
  position: relative;
  margin-top: 40px;
}

.blog-footer::before {
  content: '';
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cinnabar), transparent);
}

.footer-seal {
  display: inline-block;
  width: 48px;
  height: 48px;
  background: var(--cinnabar);
  color: var(--ink-white);
  font-family: 'Ma Shan Zheng', serif;
  font-size: 22px;
  line-height: 48px;
  text-align: center;
  border-radius: 3px;
  margin-bottom: 12px;
}

.footer-text {
  color: var(--muted);
  font-size: 13px;
  letter-spacing: 2px;
}

.post-detail {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 24px;
}

.post-title {
  font-family: 'Ma Shan Zheng', 'Noto Serif SC', serif;
  font-size: 36px;
  text-align: center;
  margin-bottom: 16px;
  letter-spacing: 4px;
}

.post-meta {
  text-align: center;
  color: var(--muted);
  font-size: 14px;
  margin-bottom: 32px;
}

.post-body {
  position: relative;
  padding-left: 20px;
  border-left: 2px solid var(--cinnabar);
}

.post-body p {
  margin-bottom: 1.2em;
  text-indent: 2em;
}

.drop-cap::first-letter {
  float: left;
  font-size: 3.5em;
  line-height: 1;
  padding-right: 8px;
  color: var(--cinnabar);
  font-family: 'Ma Shan Zheng', serif;
}

.post-body h1, .post-body h2, .post-body h3 {
  font-family: 'Noto Serif SC', serif;
  margin: 1.5em 0 0.8em;
  color: var(--fg);
}

.post-body pre {
  background: ${isDark ? '#1a1a1a' : '#f0ebe0'};
  padding: 16px;
  border-radius: 2px;
  overflow-x: auto;
  margin: 1em 0;
  font-size: 14px;
}

.post-body code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
}

.post-body blockquote {
  border-left: 3px solid var(--cinnabar);
  padding-left: 16px;
  color: var(--muted);
  margin: 1em 0;
  font-style: italic;
}

.post-body img {
  max-width: 100%;
  border-radius: 2px;
}

.post-body a {
  color: var(--cinnabar);
  text-decoration: none;
  border-bottom: 1px solid rgba(194,59,34,0.3);
}

.post-body a:hover {
  border-bottom-color: var(--cinnabar);
}

@keyframes inkFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.card {
  animation: inkFadeIn 0.6s ease-out both;
}

.card:nth-child(2) { animation-delay: 0.1s; }
.card:nth-child(3) { animation-delay: 0.2s; }
.card:nth-child(4) { animation-delay: 0.3s; }

@media (max-width: 768px) {
  .blog-container { padding: 0 16px; }
  .hero-title { font-size: 32px; letter-spacing: 4px; }
  .hero-title::before { display: none; }
  .card { padding: 20px; }
  .blog-nav { gap: 20px; }
}
`
}

function getInkWashIndexHtml(data: ThemeIndexData): string {
  const archiveEntries = Array.from(data.archiveByYear.entries()).sort((a, b) => Number(b[0]) - Number(a[0]))
  const tagEntries = Array.from(data.tagMap.entries())

  const cardsHtml = data.published.map((post, i) => {
    const tagsHtml = post.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
    const isFirst = i === 0
    return `
      <a class="card" href="${escapeHtml(post.slug)}.html">
        <div class="card-title">${escapeHtml(post.title)}</div>
        <div class="card-date">${escapeHtml(post.date)}</div>
        <div class="card-excerpt">${escapeHtml(post.excerpt || post.description)}</div>
        <div class="card-tags">${tagsHtml}</div>
      </a>
      ${!isFirst && i % 3 === 0 ? '<hr class="blog-divider">' : ''}
    `
  }).join('')

  const archiveHtml = archiveEntries.map(([year, posts]) => {
    const itemsHtml = posts.map(p => `
      <div class="archive-item">
        <a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a>
        <span class="archive-item-date">${escapeHtml(p.date)}</span>
      </div>
    `).join('')
    return `
      <div class="archive-year">
        <div class="archive-year-title">${escapeHtml(year)}</div>
        ${itemsHtml}
      </div>
    `
  }).join('')

  const tagCloudHtml = data.sortedTags.map(tag => {
    const count = data.tagMap.get(tag)?.length || 0
    return `<a class="tag-cloud-item" data-tag="${escapeHtml(tag)}" href="javascript:void(0)">${escapeHtml(tag)} (${count})</a>`
  }).join('')

  const tagPostsHtml = tagEntries.map(([tag, posts]) => {
    const itemsHtml = posts.map(p => `
      <div class="tag-post-item">
        <a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a>
        <span class="tag-post-date">${escapeHtml(p.date)}</span>
      </div>
    `).join('')
    return `
      <div class="tag-posts-section" id="tag-posts-${escapeHtml(tag)}">
        <div class="tag-posts-title">${escapeHtml(tag)}</div>
        ${itemsHtml}
      </div>
    `
  }).join('')

  const sealChar = escapeHtml(data.siteTitle.charAt(0) || '墨')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.siteTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Ma+Shan+Zheng&display=swap" rel="stylesheet">
<style>${getInkWashCss(false)}</style>
</head>
<body>
<div class="blog-container">
  <header class="blog-header">
    <div class="hero-seal">${sealChar}</div>
    <nav class="blog-nav">
      <a class="nav-link active" data-view="home" href="javascript:void(0)">首页</a>
      <a class="nav-link" data-view="archive" href="javascript:void(0)">归档</a>
      <a class="nav-link" data-view="tags" href="javascript:void(0)">标签</a>
    </nav>
  </header>

  <section class="blog-hero blog-view view-home">
    <h1 class="hero-title">${escapeHtml(data.siteTitle)}</h1>
    <p class="hero-description">${escapeHtml(data.siteDescription)}</p>
  </section>

  <section class="blog-home blog-view view-home">
    <div class="card-grid">${cardsHtml}</div>
  </section>

  <section class="blog-archive blog-view view-archive">
    <div class="archive-title">归档</div>
    ${archiveHtml}
  </section>

  <section class="blog-tags blog-view view-tags">
    <div class="tags-title">标签</div>
    <div class="tag-cloud">${tagCloudHtml}</div>
    ${tagPostsHtml}
  </section>

  <footer class="blog-footer">
    <div class="footer-seal">${sealChar}</div>
    <div class="footer-text">${escapeHtml(data.siteTitle)}</div>
  </footer>
</div>
<script>
document.querySelectorAll('.nav-link').forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
    this.classList.add('active');
    var view = this.getAttribute('data-view');
    document.querySelectorAll('.blog-view').forEach(function(v) { v.style.display = 'none'; });
    var el = document.querySelector('.view-' + view);
    if (el) el.style.display = 'block';
  });
});
document.querySelectorAll('.tag-cloud-item').forEach(function(item) {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.tag-posts-section').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
    var tag = this.getAttribute('data-tag');
    var sec = document.getElementById('tag-posts-' + tag);
    if (sec) { sec.classList.add('active'); sec.style.display = 'block'; }
  });
});
</script>
</body>
</html>`
}

function getTerminalCss(_isDark: boolean): string {
  return `
:root {
  --term-black: #0a0a0a;
  --term-green: #00ff41;
  --term-dark-green: #003300;
  --term-amber: #ffb000;
  --term-dim-green: #00aa2a;
  --term-bg: #0a0a0a;
  --term-fg: #00ff41;
  --term-border: #00ff41;
  --term-card-bg: #0d0d0d;
  --term-muted: #00aa2a;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  background: var(--term-bg);
  color: var(--term-fg);
  line-height: 1.6;
  min-height: 100vh;
  position: relative;
}

body::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  background: repeating-linear-gradient(
    0deg,
    rgba(0,0,0,0.15) 0px,
    rgba(0,0,0,0.15) 1px,
    transparent 1px,
    transparent 3px
  );
}

.blog-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
}

.blog-header {
  padding: 20px 0;
  border-bottom: 1px solid var(--term-dark-green);
}

.blog-header-site {
  color: var(--term-green);
  font-size: 14px;
  text-shadow: 0 0 8px rgba(0,255,65,0.5);
}

.blog-header-site::before {
  content: '$ ';
  color: var(--term-amber);
}

.blog-nav {
  display: flex;
  gap: 24px;
  margin-top: 12px;
}

.nav-link {
  color: var(--term-dim-green);
  text-decoration: none;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s, text-shadow 0.2s;
  position: relative;
}

.nav-link::before {
  content: '> ';
  color: var(--term-amber);
  opacity: 0;
  transition: opacity 0.2s;
}

.nav-link:hover, .nav-link.active {
  color: var(--term-green);
  text-shadow: 0 0 8px rgba(0,255,65,0.5);
}

.nav-link:hover::before, .nav-link.active::before {
  opacity: 1;
}

.blog-view { display: none; }
.view-home { display: block; }

.blog-hero {
  padding: 40px 0 20px;
}

.hero-title {
  font-size: 28px;
  color: var(--term-green);
  text-shadow: 0 0 12px rgba(0,255,65,0.6);
  margin-bottom: 8px;
}

.hero-title::before {
  content: '# ';
  color: var(--term-amber);
}

.hero-description {
  color: var(--term-dim-green);
  font-size: 14px;
}

.hero-description::before {
  content: '// ';
  color: var(--term-muted);
}

.hero-cursor {
  display: inline-block;
  width: 10px;
  height: 18px;
  background: var(--term-green);
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
  margin-left: 4px;
}

@keyframes blink {
  50% { opacity: 0; }
}

.card-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 0;
}

.card {
  background: var(--term-card-bg);
  border: 1px solid var(--term-dark-green);
  border-left: 3px solid var(--term-green);
  padding: 20px 24px;
  text-decoration: none;
  color: inherit;
  display: block;
  transition: border-color 0.3s, box-shadow 0.3s;
  position: relative;
}

.card::before {
  content: '$ ';
  color: var(--term-amber);
  position: absolute;
  top: 20px;
  left: 8px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.card:hover {
  border-color: var(--term-green);
  box-shadow: 0 0 15px rgba(0,255,65,0.15), inset 0 0 15px rgba(0,255,65,0.03);
}

.card:hover::before {
  opacity: 1;
}

.card-title {
  font-size: 16px;
  color: var(--term-green);
  text-shadow: 0 0 6px rgba(0,255,65,0.3);
  margin-bottom: 6px;
  padding-left: 16px;
}

.card-date {
  color: var(--term-muted);
  font-size: 12px;
  padding-left: 16px;
  margin-bottom: 10px;
}

.card-date::before {
  content: '[';
  color: var(--term-dark-green);
}

.card-date::after {
  content: ']';
  color: var(--term-dark-green);
}

.card-excerpt {
  color: var(--term-dim-green);
  font-size: 13px;
  padding-left: 16px;
  line-height: 1.5;
}

.card-tags {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-left: 16px;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 2px 10px;
  border: 1px solid var(--term-dark-green);
  color: var(--term-green);
  font-size: 11px;
  border-radius: 0;
}

.tag::before {
  content: '--';
  color: var(--term-amber);
  margin-right: 4px;
  font-size: 10px;
}

.blog-archive {
  padding: 24px 0;
}

.archive-title {
  font-size: 20px;
  color: var(--term-green);
  text-shadow: 0 0 8px rgba(0,255,65,0.5);
  margin-bottom: 24px;
}

.archive-title::before {
  content: '$ ls -la /archive/';
  color: var(--term-amber);
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
}

.archive-year {
  margin-bottom: 24px;
}

.archive-year-title {
  font-size: 16px;
  color: var(--term-amber);
  margin-bottom: 8px;
}

.archive-year-title::before {
  content: 'drwxr-xr-x  ';
  color: var(--term-dim-green);
  font-size: 12px;
}

.archive-item {
  padding: 4px 0 4px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.archive-item::before {
  content: '-rw-r--r--  ';
  color: var(--term-muted);
  font-size: 11px;
}

.archive-item a {
  color: var(--term-green);
  text-decoration: none;
  transition: text-shadow 0.2s;
}

.archive-item a:hover {
  text-shadow: 0 0 8px rgba(0,255,65,0.5);
}

.archive-item-date {
  color: var(--term-muted);
  font-size: 12px;
}

.blog-tags {
  padding: 24px 0;
}

.tags-title {
  font-size: 20px;
  color: var(--term-green);
  text-shadow: 0 0 8px rgba(0,255,65,0.5);
  margin-bottom: 24px;
}

.tags-title::before {
  content: '$ grep -r . /tags/';
  color: var(--term-amber);
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 32px;
}

.tag-cloud-item {
  padding: 4px 12px;
  border: 1px solid var(--term-dark-green);
  color: var(--term-green);
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.2s, text-shadow 0.2s;
}

.tag-cloud-item:hover {
  border-color: var(--term-green);
  text-shadow: 0 0 8px rgba(0,255,65,0.5);
}

.tag-posts-section { display: none; }
.tag-posts-section.active { display: block; }

.tag-posts-title {
  font-size: 16px;
  color: var(--term-amber);
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--term-dark-green);
}

.tag-post-item {
  padding: 6px 0;
  border-bottom: 1px dashed var(--term-dark-green);
  font-size: 13px;
}

.tag-post-item a {
  color: var(--term-green);
  text-decoration: none;
}

.tag-post-item a:hover {
  text-shadow: 0 0 8px rgba(0,255,65,0.5);
}

.tag-post-date {
  color: var(--term-muted);
  font-size: 12px;
  margin-left: 12px;
}

.blog-footer {
  padding: 24px 0;
  border-top: 1px solid var(--term-dark-green);
  margin-top: 40px;
  font-size: 12px;
  color: var(--term-muted);
}

.footer-sys-info {
  margin-bottom: 4px;
}

.footer-sys-info::before {
  content: 'SYSTEM> ';
  color: var(--term-amber);
}

.post-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px;
}

.post-title {
  font-size: 24px;
  color: var(--term-green);
  text-shadow: 0 0 10px rgba(0,255,65,0.5);
  margin-bottom: 12px;
}

.post-title::before {
  content: '# ';
  color: var(--term-amber);
}

.post-meta {
  color: var(--term-muted);
  font-size: 13px;
  margin-bottom: 24px;
}

.post-meta::before {
  content: '/* ';
}

.post-meta::after {
  content: ' */';
}

.post-body {
  border-left: 2px solid var(--term-dark-green);
  padding-left: 20px;
}

.post-body h1::before { content: '# '; color: var(--term-amber); }
.post-body h2::before { content: '## '; color: var(--term-amber); }
.post-body h3::before { content: '### '; color: var(--term-amber); }

.post-body h1, .post-body h2, .post-body h3 {
  color: var(--term-green);
  text-shadow: 0 0 6px rgba(0,255,65,0.3);
  margin: 1.5em 0 0.8em;
}

.post-body p {
  margin-bottom: 1em;
  line-height: 1.7;
}

.post-body pre {
  background: #050505;
  border: 1px solid var(--term-dark-green);
  padding: 16px;
  overflow-x: auto;
  margin: 1em 0;
  font-size: 13px;
}

.post-body code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: var(--term-green);
}

.post-body blockquote {
  border-left: 2px solid var(--term-amber);
  padding-left: 16px;
  color: var(--term-dim-green);
  margin: 1em 0;
}

.post-body blockquote::before {
  content: '> ';
  color: var(--term-amber);
}

.post-body a {
  color: var(--term-green);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.post-body img {
  max-width: 100%;
  border: 1px solid var(--term-dark-green);
}

@keyframes termGlow {
  0%, 100% { text-shadow: 0 0 8px rgba(0,255,65,0.4); }
  50% { text-shadow: 0 0 16px rgba(0,255,65,0.7); }
}

.hero-title {
  animation: termGlow 3s ease-in-out infinite;
}

@keyframes termFadeIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.card {
  animation: termFadeIn 0.4s ease-out both;
}

.card:nth-child(2) { animation-delay: 0.08s; }
.card:nth-child(3) { animation-delay: 0.16s; }
.card:nth-child(4) { animation-delay: 0.24s; }

@media (max-width: 768px) {
  .blog-container { padding: 0 12px; }
  .hero-title { font-size: 20px; }
  .card { padding: 14px 16px; }
  .card-title { font-size: 14px; }
  .blog-nav { gap: 12px; flex-wrap: wrap; }
}
`
}

function getTerminalIndexHtml(data: ThemeIndexData): string {
  const archiveEntries = Array.from(data.archiveByYear.entries()).sort((a, b) => Number(b[0]) - Number(a[0]))
  const tagEntries = Array.from(data.tagMap.entries())

  const cardsHtml = data.published.map(post => {
    const tagsHtml = post.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
    return `
      <a class="card" href="${escapeHtml(post.slug)}.html">
        <div class="card-title">${escapeHtml(post.title)}</div>
        <div class="card-date">${escapeHtml(post.date)}</div>
        <div class="card-excerpt">${escapeHtml(post.excerpt || post.description)}</div>
        <div class="card-tags">${tagsHtml}</div>
      </a>
    `
  }).join('')

  const archiveHtml = archiveEntries.map(([year, posts]) => {
    const itemsHtml = posts.map(p => `
      <div class="archive-item">
        <a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a>
        <span class="archive-item-date">${escapeHtml(p.date)}</span>
      </div>
    `).join('')
    return `
      <div class="archive-year">
        <div class="archive-year-title">${escapeHtml(year)}/</div>
        ${itemsHtml}
      </div>
    `
  }).join('')

  const tagCloudHtml = data.sortedTags.map(tag => {
    const count = data.tagMap.get(tag)?.length || 0
    return `<a class="tag-cloud-item" data-tag="${escapeHtml(tag)}" href="javascript:void(0)">${escapeHtml(tag)}[${count}]</a>`
  }).join('')

  const tagPostsHtml = tagEntries.map(([tag, posts]) => {
    const itemsHtml = posts.map(p => `
      <div class="tag-post-item">
        <a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a>
        <span class="tag-post-date">${escapeHtml(p.date)}</span>
      </div>
    `).join('')
    return `
      <div class="tag-posts-section" id="tag-posts-${escapeHtml(tag)}">
        <div class="tag-posts-title">// ${escapeHtml(tag)}</div>
        ${itemsHtml}
      </div>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.siteTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
<style>${getTerminalCss(false)}</style>
</head>
<body>
<div class="blog-container">
  <header class="blog-header">
    <div class="blog-header-site">${escapeHtml(data.siteTitle)}</div>
    <nav class="blog-nav">
      <a class="nav-link active" data-view="home" href="javascript:void(0)">ls home</a>
      <a class="nav-link" data-view="archive" href="javascript:void(0)">cat archive</a>
      <a class="nav-link" data-view="tags" href="javascript:void(0)">grep tags</a>
    </nav>
  </header>

  <section class="blog-hero blog-view view-home">
    <h1 class="hero-title">${escapeHtml(data.siteTitle)}<span class="hero-cursor"></span></h1>
    <p class="hero-description">${escapeHtml(data.siteDescription)}</p>
  </section>

  <section class="blog-home blog-view view-home">
    <div class="card-grid">${cardsHtml}</div>
  </section>

  <section class="blog-archive blog-view view-archive">
    <div class="archive-title"></div>
    ${archiveHtml}
  </section>

  <section class="blog-tags blog-view view-tags">
    <div class="tags-title"></div>
    <div class="tag-cloud">${tagCloudHtml}</div>
    ${tagPostsHtml}
  </section>

  <footer class="blog-footer">
    <div class="footer-sys-info">Blog engine v1.0.0 | Uptime: ${new Date().toISOString().split('T')[0]}</div>
    <div class="footer-sys-info">&copy; ${escapeHtml(data.author)} | All rights reserved</div>
  </footer>
</div>
<script>
document.querySelectorAll('.nav-link').forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
    this.classList.add('active');
    var view = this.getAttribute('data-view');
    document.querySelectorAll('.blog-view').forEach(function(v) { v.style.display = 'none'; });
    var el = document.querySelector('.view-' + view);
    if (el) el.style.display = 'block';
  });
});
document.querySelectorAll('.tag-cloud-item').forEach(function(item) {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.tag-posts-section').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
    var tag = this.getAttribute('data-tag');
    var sec = document.getElementById('tag-posts-' + tag);
    if (sec) { sec.classList.add('active'); sec.style.display = 'block'; }
  });
});
</script>
</body>
</html>`
}

function getNewspaperCss(isDark: boolean): string {
  return `
:root {
  --news-cream: #f5f0e1;
  --news-black: #1a1a1a;
  --news-dark-red: #8b0000;
  --news-grey: #666666;
  --news-light-grey: #999999;
  --news-rule: #1a1a1a;
  --news-bg: ${isDark ? '#1a1a1a' : '#f5f0e1'};
  --news-fg: ${isDark ? '#f5f0e1' : '#1a1a1a'};
  --news-card-bg: ${isDark ? '#252525' : '#faf6eb'};
  --news-border: ${isDark ? '#444' : '#1a1a1a'};
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Georgia', serif;
  background: var(--news-bg);
  color: var(--news-fg);
  line-height: 1.7;
  min-height: 100vh;
}

.blog-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px;
}

.blog-header {
  padding: 24px 0;
  border-top: 4px double var(--news-border);
  border-bottom: 4px double var(--news-border);
  text-align: center;
}

.masthead {
  font-family: 'Playfair Display', 'Noto Serif SC', Georgia, serif;
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 6px;
  text-transform: uppercase;
  color: var(--news-fg);
  margin-bottom: 4px;
}

.masthead-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--news-grey);
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 4px 0;
  border-top: 1px solid var(--news-border);
  border-bottom: 1px solid var(--news-border);
  margin-top: 8px;
}

.blog-nav {
  display: flex;
  justify-content: center;
  gap: 28px;
  margin-top: 12px;
}

.nav-link {
  font-family: 'Playfair Display', Georgia, serif;
  color: var(--news-grey);
  text-decoration: none;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: color 0.3s;
}

.nav-link:hover, .nav-link.active {
  color: var(--news-dark-red);
}

.blog-view { display: none; }
.view-home { display: block; }

.blog-hero {
  padding: 48px 0 32px;
  text-align: center;
  border-bottom: 2px solid var(--news-border);
}

.hero-title {
  font-family: 'Playfair Display', 'Noto Serif SC', Georgia, serif;
  font-size: 52px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.hero-description {
  font-size: 16px;
  color: var(--news-grey);
  font-style: italic;
  max-width: 600px;
  margin: 0 auto;
}

.hero-rule {
  border: none;
  border-top: 1px solid var(--news-border);
  margin: 20px auto;
  width: 40%;
}

.hero-rule-thick {
  border: none;
  border-top: 3px solid var(--news-border);
  margin: 4px auto 0;
  width: 20%;
}

.card-grid {
  padding: 32px 0;
  column-count: 2;
  column-gap: 28px;
}

.card {
  background: var(--news-card-bg);
  break-inside: avoid;
  margin-bottom: 28px;
  padding: 24px;
  border-top: 3px solid var(--news-border);
  text-decoration: none;
  color: inherit;
  display: block;
  transition: border-color 0.3s;
}

.card:hover {
  border-top-color: var(--news-dark-red);
}

.card-category {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--news-dark-red);
  margin-bottom: 8px;
}

.card-title {
  font-family: 'Playfair Display', 'Noto Serif SC', Georgia, serif;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 8px;
}

.card-byline {
  font-size: 11px;
  color: var(--news-grey);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.card-excerpt {
  font-size: 14px;
  color: var(--news-grey);
  line-height: 1.6;
}

.card-tags {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--news-dark-red);
  border: 1px solid var(--news-dark-red);
}

.blog-archive {
  padding: 32px 0;
}

.archive-title {
  font-family: 'Playfair Display', 'Noto Serif SC', Georgia, serif;
  font-size: 32px;
  font-weight: 900;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-bottom: 32px;
  padding-bottom: 12px;
  border-bottom: 3px double var(--news-border);
}

.archive-year {
  margin-bottom: 28px;
}

.archive-year-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 24px;
  font-weight: 700;
  border-bottom: 2px solid var(--news-border);
  padding-bottom: 6px;
  margin-bottom: 12px;
}

.archive-item {
  padding: 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1px dotted var(--news-border);
}

.archive-item a {
  color: var(--news-fg);
  text-decoration: none;
  font-size: 15px;
}

.archive-item a:hover {
  color: var(--news-dark-red);
}

.archive-item-date {
  color: var(--news-grey);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.blog-tags {
  padding: 32px 0;
}

.tags-title {
  font-family: 'Playfair Display', 'Noto Serif SC', Georgia, serif;
  font-size: 32px;
  font-weight: 900;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-bottom: 32px;
  padding-bottom: 12px;
  border-bottom: 3px double var(--news-border);
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 32px;
}

.tag-cloud-item {
  padding: 4px 14px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--news-dark-red);
  border: 1px solid var(--news-dark-red);
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}

.tag-cloud-item:hover {
  background: var(--news-dark-red);
  color: var(--news-cream);
}

.tag-posts-section { display: none; }
.tag-posts-section.active { display: block; }

.tag-posts-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--news-border);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.tag-post-item {
  padding: 8px 0;
  border-bottom: 1px dotted var(--news-border);
}

.tag-post-item a {
  color: var(--news-fg);
  text-decoration: none;
  font-size: 15px;
}

.tag-post-item a:hover {
  color: var(--news-dark-red);
}

.tag-post-date {
  color: var(--news-grey);
  font-size: 12px;
  margin-left: 12px;
}

.blog-footer {
  padding: 24px 0;
  border-top: 4px double var(--news-border);
  margin-top: 40px;
  text-align: center;
}

.footer-colophon {
  font-size: 11px;
  color: var(--news-grey);
  text-transform: uppercase;
  letter-spacing: 3px;
  line-height: 1.8;
}

.post-detail {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 24px;
}

.post-title {
  font-family: 'Playfair Display', 'Noto Serif SC', Georgia, serif;
  font-size: 40px;
  font-weight: 900;
  line-height: 1.15;
  text-align: center;
  margin-bottom: 16px;
}

.post-meta {
  text-align: center;
  font-size: 12px;
  color: var(--news-grey);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--news-border);
}

.post-body {
  column-count: 1;
  font-size: 16px;
  line-height: 1.8;
}

.post-body p {
  margin-bottom: 1em;
  text-indent: 2em;
}

.drop-cap::first-letter {
  float: left;
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 4.5em;
  line-height: 0.8;
  padding-right: 8px;
  padding-top: 4px;
  color: var(--news-dark-red);
  font-weight: 900;
}

.post-body h1, .post-body h2, .post-body h3 {
  font-family: 'Playfair Display', 'Noto Serif SC', Georgia, serif;
  margin: 1.5em 0 0.5em;
  text-indent: 0;
}

.post-body h2 {
  font-size: 24px;
  border-bottom: 1px solid var(--news-border);
  padding-bottom: 4px;
}

.post-body pre {
  background: ${isDark ? '#1a1a1a' : '#f0ebe0'};
  padding: 16px;
  overflow-x: auto;
  margin: 1em 0;
  font-size: 13px;
  border-left: 3px solid var(--news-dark-red);
  text-indent: 0;
}

.post-body code {
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.post-body blockquote {
  border-left: 3px solid var(--news-dark-red);
  padding-left: 16px;
  color: var(--news-grey);
  margin: 1em 0;
  font-style: italic;
  text-indent: 0;
}

.post-body img {
  max-width: 100%;
}

.post-body a {
  color: var(--news-dark-red);
  text-decoration: none;
  border-bottom: 1px solid var(--news-dark-red);
}

.post-body hr {
  border: none;
  border-top: 1px solid var(--news-border);
  margin: 2em auto;
  width: 60%;
}

@keyframes newsFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.card {
  animation: newsFadeIn 0.5s ease-out both;
}

@media (max-width: 768px) {
  .blog-container { padding: 0 16px; }
  .masthead { font-size: 28px; letter-spacing: 3px; }
  .hero-title { font-size: 32px; }
  .card-grid { column-count: 1; }
  .blog-nav { gap: 16px; }
}
`
}

function getNewspaperIndexHtml(data: ThemeIndexData): string {
  const archiveEntries = Array.from(data.archiveByYear.entries()).sort((a, b) => Number(b[0]) - Number(a[0]))
  const tagEntries = Array.from(data.tagMap.entries())
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const cardsHtml = data.published.map(post => {
    const tagsHtml = post.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
    return `
      <a class="card" href="${escapeHtml(post.slug)}.html">
        <div class="card-category">${escapeHtml(post.category || 'General')}</div>
        <div class="card-title">${escapeHtml(post.title)}</div>
        <div class="card-byline">By ${escapeHtml(post.author)} &middot; ${escapeHtml(post.date)}</div>
        <div class="card-excerpt">${escapeHtml(post.excerpt || post.description)}</div>
        <div class="card-tags">${tagsHtml}</div>
      </a>
    `
  }).join('')

  const archiveHtml = archiveEntries.map(([year, posts]) => {
    const itemsHtml = posts.map(p => `
      <div class="archive-item">
        <a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a>
        <span class="archive-item-date">${escapeHtml(p.date)}</span>
      </div>
    `).join('')
    return `
      <div class="archive-year">
        <div class="archive-year-title">${escapeHtml(year)}</div>
        ${itemsHtml}
      </div>
    `
  }).join('')

  const tagCloudHtml = data.sortedTags.map(tag => {
    const count = data.tagMap.get(tag)?.length || 0
    return `<a class="tag-cloud-item" data-tag="${escapeHtml(tag)}" href="javascript:void(0)">${escapeHtml(tag)} (${count})</a>`
  }).join('')

  const tagPostsHtml = tagEntries.map(([tag, posts]) => {
    const itemsHtml = posts.map(p => `
      <div class="tag-post-item">
        <a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a>
        <span class="tag-post-date">${escapeHtml(p.date)}</span>
      </div>
    `).join('')
    return `
      <div class="tag-posts-section" id="tag-posts-${escapeHtml(tag)}">
        <div class="tag-posts-title">${escapeHtml(tag)}</div>
        ${itemsHtml}
      </div>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.siteTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
<style>${getNewspaperCss(false)}</style>
</head>
<body>
<div class="blog-container">
  <header class="blog-header">
    <div class="masthead">${escapeHtml(data.siteTitle)}</div>
    <div class="masthead-meta">
      <span>Vol. I &middot; No. 1</span>
      <span>${today}</span>
      <span>${escapeHtml(data.author)}</span>
    </div>
    <nav class="blog-nav">
      <a class="nav-link active" data-view="home" href="javascript:void(0)">Front Page</a>
      <a class="nav-link" data-view="archive" href="javascript:void(0)">Archive</a>
      <a class="nav-link" data-view="tags" href="javascript:void(0)">Index</a>
    </nav>
  </header>

  <section class="blog-hero blog-view view-home">
    <h1 class="hero-title">${escapeHtml(data.siteTitle)}</h1>
    <hr class="hero-rule">
    <hr class="hero-rule-thick">
    <p class="hero-description">${escapeHtml(data.siteDescription)}</p>
  </section>

  <section class="blog-home blog-view view-home">
    <div class="card-grid">${cardsHtml}</div>
  </section>

  <section class="blog-archive blog-view view-archive">
    <div class="archive-title">Archive</div>
    ${archiveHtml}
  </section>

  <section class="blog-tags blog-view view-tags">
    <div class="tags-title">Index</div>
    <div class="tag-cloud">${tagCloudHtml}</div>
    ${tagPostsHtml}
  </section>

  <footer class="blog-footer">
    <div class="footer-colophon">
      ${escapeHtml(data.siteTitle)} &middot; Published by ${escapeHtml(data.author)}<br>
      All rights reserved &middot; Printed with care
    </div>
  </footer>
</div>
<script>
document.querySelectorAll('.nav-link').forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
    this.classList.add('active');
    var view = this.getAttribute('data-view');
    document.querySelectorAll('.blog-view').forEach(function(v) { v.style.display = 'none'; });
    var el = document.querySelector('.view-' + view);
    if (el) el.style.display = 'block';
  });
});
document.querySelectorAll('.tag-cloud-item').forEach(function(item) {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.tag-posts-section').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
    var tag = this.getAttribute('data-tag');
    var sec = document.getElementById('tag-posts-' + tag);
    if (sec) { sec.classList.add('active'); sec.style.display = 'block'; }
  });
});
</script>
</body>
</html>`
}

function getGlassmorphismCss(_isDark: boolean): string {
  return `
:root {
  --glass-purple: #7c3aed;
  --glass-pink: #ec4899;
  --glass-blue: #3b82f6;
  --glass-white: rgba(255,255,255,0.1);
  --glass-border: rgba(255,255,255,0.2);
  --glass-text: #ffffff;
  --glass-text-dim: rgba(255,255,255,0.7);
  --glass-radius: 20px;
  --glass-blur: blur(20px);
  --glass-shadow: 0 8px 32px rgba(0,0,0,0.2);
  --glass-glow: 0 0 20px rgba(124,58,237,0.3);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Inter', 'Poppins', sans-serif;
  color: var(--glass-text);
  line-height: 1.7;
  min-height: 100vh;
  background: linear-gradient(-45deg, #7c3aed, #ec4899, #3b82f6, #7c3aed);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.blog-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px;
}

.blog-header {
  padding: 24px 0;
}

.blog-nav {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.nav-link {
  padding: 8px 20px;
  background: var(--glass-white);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 50px;
  color: var(--glass-text);
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s, box-shadow 0.3s, transform 0.2s;
}

.nav-link:hover, .nav-link.active {
  background: rgba(255,255,255,0.2);
  box-shadow: var(--glass-glow);
  transform: translateY(-1px);
}

.blog-view { display: none; }
.view-home { display: block; }

.blog-hero {
  text-align: center;
  padding: 80px 0 48px;
}

.hero-inner {
  background: var(--glass-white);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--glass-radius);
  padding: 48px 40px;
  box-shadow: var(--glass-shadow);
}

.hero-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #fff, rgba(255,255,255,0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  color: var(--glass-text-dim);
  font-size: 16px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 32px 0;
}

.card {
  background: var(--glass-white);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--glass-radius);
  padding: 28px;
  text-decoration: none;
  color: inherit;
  display: block;
  box-shadow: var(--glass-shadow);
  transition: background 0.3s, box-shadow 0.3s, transform 0.3s;
}

.card:hover {
  background: rgba(255,255,255,0.18);
  box-shadow: 0 8px 40px rgba(0,0,0,0.3), var(--glass-glow);
  transform: translateY(-4px);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.card-date {
  color: var(--glass-text-dim);
  font-size: 13px;
  margin-bottom: 12px;
}

.card-excerpt {
  color: var(--glass-text-dim);
  font-size: 14px;
  line-height: 1.6;
}

.card-tags {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 4px 14px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 50px;
  font-size: 12px;
  color: var(--glass-text);
}

.blog-archive {
  padding: 32px 0;
}

.archive-title {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 32px;
}

.archive-year {
  margin-bottom: 24px;
  background: var(--glass-white);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--glass-radius);
  padding: 24px;
  box-shadow: var(--glass-shadow);
}

.archive-year-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--glass-border);
}

.archive-item {
  padding: 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.archive-item a {
  color: var(--glass-text);
  text-decoration: none;
  transition: text-shadow 0.3s;
}

.archive-item a:hover {
  text-shadow: 0 0 10px rgba(255,255,255,0.5);
}

.archive-item-date {
  color: var(--glass-text-dim);
  font-size: 13px;
}

.blog-tags {
  padding: 32px 0;
}

.tags-title {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 32px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 32px;
}

.tag-cloud-item {
  padding: 8px 20px;
  background: var(--glass-white);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 50px;
  color: var(--glass-text);
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.3s, box-shadow 0.3s, transform 0.2s;
}

.tag-cloud-item:hover {
  background: rgba(255,255,255,0.2);
  box-shadow: var(--glass-glow);
  transform: scale(1.05);
}

.tag-posts-section { display: none; }
.tag-posts-section.active { display: block; }

.tag-posts-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--glass-border);
}

.tag-post-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.tag-post-item a {
  color: var(--glass-text);
  text-decoration: none;
}

.tag-post-item a:hover {
  text-shadow: 0 0 10px rgba(255,255,255,0.5);
}

.tag-post-date {
  color: var(--glass-text-dim);
  font-size: 13px;
  margin-left: 12px;
}

.blog-footer {
  margin-top: 40px;
  padding: 24px;
  background: var(--glass-white);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--glass-radius);
  text-align: center;
  box-shadow: var(--glass-shadow);
  margin-bottom: 40px;
}

.footer-text {
  color: var(--glass-text-dim);
  font-size: 14px;
}

.post-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px;
}

.post-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
}

.post-meta {
  color: var(--glass-text-dim);
  font-size: 14px;
  margin-bottom: 32px;
}

.post-body {
  background: var(--glass-white);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--glass-radius);
  padding: 40px;
  box-shadow: var(--glass-shadow);
}

.post-body h1, .post-body h2, .post-body h3 {
  margin: 1.5em 0 0.5em;
  font-weight: 600;
}

.post-body p {
  margin-bottom: 1em;
  line-height: 1.8;
}

.post-body pre {
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 16px;
  overflow-x: auto;
  margin: 1em 0;
  font-size: 14px;
}

.post-body code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
}

.post-body blockquote {
  border-left: 3px solid var(--glass-border);
  padding-left: 16px;
  color: var(--glass-text-dim);
  margin: 1em 0;
  font-style: italic;
}

.post-body a {
  color: #c4b5fd;
  text-decoration: none;
  border-bottom: 1px solid rgba(196,181,253,0.3);
}

.post-body a:hover {
  border-bottom-color: #c4b5fd;
}

.post-body img {
  max-width: 100%;
  border-radius: 12px;
}

@keyframes glassFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.card {
  animation: glassFadeIn 0.6s ease-out both;
}

.card:nth-child(2) { animation-delay: 0.1s; }
.card:nth-child(3) { animation-delay: 0.2s; }
.card:nth-child(4) { animation-delay: 0.3s; }

@media (max-width: 768px) {
  .blog-container { padding: 0 16px; }
  .hero-title { font-size: 28px; }
  .hero-inner { padding: 32px 20px; }
  .card-grid { grid-template-columns: 1fr; }
  .blog-nav { gap: 8px; flex-wrap: wrap; }
  .nav-link { padding: 6px 14px; font-size: 13px; }
}
`
}

function getGlassmorphismIndexHtml(data: ThemeIndexData): string {
  const archiveEntries = Array.from(data.archiveByYear.entries()).sort((a, b) => Number(b[0]) - Number(a[0]))
  const tagEntries = Array.from(data.tagMap.entries())

  const cardsHtml = data.published.map(post => {
    const tagsHtml = post.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
    return `
      <a class="card" href="${escapeHtml(post.slug)}.html">
        <div class="card-title">${escapeHtml(post.title)}</div>
        <div class="card-date">${escapeHtml(post.date)}</div>
        <div class="card-excerpt">${escapeHtml(post.excerpt || post.description)}</div>
        <div class="card-tags">${tagsHtml}</div>
      </a>
    `
  }).join('')

  const archiveHtml = archiveEntries.map(([year, posts]) => {
    const itemsHtml = posts.map(p => `
      <div class="archive-item">
        <a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a>
        <span class="archive-item-date">${escapeHtml(p.date)}</span>
      </div>
    `).join('')
    return `
      <div class="archive-year">
        <div class="archive-year-title">${escapeHtml(year)}</div>
        ${itemsHtml}
      </div>
    `
  }).join('')

  const tagCloudHtml = data.sortedTags.map(tag => {
    const count = data.tagMap.get(tag)?.length || 0
    return `<a class="tag-cloud-item" data-tag="${escapeHtml(tag)}" href="javascript:void(0)">${escapeHtml(tag)} (${count})</a>`
  }).join('')

  const tagPostsHtml = tagEntries.map(([tag, posts]) => {
    const itemsHtml = posts.map(p => `
      <div class="tag-post-item">
        <a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a>
        <span class="tag-post-date">${escapeHtml(p.date)}</span>
      </div>
    `).join('')
    return `
      <div class="tag-posts-section" id="tag-posts-${escapeHtml(tag)}">
        <div class="tag-posts-title">${escapeHtml(tag)}</div>
        ${itemsHtml}
      </div>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.siteTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${getGlassmorphismCss(false)}</style>
</head>
<body>
<div class="blog-container">
  <header class="blog-header">
    <nav class="blog-nav">
      <a class="nav-link active" data-view="home" href="javascript:void(0)">Home</a>
      <a class="nav-link" data-view="archive" href="javascript:void(0)">Archive</a>
      <a class="nav-link" data-view="tags" href="javascript:void(0)">Tags</a>
    </nav>
  </header>

  <section class="blog-hero blog-view view-home">
    <div class="hero-inner">
      <h1 class="hero-title">${escapeHtml(data.siteTitle)}</h1>
      <p class="hero-description">${escapeHtml(data.siteDescription)}</p>
    </div>
  </section>

  <section class="blog-home blog-view view-home">
    <div class="card-grid">${cardsHtml}</div>
  </section>

  <section class="blog-archive blog-view view-archive">
    <div class="archive-title">Archive</div>
    ${archiveHtml}
  </section>

  <section class="blog-tags blog-view view-tags">
    <div class="tags-title">Tags</div>
    <div class="tag-cloud">${tagCloudHtml}</div>
    ${tagPostsHtml}
  </section>

  <footer class="blog-footer">
    <div class="footer-text">&copy; ${escapeHtml(data.author)} &middot; ${escapeHtml(data.siteTitle)}</div>
  </footer>
</div>
<script>
document.querySelectorAll('.nav-link').forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
    this.classList.add('active');
    var view = this.getAttribute('data-view');
    document.querySelectorAll('.blog-view').forEach(function(v) { v.style.display = 'none'; });
    var el = document.querySelector('.view-' + view);
    if (el) el.style.display = 'block';
  });
});
document.querySelectorAll('.tag-cloud-item').forEach(function(item) {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.tag-posts-section').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
    var tag = this.getAttribute('data-tag');
    var sec = document.getElementById('tag-posts-' + tag);
    if (sec) { sec.classList.add('active'); sec.style.display = 'block'; }
  });
});
</script>
</body>
</html>`
}

function getBentoCss(isDark: boolean): string {
  return `
:root {
  --bento-beige: #fef3c7;
  --bento-orange: #f97316;
  --bento-coral: #ef4444;
  --bento-cream: #fffbeb;
  --bento-dark: #1c1917;
  --bento-card-1: #fff7ed;
  --bento-card-2: #fef3c7;
  --bento-card-3: #fed7aa;
  --bento-card-4: #fecaca;
  --bento-card-5: #fde68a;
  --bento-radius: 22px;
  --bento-shadow: 0 4px 16px rgba(28,25,23,0.08);
  --bento-shadow-hover: 0 8px 30px rgba(28,25,23,0.14);
  --bg: ${isDark ? '#1c1917' : '#fffbeb'};
  --fg: ${isDark ? '#fef3c7' : '#1c1917'};
  --muted: ${isDark ? '#a8a29e' : '#78716c'};
  --card-bg: ${isDark ? '#292524' : '#ffffff'};
  --border: ${isDark ? '#44403c' : '#e7e5e4'};
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Inter', 'Nunito', sans-serif;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.7;
  min-height: 100vh;
}

.blog-container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 24px;
}

.blog-header {
  padding: 32px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.blog-header-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--bento-orange);
}

.blog-nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 8px 18px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 50px;
  color: var(--muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-link:hover, .nav-link.active {
  background: var(--bento-orange);
  color: #fff;
  border-color: var(--bento-orange);
}

.blog-view { display: none; }
.view-home { display: block; }

.blog-hero {
  padding: 24px 0;
}

.hero-inner {
  background: linear-gradient(135deg, var(--bento-orange), var(--bento-coral));
  border-radius: var(--bento-radius);
  padding: 48px 40px;
  color: #fff;
  box-shadow: var(--bento-shadow);
}

.hero-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
}

.hero-description {
  font-size: 16px;
  opacity: 0.9;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 24px 0;
}

.card {
  background: var(--card-bg);
  border-radius: var(--bento-radius);
  padding: 28px;
  text-decoration: none;
  color: inherit;
  display: block;
  box-shadow: var(--bento-shadow);
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid var(--border);
  position: relative;
  overflow: hidden;
}

.card:hover {
  transform: scale(1.02);
  box-shadow: var(--bento-shadow-hover);
}

.card-featured {
  grid-column: span 2;
  background: linear-gradient(135deg, var(--bento-card-1), var(--bento-card-2));
  border: none;
}

.card-featured .card-title {
  font-size: 24px;
}

.card-accent-1 { border-top: 4px solid var(--bento-orange); }
.card-accent-2 { border-top: 4px solid var(--bento-coral); }
.card-accent-3 { border-top: 4px solid #f59e0b; }
.card-accent-4 { border-top: 4px solid #8b5cf6; }

.card-number {
  position: absolute;
  top: 16px;
  right: 20px;
  font-size: 48px;
  font-weight: 800;
  opacity: 0.06;
  line-height: 1;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
}

.card-date {
  color: var(--muted);
  font-size: 13px;
  margin-bottom: 10px;
}

.card-excerpt {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.card-tags {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 4px 14px;
  background: rgba(249,115,22,0.1);
  color: var(--bento-orange);
  border-radius: 50px;
  font-size: 12px;
  font-weight: 500;
}

.blog-archive {
  padding: 32px 0;
}

.archive-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
}

.archive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.archive-year {
  background: var(--card-bg);
  border-radius: var(--bento-radius);
  padding: 24px;
  box-shadow: var(--bento-shadow);
  border: 1px solid var(--border);
}

.archive-year-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--bento-orange);
  margin-bottom: 16px;
}

.archive-item {
  padding: 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
}

.archive-item:last-child {
  border-bottom: none;
}

.archive-item a {
  color: var(--fg);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.archive-item a:hover {
  color: var(--bento-orange);
}

.archive-item-date {
  color: var(--muted);
  font-size: 12px;
}

.blog-tags {
  padding: 32px 0;
}

.tags-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 32px;
}

.tag-cloud-item {
  padding: 8px 20px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 50px;
  color: var(--fg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s;
}

.tag-cloud-item:hover {
  background: var(--bento-orange);
  color: #fff;
  border-color: var(--bento-orange);
  transform: scale(1.05);
}

.tag-posts-section { display: none; }
.tag-posts-section.active { display: block; }

.tag-posts-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--bento-orange);
  margin-bottom: 16px;
}

.tag-post-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.tag-post-item a {
  color: var(--fg);
  text-decoration: none;
  font-size: 15px;
}

.tag-post-item a:hover {
  color: var(--bento-orange);
}

.tag-post-date {
  color: var(--muted);
  font-size: 13px;
  margin-left: 12px;
}

.blog-footer {
  text-align: center;
  padding: 32px 0;
  margin-top: 40px;
  font-size: 14px;
  color: var(--muted);
}

.blog-footer-inner {
  background: var(--card-bg);
  border-radius: var(--bento-radius);
  padding: 24px;
  box-shadow: var(--bento-shadow);
  border: 1px solid var(--border);
}

.post-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 24px;
}

.post-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
}

.post-meta {
  color: var(--muted);
  font-size: 14px;
  margin-bottom: 32px;
}

.post-body {
  background: var(--card-bg);
  border-radius: var(--bento-radius);
  padding: 40px;
  box-shadow: var(--bento-shadow);
  border: 1px solid var(--border);
  font-size: 16px;
  line-height: 1.8;
}

.post-body h1, .post-body h2, .post-body h3 {
  margin: 1.5em 0 0.5em;
  font-weight: 600;
}

.post-body p {
  margin-bottom: 1em;
}

.post-body pre {
  background: ${isDark ? '#1c1917' : '#fef3c7'};
  border-radius: 16px;
  padding: 16px;
  overflow-x: auto;
  margin: 1em 0;
  font-size: 14px;
}

.post-body code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
}

.post-body blockquote {
  border-left: 4px solid var(--bento-orange);
  padding-left: 16px;
  color: var(--muted);
  margin: 1em 0;
  border-radius: 0 12px 12px 0;
  background: rgba(249,115,22,0.05);
  padding: 12px 16px;
}

.post-body a {
  color: var(--bento-orange);
  text-decoration: none;
}

.post-body a:hover {
  text-decoration: underline;
}

.post-body img {
  max-width: 100%;
  border-radius: 16px;
}

@keyframes bentoFadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.card {
  animation: bentoFadeIn 0.5s ease-out both;
}

.card:nth-child(2) { animation-delay: 0.08s; }
.card:nth-child(3) { animation-delay: 0.16s; }
.card:nth-child(4) { animation-delay: 0.24s; }
.card:nth-child(5) { animation-delay: 0.32s; }

@media (max-width: 768px) {
  .blog-container { padding: 0 16px; }
  .blog-header { flex-direction: column; gap: 16px; }
  .hero-title { font-size: 26px; }
  .hero-inner { padding: 32px 24px; }
  .card-grid { grid-template-columns: 1fr; }
  .card-featured { grid-column: span 1; }
  .archive-grid { grid-template-columns: 1fr; }
}
`
}

function getBentoIndexHtml(data: ThemeIndexData): string {
  const archiveEntries = Array.from(data.archiveByYear.entries()).sort((a, b) => Number(b[0]) - Number(a[0]))
  const tagEntries = Array.from(data.tagMap.entries())
  const accentClasses = ['card-accent-1', 'card-accent-2', 'card-accent-3', 'card-accent-4']

  const cardsHtml = data.published.map((post, i) => {
    const tagsHtml = post.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
    const isFeatured = i === 0
    const accentClass = isFeatured ? 'card-featured' : accentClasses[i % accentClasses.length]
    return `
      <a class="card ${accentClass}" href="${escapeHtml(post.slug)}.html">
        <div class="card-number">${String(i + 1).padStart(2, '0')}</div>
        <div class="card-title">${escapeHtml(post.title)}</div>
        <div class="card-date">${escapeHtml(post.date)}</div>
        <div class="card-excerpt">${escapeHtml(post.excerpt || post.description)}</div>
        <div class="card-tags">${tagsHtml}</div>
      </a>
    `
  }).join('')

  const archiveHtml = archiveEntries.map(([year, posts]) => {
    const itemsHtml = posts.map(p => `
      <div class="archive-item">
        <a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a>
        <span class="archive-item-date">${escapeHtml(p.date)}</span>
      </div>
    `).join('')
    return `
      <div class="archive-year">
        <div class="archive-year-title">${escapeHtml(year)}</div>
        ${itemsHtml}
      </div>
    `
  }).join('')

  const tagCloudHtml = data.sortedTags.map(tag => {
    const count = data.tagMap.get(tag)?.length || 0
    return `<a class="tag-cloud-item" data-tag="${escapeHtml(tag)}" href="javascript:void(0)">${escapeHtml(tag)} (${count})</a>`
  }).join('')

  const tagPostsHtml = tagEntries.map(([tag, posts]) => {
    const itemsHtml = posts.map(p => `
      <div class="tag-post-item">
        <a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a>
        <span class="tag-post-date">${escapeHtml(p.date)}</span>
      </div>
    `).join('')
    return `
      <div class="tag-posts-section" id="tag-posts-${escapeHtml(tag)}">
        <div class="tag-posts-title">${escapeHtml(tag)}</div>
        ${itemsHtml}
      </div>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.siteTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${getBentoCss(false)}</style>
</head>
<body>
<div class="blog-container">
  <header class="blog-header">
    <div class="blog-header-title">${escapeHtml(data.siteTitle)}</div>
    <nav class="blog-nav">
      <a class="nav-link active" data-view="home" href="javascript:void(0)">Home</a>
      <a class="nav-link" data-view="archive" href="javascript:void(0)">Archive</a>
      <a class="nav-link" data-view="tags" href="javascript:void(0)">Tags</a>
    </nav>
  </header>

  <section class="blog-hero blog-view view-home">
    <div class="hero-inner">
      <h1 class="hero-title">${escapeHtml(data.siteTitle)}</h1>
      <p class="hero-description">${escapeHtml(data.siteDescription)}</p>
    </div>
  </section>

  <section class="blog-home blog-view view-home">
    <div class="card-grid">${cardsHtml}</div>
  </section>

  <section class="blog-archive blog-view view-archive">
    <div class="archive-title">Archive</div>
    <div class="archive-grid">${archiveHtml}</div>
  </section>

  <section class="blog-tags blog-view view-tags">
    <div class="tags-title">Tags</div>
    <div class="tag-cloud">${tagCloudHtml}</div>
    ${tagPostsHtml}
  </section>

  <footer class="blog-footer">
    <div class="blog-footer-inner">
      &copy; ${escapeHtml(data.author)} &middot; ${escapeHtml(data.siteTitle)}
    </div>
  </footer>
</div>
<script>
document.querySelectorAll('.nav-link').forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
    this.classList.add('active');
    var view = this.getAttribute('data-view');
    document.querySelectorAll('.blog-view').forEach(function(v) { v.style.display = 'none'; });
    var el = document.querySelector('.view-' + view);
    if (el) el.style.display = 'block';
  });
});
document.querySelectorAll('.tag-cloud-item').forEach(function(item) {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.tag-posts-section').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
    var tag = this.getAttribute('data-tag');
    var sec = document.getElementById('tag-posts-' + tag);
    if (sec) { sec.classList.add('active'); sec.style.display = 'block'; }
  });
});
</script>
</body>
</html>`
}

function getNarrativeCss(isDark: boolean): string {
  return `
:root {
  --narr-parchment: #faf5eb;
  --narr-brown: #3c2415;
  --narr-gold: #b8860b;
  --narr-cream: #f5ead6;
  --narr-light-gold: #d4a853;
  --narr-muted: #8b7355;
  --narr-border: #d4c5a9;
  --bg: ${isDark ? '#2c1e10' : '#faf5eb'};
  --fg: ${isDark ? '#f5ead6' : '#3c2415'};
  --muted: ${isDark ? '#a89070' : '#8b7355'};
  --card-bg: ${isDark ? '#3a2a1a' : '#ffffff'};
  --border: ${isDark ? '#5a4a3a' : '#d4c5a9'};
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Lora', 'Noto Serif SC', Georgia, serif;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.8;
  min-height: 100vh;
}

.blog-container {
  max-width: 900px;
  margin: 0 auto;
}

.blog-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(250,245,235,0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
}

${isDark ? '.blog-header { background: rgba(44,30,16,0.95); }' : ''}

.blog-header-title {
  font-family: 'Lora', Georgia, serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--narr-gold);
}

.blog-nav {
  display: flex;
  gap: 24px;
}

.nav-link {
  color: var(--muted);
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.3s;
  font-family: 'Lora', Georgia, serif;
}

.nav-link:hover, .nav-link.active {
  color: var(--narr-gold);
}

.blog-view { display: none; }
.view-home { display: block; }

.blog-hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  background: linear-gradient(180deg, rgba(184,134,11,0.08) 0%, rgba(250,245,235,0) 100%);
  padding: 80px 24px 40px;
}

.hero-inner {
  position: relative;
}

.hero-ornament-top, .hero-ornament-bottom {
  color: var(--narr-gold);
  font-size: 28px;
  opacity: 0.5;
  line-height: 1;
}

.hero-ornament-top { margin-bottom: 24px; }

.hero-title {
  font-family: 'Lora', 'Noto Serif SC', Georgia, serif;
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 16px;
  color: var(--fg);
}

.hero-description {
  font-size: 18px;
  color: var(--muted);
  font-style: italic;
  max-width: 500px;
  margin: 0 auto;
}

.hero-ornament-bottom { margin-top: 24px; }

.hero-scroll-hint {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  color: var(--narr-gold);
  font-size: 13px;
  opacity: 0.6;
  animation: gentleBounce 2s ease-in-out infinite;
  white-space: nowrap;
}

@keyframes gentleBounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(8px); }
}

.card-grid {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 20px 24px 60px;
}

.card {
  background: var(--card-bg);
  border-radius: 4px;
  padding: 32px 36px;
  text-decoration: none;
  color: inherit;
  display: block;
  box-shadow: 0 2px 16px rgba(60,36,21,0.06);
  transition: box-shadow 0.3s, transform 0.3s;
  position: relative;
  border: 1px solid var(--border);
  overflow: hidden;
}

.card:hover {
  box-shadow: 0 6px 28px rgba(60,36,21,0.12);
  transform: translateY(-3px);
}

.card-chapter {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--narr-gold);
  margin-bottom: 10px;
}

.card-title {
  font-family: 'Lora', 'Noto Serif SC', Georgia, serif;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1.4;
}

.card-date {
  color: var(--muted);
  font-size: 13px;
  font-style: italic;
  margin-bottom: 12px;
}

.card-excerpt {
  color: var(--muted);
  font-size: 15px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-ornament {
  text-align: center;
  color: var(--narr-gold);
  opacity: 0.4;
  margin-top: 14px;
  font-size: 18px;
}

.card-tags {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 3px 14px;
  background: rgba(184,134,11,0.1);
  color: var(--narr-gold);
  border: 1px solid rgba(184,134,11,0.25);
  border-radius: 2px;
  font-size: 12px;
  font-family: 'Lora', Georgia, serif;
  letter-spacing: 0.5px;
}

.blog-archive {
  padding: 100px 24px 60px;
}

.archive-title {
  font-family: 'Lora', Georgia, serif;
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 48px;
  color: var(--narr-gold);
}

.archive-timeline {
  position: relative;
  padding-left: 40px;
}

.archive-timeline::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--border);
}

.archive-year {
  margin-bottom: 36px;
  position: relative;
}

.archive-year-title {
  font-family: 'Lora', Georgia, serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--narr-gold);
  margin-bottom: 16px;
}

.archive-year-title::before {
  content: '';
  position: absolute;
  left: -33px;
  top: 6px;
  width: 12px;
  height: 12px;
  background: var(--narr-gold);
  border-radius: 50%;
  border: 3px solid var(--bg);
}

.archive-item {
  padding: 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
}

.archive-item a {
  color: var(--fg);
  text-decoration: none;
  transition: color 0.3s;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archive-item a:hover {
  color: var(--narr-gold);
}

.archive-item-date {
  color: var(--muted);
  font-size: 13px;
  font-style: italic;
  flex-shrink: 0;
}

.blog-tags {
  padding: 100px 24px 60px;
}

.tags-title {
  font-family: 'Lora', Georgia, serif;
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 48px;
  color: var(--narr-gold);
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 40px;
}

.tag-cloud-item {
  padding: 6px 18px;
  background: rgba(184,134,11,0.08);
  border: 1px solid rgba(184,134,11,0.25);
  color: var(--narr-gold);
  font-size: 14px;
  font-family: 'Lora', Georgia, serif;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s;
  border-radius: 2px;
}

.tag-cloud-item:hover {
  background: var(--narr-gold);
  color: var(--narr-parchment);
}

.tag-posts-section { display: none; }
.tag-posts-section.active { display: block; }

.tag-posts-title {
  font-family: 'Lora', Georgia, serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--narr-gold);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.tag-post-item {
  padding: 8px 0;
  border-bottom: 1px dashed var(--border);
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.tag-post-item a {
  color: var(--fg);
  text-decoration: none;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-post-item a:hover {
  color: var(--narr-gold);
}

.tag-post-date {
  color: var(--muted);
  font-size: 13px;
  font-style: italic;
  flex-shrink: 0;
}

.blog-footer {
  text-align: center;
  padding: 60px 24px;
  margin-top: 40px;
  position: relative;
}

.footer-ornament {
  color: var(--narr-gold);
  font-size: 24px;
  opacity: 0.5;
  margin-bottom: 16px;
}

.footer-end-mark {
  font-family: 'Lora', Georgia, serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--narr-gold);
  letter-spacing: 6px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.footer-text {
  color: var(--muted);
  font-size: 13px;
  font-style: italic;
}

.post-detail {
  max-width: 760px;
  margin: 0 auto;
  padding: 90px 24px 60px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--narr-gold);
  text-decoration: none;
  font-size: 14px;
  font-style: italic;
  margin-bottom: 32px;
  transition: opacity 0.3s;
}

.back-link:hover {
  opacity: 0.7;
}

.post-title {
  font-family: 'Lora', 'Noto Serif SC', Georgia, serif;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.25;
  text-align: center;
  margin-bottom: 16px;
}

.post-meta {
  text-align: center;
  color: var(--muted);
  font-size: 14px;
  font-style: italic;
  margin-bottom: 32px;
}

.post-divider {
  text-align: center;
  color: var(--narr-gold);
  opacity: 0.4;
  font-size: 20px;
  margin-bottom: 32px;
}

.post-body {
  font-size: 16px;
  line-height: 1.9;
  max-width: 680px;
  margin: 0 auto;
}

.post-body p {
  margin-bottom: 1.2em;
  text-indent: 2em;
}

.drop-cap::first-letter {
  float: left;
  font-size: 3.2em;
  line-height: 0.85;
  padding-right: 10px;
  color: var(--narr-gold);
  font-family: 'Lora', Georgia, serif;
  font-weight: 700;
}

.post-body h1, .post-body h2, .post-body h3 {
  font-family: 'Lora', 'Noto Serif SC', Georgia, serif;
  margin: 1.8em 0 0.8em;
  text-indent: 0;
  color: var(--fg);
}

.post-body h2 {
  font-size: 22px;
  text-align: center;
}

.post-body h2::before, .post-body h2::after {
  content: ' \u2022 ';
  color: var(--narr-gold);
}

.post-body h3 {
  font-size: 18px;
}

.post-body ul, .post-body ol {
  margin-bottom: 1.2em;
  padding-left: 1.8em;
  text-indent: 0;
}

.post-body li {
  margin-bottom: 0.4em;
}

.post-body pre {
  background: ${isDark ? '#1c1917' : '#f5ead6'};
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
  font-size: 14px;
  text-indent: 0;
  border: 1px solid var(--border);
}

.post-body code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
}

.post-body :not(pre) > code {
  background: rgba(184,134,11,0.08);
  padding: 2px 8px;
  border-radius: 3px;
  color: var(--narr-gold);
  font-size: 0.85em;
}

.post-body blockquote {
  border-left: 3px solid var(--narr-gold);
  padding: 16px 24px;
  color: var(--muted);
  margin: 1.2em 0;
  font-style: italic;
  text-indent: 0;
  background: rgba(184,134,11,0.04);
  position: relative;
}

.post-body blockquote::before {
  content: '\\201C';
  position: absolute;
  top: -8px;
  left: 12px;
  font-size: 48px;
  color: var(--narr-gold);
  opacity: 0.2;
  line-height: 1;
  font-family: 'Lora', Georgia, serif;
}

.post-body a {
  color: var(--narr-gold);
  text-decoration: none;
  border-bottom: 1px solid rgba(184,134,11,0.3);
}

.post-body a:hover {
  border-bottom-color: var(--narr-gold);
}

.post-body img {
  max-width: 100%;
  border-radius: 4px;
  margin: 1.5em 0;
}

.post-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.2em 0;
  border: 1px solid var(--border);
  font-size: 14px;
  text-indent: 0;
}

.post-body th {
  background: rgba(184,134,11,0.06);
  font-weight: 600;
}

.post-body th, .post-body td {
  border: 1px solid var(--border);
  padding: 8px 14px;
  text-align: left;
}

.post-body hr {
  border: none;
  text-align: center;
  margin: 2em 0;
  color: var(--narr-gold);
  opacity: 0.4;
  font-size: 18px;
  line-height: 1;
  height: auto;
}

.post-tags-section {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

@keyframes narrativeFadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.card {
  animation: narrativeFadeIn 0.7s ease-out both;
}

.card:nth-child(2) { animation-delay: 0.15s; }
.card:nth-child(3) { animation-delay: 0.3s; }
.card:nth-child(4) { animation-delay: 0.45s; }

@media (max-width: 768px) {
  .blog-container { padding: 0; }
  .blog-header { padding: 10px 16px; }
  .hero-title { font-size: 28px; }
  .hero-description { font-size: 15px; }
  .card { padding: 20px; margin: 0 16px; }
  .card-grid { padding: 20px 0 40px; }
  .blog-nav { gap: 16px; }
  .post-detail { padding-top: 80px; }
  .post-title { font-size: 24px; }
  .post-body { max-width: 100%; }
  .blog-archive, .blog-tags { padding-top: 80px; }
  .archive-item { flex-direction: column; gap: 2px; }
  .tag-post-item { flex-direction: column; gap: 2px; }
}
`
}

function getNarrativeIndexHtml(data: ThemeIndexData): string {
  const archiveEntries = Array.from(data.archiveByYear.entries()).sort((a, b) => Number(b[0]) - Number(a[0]))
  const tagEntries = Array.from(data.tagMap.entries())

  const cardsHtml = data.published.map((post, i) => {
    const tagsHtml = post.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
    const chapterNum = i + 1
    return `
      <a class="card" href="${escapeHtml(post.slug)}.html">
        <div class="card-chapter">Chapter ${chapterNum}</div>
        <div class="card-title">${escapeHtml(post.title)}</div>
        <div class="card-date">${escapeHtml(post.date)}</div>
        <div class="card-excerpt">${escapeHtml(post.excerpt || post.description)}</div>
        <div class="card-tags">${tagsHtml}</div>
        <div class="card-ornament">\u2756</div>
      </a>
    `
  }).join('')

  const archiveHtml = archiveEntries.map(([year, posts]) => {
    const itemsHtml = posts.map(p => `
      <div class="archive-item">
        <a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a>
        <span class="archive-item-date">${escapeHtml(p.date)}</span>
      </div>
    `).join('')
    return `
      <div class="archive-year">
        <div class="archive-year-title">${escapeHtml(year)}</div>
        ${itemsHtml}
      </div>
    `
  }).join('')

  const tagCloudHtml = data.sortedTags.map(tag => {
    const count = data.tagMap.get(tag)?.length || 0
    return `<a class="tag-cloud-item" data-tag="${escapeHtml(tag)}" href="javascript:void(0)">${escapeHtml(tag)} (${count})</a>`
  }).join('')

  const tagPostsHtml = tagEntries.map(([tag, posts]) => {
    const itemsHtml = posts.map(p => `
      <div class="tag-post-item">
        <a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a>
        <span class="tag-post-date">${escapeHtml(p.date)}</span>
      </div>
    `).join('')
    return `
      <div class="tag-posts-section" id="tag-posts-${escapeHtml(tag)}">
        <div class="tag-posts-title">${escapeHtml(tag)}</div>
        ${itemsHtml}
      </div>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.siteTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
<style>${getNarrativeCss(false)}</style>
</head>
<body>
<div class="blog-container">
  <header class="blog-header">
    <div class="blog-header-title">${escapeHtml(data.siteTitle)}</div>
    <nav class="blog-nav">
      <a class="nav-link active" data-view="home" href="javascript:void(0)">Home</a>
      <a class="nav-link" data-view="archive" href="javascript:void(0)">Archive</a>
      <a class="nav-link" data-view="tags" href="javascript:void(0)">Tags</a>
    </nav>
  </header>

  <section class="blog-hero blog-view view-home">
    <div class="hero-inner">
      <div class="hero-ornament-top">\u2756</div>
      <h1 class="hero-title">${escapeHtml(data.siteTitle)}</h1>
      <p class="hero-description">${escapeHtml(data.siteDescription)}</p>
      <div class="hero-ornament-bottom">\u2756</div>
    </div>
    <div class="hero-scroll-hint">Scroll to begin the story</div>
  </section>

  <section class="blog-home blog-view view-home">
    <div class="card-grid">${cardsHtml}</div>
  </section>

  <section class="blog-archive blog-view view-archive">
    <div class="archive-title">Chronicle</div>
    <div class="archive-timeline">${archiveHtml}</div>
  </section>

  <section class="blog-tags blog-view view-tags">
    <div class="tags-title">Topics</div>
    <div class="tag-cloud">${tagCloudHtml}</div>
    ${tagPostsHtml}
  </section>

  <footer class="blog-footer">
    <div class="footer-ornament">\u2756</div>
    <div class="footer-the-end">The End</div>
    <div class="footer-text">&copy; ${escapeHtml(data.author)} &middot; ${escapeHtml(data.siteTitle)}</div>
  </footer>
</div>
<script>
document.querySelectorAll('.nav-link').forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
    this.classList.add('active');
    var view = this.getAttribute('data-view');
    document.querySelectorAll('.blog-view').forEach(function(v) { v.style.display = 'none'; });
    var el = document.querySelector('.view-' + view);
    if (el) el.style.display = 'block';
  });
});
document.querySelectorAll('.tag-cloud-item').forEach(function(item) {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.tag-posts-section').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
    var tag = this.getAttribute('data-tag');
    var sec = document.getElementById('tag-posts-' + tag);
    if (sec) { sec.classList.add('active'); sec.style.display = 'block'; }
  });
});
</script>
</body>
</html>`
}
