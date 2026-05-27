# AGENTS.md — Markdown Editor 项目分析

> 这份文件是我对项目架构、设计模式、数据流、耦合关系的全面分析。
> 我是 [Codex](https://Codex.ai)，一个 AI 助手。项目里的大意/矛盾之处代表了编码者的本意和认知偏误，
> 矛盾的地方一起指出，供你参考与决策。这份文档不是规范，是观察。

## ⚠️ 接手前必读

**本项目的核心目标不是继续在这个仓库上开发，而是将 Markdown 编辑模块抽取为独立可复用组件，集成到两个目标项目：**

1. **静态博客** — 用 `<MarkdownEditor>` 组件做博文编辑
2. **Inbox**（AI 工作流 Markdown 工具）— 渐进替换现有编辑器的部分模块，不推倒重来

**详细计划请先阅读：`AI-接手指南-模块抽取计划.md`**

当前阶段：**Phase 1 — 内部解耦**
- P0：App.tsx 渲染管道拆 Hook → P1：Editor.tsx 逻辑抽 Hook → P2：死代码清理 + 接口化

---

## 一、项目目录结构分析

### 1.1 当前结构总览

```
MarkdownEditor/
├── .gitignore
├── index.html                # Vite 入口 HTML
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.node.json
├── tailwind.config.js / postcss.config.js
├── vitest.config.ts
├── server.ps1                # Windows 专用，Mac 下无用
│
└── src/
    ├── main.tsx              # ReactDOM.createRoot，挂载 ThemeProvider
    ├── App.tsx               # ★ 760 行上帝组件：布局编排、渲染管道、所有状态
    ├── index.css             # ★ 全局 CSS 变量（深色/浅色主题色板）
    ├── vite-env.d.ts
    ├── setupTests.ts
    │
    ├── types/
    │   └── fileManager.ts    # 3 个接口：FileNode, Tab, FileManagerState
    │
    ├── components/           # 跨模块复用的 UI 组件（8 个）
    │   ├── TabBar.tsx
    │   ├── SearchReplace.tsx
    │   ├── InlineMathPreview.tsx
    │   ├── MathSymbolsPopover.tsx
    │   ├── FootnoteSidebar.tsx
    │   ├── OptimizeImagesModal.tsx
    │   ├── RichEditor.tsx       # 已弃用但文件仍保留
    │   └── WelcomePage.tsx
    │
    └── modules/              # 功能模块（10 个子模块）
        ├── editor/           # 编辑器核心（11 个文件）
        ├── preview/          # 预览渲染（3 个文件）
        ├── fileManager/      # 文件管理（6 个文件）
        ├── toolbar/          # 工具栏（5 个文件）
        ├── outline/          # 大纲导航（3 个文件）
        ├── lint/             # 语法检查（2 个文件）
        ├── export/           # 导出（2 个文件）
        ├── blog/             # 博客生成（7 个文件）
        ├── settings/         # 主题设置（1 个文件）
        └── shared/           # 共享工具（7 个文件）
```

### 1.2 结构问题诊断

#### 问题 1：`components/` 与 `modules/` 的边界模糊

`components/` 号称是"跨模块复用组件"，但：
- `SearchReplace.tsx` 实际只在 `Editor.tsx` 中使用，应归入 `modules/editor/`
- `InlineMathPreview.tsx` 只被 `Editor.tsx` 使用，应归入 `modules/editor/`
- `MathSymbolsPopover.tsx` 只被 `MathPopover.tsx`（在 toolbar 里）使用
- `OptimizeImagesModal.tsx` 只被 `Editor.tsx` 使用
- `RichEditor.tsx` 已弃用但文件保留，造成干扰
- `RichEditor.tsx` 名字有误导性——并非真正的富文本编辑器，而是 Canvas 预览方案

#### 问题 2：`modules/blog/` 是一个独立应用

博客模块有 7 个文件，拥有独立的配置系统、样式系统、模板系统和生成引擎。
它本质上是一个"博客工作室"独立应用，可以（但不必）独立出包。

#### 问题 3：缺少统一的导出入口

`modules/` 下每个子模块的公共接口没有统一导出。import 路径都是直接指向具体文件：
```typescript
import { findNode } from './fileManagerUtils'
import { lintMarkdown } from '../lint/markdownLinter'
```
缺乏类似 `modules/editor/index.ts` 这样的 barrel export，导致跨模块引用路径冗长。

#### 问题 4：`shared/` 概念过泛

`shared/` 放了 7 个文件，职责差异大：
- `ScrollButtons.tsx`、`InputModal.tsx` 是纯 UI 组件
- `ModalContext.tsx` 是全局状态
- `QuickOpen.tsx`、`GlobalSearch.tsx` 是独立功能
- `imageHelpers.ts`、`imageStore.ts` 是图片相关的工具/存储

#### 建议重构结构

```
src/
├── main.tsx
├── App.tsx
├── index.css
├── types/
│   └── fileManager.ts
│
├── features/                # 按功能域组织
│   ├── editor/
│   │   ├── Editor.tsx
│   │   ├── EditorOverlay.tsx
│   │   ├── LineNumbers.tsx
│   │   ├── editorHelpers.ts
│   │   ├── markdownAutocomplete.ts
│   │   ├── markdownShortcuts.ts
│   │   ├── scrollSync.ts
│   │   ├── stats.ts
│   │   ├── footnote.ts
│   │   ├── UndoRedoManager.ts
│   │   ├── UndoRedoContext.tsx
│   │   ├── SearchReplace.tsx        # 从 components/ 移入
│   │   └── InlineMathPreview.tsx    # 从 components/ 移入
│   │
│   ├── preview/
│   │   ├── Preview.tsx
│   │   ├── mathRenderer.ts
│   │   └── mathUtils.ts
│   │
│   ├── file-manager/
│   │   ├── FileManagerContext.tsx
│   │   ├── fileManagerUtils.ts
│   │   ├── Sidebar.tsx
│   │   ├── FileTreeNode.tsx
│   │   ├── CreateFileModal.tsx
│   │   ├── FolderSelector.tsx
│   │   ├── QuickOpen.tsx            # 从 shared/ 移入
│   │   └── GlobalSearch.tsx         # 从 shared/ 移入
│   │
│   ├── toolbar/
│   │   ├── MarkdownToolbar.tsx
│   │   ├── MathPopover.tsx
│   │   ├── MathSymbolsPopover.tsx   # 从 components/ 移入
│   │   ├── TableToolbar.tsx
│   │   ├── TableEditor.tsx
│   │   └── ListMenuPopover.tsx
│   │
│   ├── outline/
│   │   ├── Outline.tsx
│   │   ├── outlineUtils.ts
│   │   └── __tests__/
│   │
│   ├── lint/
│   │   ├── LintPopover.tsx
│   │   └── markdownLinter.ts
│   │
│   ├── export/
│   │   ├── SaveAsModal.tsx
│   │   └── exportUtils.ts
│   │
│   ├── blog/                        # 可考虑独立出包
│   │   ├── BlogStudio.tsx
│   │   ├── BlogModal.tsx
│   │   ├── FrontMatterPanel.tsx
│   │   ├── blogGenerator.ts
│   │   ├── blogTemplates.ts
│   │   ├── blogThemeStyles.ts
│   │   └── frontMatter.ts
│   │
│   └── settings/
│       └── ThemeContext.tsx
│
├── shared/                  # 只保留真正跨功能的
│   ├── image/
│   │   ├── imageStore.ts
│   │   └── imageHelpers.ts
│   └── ui/
│       ├── ModalContext.tsx
│       ├── InputModal.tsx
│       ├── ScrollButtons.tsx
│       ├── TabBar.tsx
│       ├── FootnoteSidebar.tsx
│       └── WelcomePage.tsx
│
└── deprecated/
    ├── RichEditor.tsx
    └── EditorOverlay.tsx
```

---

## 二、耦合性分析

### 2.1 模块间依赖关系

```
                  ┌─────────────────────────────────────────────┐
                  │               App.tsx (760 lines)            │
                  │  布局编排 · 渲染管道 · 快捷键 · 滚动同步      │
                  │  focus/typewriter 模式 · Mermaid 渲染        │
                  └──────┬──────────┬──────────┬────────────────┘
                         │          │          │
          ┌──────────────┼──────────┤          ├──────────────┐
          ▼              ▼          ▼          ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Editor   │  │ Preview  │  │ Outline  │  │ FileMgr  │
    │ (300+    │  │          │  │          │  │ Context  │
    │  lines)  │  │          │  │          │  │ (200+    │
    └──┬───┬───┘  └──────────┘  └──────────┘  │ lines)   │
       │   │         ▲              ▲          └──┬───┬───┘
       │   │         │              │             │   │
       ▼   ▼         │              │             ▼   ▼
    ┌──────────────────────────────────────────────┐
    │  10+ 横切进口：lint footnotes scrollSync     │
    │  autocomplete shortcuts stats imageStore    │
    │  imageHelpers mathUtils mathRenderer        │
    │  exportUtils blogGenerator                  │
    └──────────────────────────────────────────────┘
```

### 2.2 耦合评分

| 模块 | 耦合类型 | 问题 | 评分 |
|------|---------|------|------|
| **App.tsx** | 内容耦合 | 直接操纵 marked、mermaid、KaTeX、scrollSync、footnote 定位逻辑 | ★★☆☆☆ |
| **Editor.tsx** | 控制耦合 | 导入 15+ 个外部模块，混合渲染、输入、lint、图片、数学、导出等逻辑 | ★★☆☆☆ |
| **FileManagerContext.tsx** | 控制耦合 | 是一个 state-only Context，接口相对清晰 | ★★★☆☆ |
| **Preview.tsx** | 数据耦合 | 接收渲染好的 HTML 字符串显示，相对独立 | ★★★★☆ |
| **scrollSync.ts** | 数据耦合 | 纯函数工具，无外部依赖 | ★★★★★ |
| **footnote.ts** | 数据耦合 | 纯函数工具 | ★★★★★ |
| **UndoRedoManager.ts** | 数据耦合 | 独立类，无外部依赖 | ★★★★★ |
| **markdownLinter.ts** | 数据耦合 | 纯函数工具 | ★★★★★ |
| **blogGenerator.ts** | 内容耦合 | 依赖 blogTemplates、blogThemeStyles、frontMatter、imageStore、marked | ★★☆☆☆ |

### 2.3 核心耦合问题

1. **App.tsx 上帝组件问题**：760 行代码处理布局、渲染管道（marked + KaTeX + Mermaid）、滚动同步、状态管理、键盘快捷键、脚注定位——职责过多，任何一处改动都可能影响整个应用。

2. **Editor.tsx 超级组件问题**：300+ 行，集成了 textarea 事件处理、粘贴/拖拽图片、数学预览、语法检查集成、工具栏集成、图片优化弹窗、另存为弹窗、搜索替换面板、Front Matter 面板。一个组件承担了几乎全部的编辑器交互逻辑。

3. **imageStore 全局单例**：`IMAGE_STORE` 是一个模块级 `Map`，所有导入地方共享同一实例。优点是简单，缺点是测试困难（需要手动清理状态），且如果未来需要服务端渲染会出问题。

4. **跨模块直接引用**：没有通过接口或事件总线解耦。例如 Editor.tsx 直接导入 `lintMarkdown`、`insertFootnote`、`insertMath`、`storeBase64Image` 等，每个导入都是一个紧耦合点。

---

## 三、功能性分析

### 3.1 功能清单（按完成度）

| 功能 | 完成度 | 说明 |
|------|-------|------|
| Markdown 编辑 | ★★★★★ | 核心功能完整 |
| 实时预览 | ★★★★★ | marked + 双向滚动同步 |
| 语法高亮 | ★★★★★ | highlight.js 21+ 语言 |
| 数学公式 | ★★★★☆ | KaTeX 渲染 + 行内预览，但错误处理可加强 |
| 图表渲染 | ★★★☆☆ | Mermaid 支持但渲染不稳定，错误时会 fallback |
| 文件管理 | ★★★★☆ | localStorage 持久化，文件树 + 标签页 |
| 撤销/重做 | ★★★★☆ | 操作分组 + 200 步历史 + 多文件独立管理 |
| 语法检查 | ★★★★☆ | 7 类规则 + 一键修复 |
| 博客生成 | ★★★★☆ | 9 种风格 + SPA/ZIP 输出，但部分主题 CSS 不完整 |
| 大纲导航 | ★★★★☆ | 树形标题 + 点击跳转 + 滚动联动 |
| 搜索替换 | ★★★★☆ | 当前文件搜索 + 全局搜索 |
| 表格编辑 | ★★★☆☆ | 可视化编辑器可用但 UX 可改善 |
| 脚注 | ★★★☆☆ | 侧边栏可查看但交互方式单一 |
| 图片管理 | ★★★☆☆ | 占位符系统避免 Base64 膨胀，但缺少图片预览功能 |
| 导出 | ★★★☆☆ | 支持 MD/HTML/PDF，但 PDF 依赖 html2pdf.js 质量不稳定 |
| 深色/浅色主题 | ★★★★★ | CSS 变量驱动，完整覆盖 |
| 专注模式/打字机模式 | ★★★☆☆ | 功能可用但快捷键分散 |

### 3.2 待删除的死代码

- `components/RichEditor.tsx` — 已弃用的 Canvas 预览编辑器，组件仍在导出但未被任何地方使用
- `modules/editor/EditorOverlay.tsx` — Canvas 语法检查覆盖层，复杂但视觉效果有限，且被 Canvas API 限制

---

## 四、数据流、状态流、时序分析

### 4.1 核心数据流

```
用户输入 Textarea
    │
    ▼
Editor.onChange(value)
    │
    ├──► handleChange(value)
    │       ├──► setLocalContent(value)         // 立即更新本地状态
    │       └──► setTimeout(fn, 500ms)           // 500ms 防抖
    │               └──► FileManagerContext.updateFileContent()
    │                       └──► localStorage.setItem()  // 持久化
    │
    ▼
localContent State
    │
    ├──► marked.parse(content)                  // 基础 Markdown → HTML
    ├──► getFlatHeadingList(content)            // 提取标题 ID
    │
    ▼
baseHtml (useMemo)
    │
    ├──► renderMathInHtml()                     // KaTeX 数学渲染
    │       └──► setRenderedHtml(result)
    │
    ▼
renderedHtml State
    │
    ├──► Preview 组件 renderedHtml prop
    │
    └──► setTimeout(fn, 200ms)
            └──► mermaid.render()               // Mermaid 图表渲染（DOM 操作）
```

### 4.2 滚动同步时序图

```
Editor 滚动事件              Preview 滚动事件
      │                            │
      ▼                            ▼
  throttle(8ms)               throttle(8ms)
      │                            │
      ▼                            ▼
  getRelativeScrollPosition()  getRelativeScrollPosition()
      │                            │
      ├─── syncLock == true? ───► skip
      │                            │
      ▼                            ▼
  lastSyncSource = 'editor'   lastSyncSource = 'preview'
  isSyncingRef = true          isSyncingRef = true
      │                            │
      ▼                            ▼
  setRelativeScrollPosition    setRelativeScrollPosition
  (Preview, position)          (Editor, position)
      │                            │
      └──── setTimeout(50ms) ──────┘
            └──► isSyncingRef = false  (解锁)
```

关键时序参数：
- 节流间隔：8ms
- 同步锁定：50ms（防止回弹）
- 平滑动画：150ms ease-out-cubic
- 自动保存防抖：500ms
- 数学渲染防抖：300ms
- 博客预览防抖：500ms

### 4.3 状态管理架构

```
React Context 层级：
  ThemeProvider (ThemeContext)          ← 全局主题
    └► FileManagerProvider              ← 文件树 + 标签页 + activeFile
         └► UndoRedoProvider            ← 撤销/重做历史栈（按 fileId 分）
              └► ModalProvider          ← InputModal / CreateFileModal 状态
                   └► AppContent        ← 本地 UI 状态（模式、面板可见性）

AppContent 本地状态：
  localContent          ← 当前编辑中的文本
  renderedHtml          ← KaTeX 渲染后的 HTML
  showOutline           ← 大纲面板可见性
  showPreview           ← 预览面板可见性
  focusMode             ← 专注模式开关
  typewriterMode        ← 打字机模式开关
  showQuickOpen         ← 快速打开弹窗
  showGlobalSearch      ← 全局搜索弹窗
  showBlogStudio        ← 博客设计工作室
  highlightedHeading    ← 大纲点击高亮
  scrollActiveHeading   ← 滚动联动当前标题
  activeFootnoteId      ← 当前高亮的脚注

localStorage 持久化的 key：
  'markdown-editor-file-manager'  ← 文件树 + 标签页 + v5 版本号
  'app-theme-preference'          ← 'dark' | 'light'
  'outline-visibility'            ← boolean
  'preview-visibility'            ← boolean
  'focus-mode'                    ← boolean
  'typewriter-mode'               ← boolean
```

### 4.4 撤销/重做状态流

```
UndoRedoManager（每个文件一个实例）
  ┌─────────────────────────────────────────┐
  │ undoStack: [entry1, entry2, ...]        │  ← 历史快照栈
  │ redoStack: [entry3, ...]                │  ← 被撤销的快照
  │ currentEntry: {content, cursor, time}    │  ← 当前状态
  │ lastGroupKey / lastGroupTimestamp       │  ← 操作分组标记
  └─────────────────────────────────────────┘
  
  操作分组逻辑：
  - groupKey 相同 + 间隔 < 800ms → 不推入栈，直接更新 currentEntry
  - 否则 → push currentEntry 到 undoStack → 清空 redoStack
  
  undo():  undoStack.pop() → redoStack.push(currentEntry) → 返回 prevEntry
  redo():  redoStack.pop() → undoStack.push(currentEntry) → 返回 nextEntry
```

---

## 五、架构模式总结

### 5.1 当前使用的模式

| 模式 | 应用位置 | 评价 |
|------|---------|------|
| Context API | Theme, FileManager, UndoRedo, Modal | 适合简单全局状态，但缺乏依赖注入 |
| Lift State Up | 所有共享状态在 App.tsx | 导致 App.tsx 膨胀 |
| Custom Hooks | 未大量使用 | 大量逻辑写在组件内而非 hook 中 |
| 纯函数模块 | scrollSync, stats, footnote, linter, autocomplete | 设计合理，测试友好 |
| 单例模式 | imageStore (Map in module scope) | 简单但不利于测试 |
| Event Emitter | UndoRedoManager (listener pattern) | 合理的观察者模式 |

### 5.2 未采用但值得考虑的模式

- **状态管理库** (Zustand / Jotai) — 可替代 Context 减少重渲染
- **自定义 Hook 提取** — 将 Editor.tsx 和 App.tsx 中的大段逻辑提取为 hook
- **依赖注入** — 目前直接 import 导致紧耦合，接口抽象可提高可测试性
- **发布-订阅事件总线** — 用于跨组件通信，减少 prop drilling
- **动态导入 (`React.lazy`)** — 博客模块是独立应用，懒加载可减少首屏体积
