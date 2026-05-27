---
name: markdown-editor-extraction-plan
description: 从 MarkdownEditor 项目抽取可复用的 Markdown 编辑模块，集成到静态博客和 Inbox（AI 工作流 Markdown 工具）
type: project
---

# Markdown 编辑器模块抽取与集成计划

**Why:** 当前 MarkdownEditor 项目功能完整（87MB → 源码仅 ~1.4MB），但耦合严重。目标是将其 Markdown 编辑核心抽取为可复用的组件，先后集成到静态博客和 Inbox。不能直接整体绑入目标项目，也不能立刻抽独立包——需要先解耦再拆分。

**How to apply:** 任何对 MarkdownEditor 项目的操作都应遵照本计划的阶段顺序。每个阶段的产出不应破坏现有功能。每个阶段的入口文件见对应 Checklist。

---

## 终极目标

- **博客：** 引入 `<MarkdownEditor>` 组件用于文章编辑，不引入博客生成功能
- **Inbox：** 替换现有编辑器的部分模块（Markdown 解析、预览渲染、语法检查等），保留 Inbox 现有架构和文件系统
- **不推倒重来 Inbox** — 用渐进替换策略，逐个模块接入

---

## Phase 1：内部解耦（当前阶段，1-2 天）

### P0：App.tsx 渲染管道拆 Hook

**文件:** `src/App.tsx` → 拆为多个文件

- [ ] 创建 `src/modules/preview/useMarkdownRender.ts`
  - 抽取 `marked.parse()` 调用、自定义 `renderer`、代码块包装逻辑
  - 导出 `useMarkdownRender(content: string): { html: string }`
- [ ] 创建 `src/modules/preview/useKaTeX.ts`
  - 抽取 `renderMathInHtml` 调用逻辑（300ms 防抖、大文档异步渲染、abort 机制）
  - 导出 `useKaTeX(html: string): { renderedHtml: string }`
- [ ] 创建 `src/modules/preview/useMermaid.ts`
  - 抽取 mermaid 初始化和 DOM 渲染逻辑
  - 导出 `useMermaid(html: string, theme: string): void`
- [ ] 创建 `src/modules/editor/useScrollSync.ts`
  - 抽取双向滚动同步的所有 ref 和逻辑
  - 导出 `useScrollSync(editorRef, previewRef): { handleEditorScroll, handlePreviewScroll, cancelAnimation }`

### P0：barrel 导出

- [ ] 每个 `modules/` 子目录添加 `index.ts`，统一导出该模块的公开接口
- [ ] 所有跨模块 import 改为从 barrel 导入（逐步，不必一次性）

### P1：Editor.tsx 逻辑抽 Hook

- [ ] 创建 `src/modules/editor/useImagePaste.ts` — 图片粘贴/拖拽/Base64→占位符逻辑
- [ ] 创建 `src/modules/editor/useLint.ts` — 语法检查调用和状态管理
- [ ] 创建 `src/modules/editor/useEditorState.ts` — 光标/选区/搜索替换状态

### P1：清理死代码

- [ ] `components/RichEditor.tsx` → `deprecated/RichEditor.tsx`
- [ ] `modules/editor/EditorOverlay.tsx` → `deprecated/EditorOverlay.tsx`

### P2：FileManagerContext 接口化

- [ ] 定义 `interface IFileSystem { getContent, saveContent, listFiles, ... }`
- [ ] 提供默认的 localStorage 实现
- [ ] FileManagerContext 依赖接口而非具体实现

---

## Phase 2：抽取 MarkdownEditor 组件

### 目标接口

```typescript
interface MarkdownEditorProps {
  // 核心数据
  value: string
  onChange: (value: string) => void

  // 主题
  theme?: 'dark' | 'light'

  // 功能开关（按需启用）
  showPreview?: boolean
  showToolbar?: boolean
  showOutline?: boolean
  showLineNumbers?: boolean
  showLint?: boolean
  showSearchReplace?: boolean

  // 可替换策略
  imageHandler?: ImageHandler        // 图片处理：占位符 | Base64 | OSS 上传
  fileSystem?: FileSystemAdapter     // 文件系统：localStorage | 云端 | noop
  onExport?: (format, content) => void  // 导出回调
}
```

### Checklist

- [ ] 拼装 MarkdownEditor 组件（组合 Editor + Preview + Toolbar + Outline + Lint）
- [ ] 所有子模块通过 props/接口注入，不直接 import 具体实现
- [ ] 验证：在当前项目中用 `<MarkdownEditor>` 替代 `AppContent` 布局，功能无损

---

## Phase 3：集成到博客

### Step 1：引入编辑器

走到这一步时，`<MarkdownEditor>` 已经可以独立使用。

- [ ] 博客项目中安装依赖（or 直接从本地路径引入）
- [ ] 博文编辑页面引入 `<MarkdownEditor>`，只开编辑+预览+工具栏
- [ ] 博客的保存逻辑用自己的 API（不依赖 FileManagerContext）
- [ ] 验证：写博文 → 预览 → 保存 全流程

### Step 2：按需裁减

博客不需要的模块直接不启用：`showOutline={false}`, `showLint={false}`, `showSearchReplace={false}`

---

## Phase 4：集成到 Inbox（渐进替换）

Inbox 已经有完整开发，不推倒重来。采用 **模块级替换** 策略：

### 可替换的模块（从易到难）

| 优先级 | 模块 | 理由 |
|--------|------|------|
| 1 | `markdownLinter.ts` + `LintPopover.tsx` | 纯函数工具，零外部依赖，直接替换 Inbox 的语法检查 |
| 2 | `scrollSync.ts` | 纯函数，无外部依赖 |
| 3 | `mathRenderer.ts` + `mathUtils.ts` | KaTeX 渲染，接口简单 |
| 4 | `footnote.ts` | 脚注提取和插入，纯函数 |
| 5 | `markdownAutocomplete.ts` | 输入补全，纯函数 |
| 6 | `UndoRedoManager.ts` | 独立类，可替换 Inbox 的撤销系统 |
| 7 | `Preview.tsx` | 渲染组件，需要接 Inbox 的渲染管道 |
| 8 | `Editor.tsx`（部分） | 最后才换核心编辑器，改动风险最大 |

每个模块替换后验证，再换下一个。

### 不能用/不想用的模块

- `FileManagerContext` — Inbox 有自己的文件管理系统，不换
- `blog/*` — 博客生成完全不用
- `OptimizeImagesModal.tsx` — Inbox 有自己的图片策略
- `WelcomePage.tsx` — Inbox 有自己的入口页面

---

## 当前状态

- [x] 项目已瘦身（删除 node_modules/dist，添加 .gitignore）
- [x] CLAUDE.md 已编写（耦合分析、功能分析、数据流分析）
- [x] 对齐了提取策略（本文档）
- [ ] Phase 1 P0 任务
