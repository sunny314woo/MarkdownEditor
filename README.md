# Markdown Editor

一款基于 React + TypeScript 构建的现代化 Markdown 文档编辑器，采用 Vite 作为构建工具。提供实时预览、语法高亮、数学公式、图表渲染、文件管理、语法检查、一键修复、个人博客生成等功能，旨在为用户提供高效、流畅的 Markdown 编写体验。

**核心定位**：轻量级、功能完备、开箱即用的浏览器端 Markdown 编辑器 + 个人博客工坊。

**运行环境**：纯前端应用，所有数据存储在浏览器 localStorage 中，无需后端服务。

---

## 主要功能

### 编辑核心

- **实时预览** — 编辑区与预览区双向滚动同步，8ms 节流 + 平滑动画
- **语法高亮** — 基于 highlight.js 支持 21+ 种编程语言代码高亮，深色/浅色主题自适应
- **自动配对** — 括号 `()`、`[]`、`{}`、引号 `""`、`''`、反引号自动补全
- **Markdown 自动补全** — 输入 Markdown 语法触发词时自动补全完整语法结构（链接、图片、代码块、表格等 8 种规则）
- **代码块补全** — 输入第三个反引号时自动生成完整代码块，工具栏选择语言后直接插入空代码块
- **自动续行** — 列表项（有序/无序）、引用块按 Enter 自动续行
- **智能缩进** — Tab 增加 2 空格缩进，Shift+Tab 反缩进
- **撤销/重做** — 自定义操作分组历史栈，最多 100 步历史记录，支持事务性操作
- **搜索替换** — 当前文件内搜索替换，支持匹配导航和搜索历史
- **全局搜索** — `Ctrl+Shift+F` 跨所有文件搜索内容，按文件分组展示
- **图片处理** — 粘贴/拖拽/上传图片，占位符系统替代 Base64，编辑区内联预览
- **智能图片删除** — 光标在图片标记内时 Backspace/Delete 删除整个图片标记
- **表格编辑** — 快速插入 + 可视化高级编辑器，支持行列增删和对齐设置
- **格式化工具栏** — 加粗、斜体、标题、列表、引用、代码块、Emoji、思维导图等按钮
- **文档统计** — 字数（纯文本/标准模式）、字符数、行数实时统计

### 语法检查

- **实时检测** — 7 类 Markdown 语法错误，波浪线标记 + 行尾圆点（红色=错误，黄色=警告）
- **悬浮面板** — 鼠标悬停状态栏计数弹出 LintPopover 问题列表
- **一键修复** — 可修复的问题右侧显示按钮，点击自动修复
- **占位符感知** — 语法检查自动跳过图片占位符标记，避免误报


| 检测规则          | 严重性           | 可自动修复 |
| ------------- | ------------- | ----- |
| 未闭合的代码块       | error         | 是     |
| 链接格式不完整/空链接   | error/warning | 是     |
| 标题层级跳跃/缺空格    | warning       | 是     |
| 列表标记缺空格/缩进混用  | warning       | 是     |
| 反引号数量为奇数      | error         | 是     |
| 图片格式不完整/缺替代文字 | error/warning | 是     |
| 分割线混用字符       | warning       | 是     |


### Front Matter 支持

- **YAML 解析** — 自动解析 Markdown 文件头部的 `---` 包裹的 YAML 元数据
- **可视化编辑面板** — 标题、日期、标签、分类、描述、作者等字段表单化编辑
- **自动提取** — 从 Front Matter 中提取标题作为文档显示名，提取标签用于博客生成

### 个人博客工坊

- **Blog Studio** — 独立全屏设计工作室，深色工作台 + 专业设计工具风格界面
- **9 种博客风格** — 一键切换，实时预览，大面积适配不同用户群体
- **文件选择/排除** — 勾选需要包含的 Markdown 文档，排除不想加入博客的文件
- **实时预览** — iframe srcdoc 沙箱预览，500ms 防抖更新
- **设备模拟** — 桌面/平板/手机三种预览尺寸切换
- **单文件 SPA 生成** — 博客输出为单个 HTML 文件，包含 hash 路由导航
- **多文件导出** — 支持导出为文件夹结构（ZIP 下载）

#### 9 种博客风格


| 风格   | 适合人群     | 核心特色                    |
| ---- | -------- | ----------------------- |
| 杂志   | 内容创作者    | Featured + Grid 卡片布局    |
| 极简   | 极简主义者    | 干净列表，无多余装饰              |
| 经典   | 传统博客用户   | 卡片 + 侧边栏                |
| 水墨禅意 | 东方文化爱好者  | 宣纸纹理、朱红印章、毛笔字体、竖排装饰     |
| 终端极客 | 程序员/黑客   | CRT 扫描线、矩阵绿荧光、命令行导航     |
| 报纸编辑 | 新闻/文学爱好者 | 多栏排版、报头、首字下沉、双线分隔       |
| 玻璃拟态 | 现代设计爱好者  | 流动渐变背景、毛玻璃卡片、彩色光晕       |
| 便当盒  | 整洁控/日系风  | 不等大网格、大圆角、柔和配色、hover 缩放 |
| 故事叙述 | 长文/故事作者  | 全屏封面、章节编号、时间线、书本阅读体验    |


#### 博客配置选项

- 站点标题、描述、作者、语言
- 博客风格（9 种）
- 配色方案（暖金/海洋/森林/玫瑰/紫罗兰）
- 主题模式（浅色/深色）
- 字体风格（衬线/无衬线/等宽）
- 文件选择（勾选/排除 Markdown 文档）

### 界面与体验

- **深色/浅色主题** — CSS 变量驱动，偏好持久化到 localStorage，所有弹窗和面板跟随主题切换
- **专注模式** — 隐藏所有面板，编辑区居中 800px，增大字号和行高，当前行高亮 + 非当前行淡出
- **打字机模式** — `Ctrl+Shift+T`，光标始终保持在编辑区垂直居中，当前行蓝色竖线高亮
- **创新创意艺术风格** — 渐变装饰线、SVG 图标、菱形装饰点、层级色彩系统
- **温暖文艺主页** — 全屏沉浸式布局，鼠标跟随光效、背景流动动画、文字打字机效果、3D 卡片翻转
- **精确行号对齐** — 行号与文本行像素级对齐，统一字体/行高/内边距
- **CSS Grid 自适应布局** — 编辑区/预览区/大纲区自适应宽度，关闭预览无空白
- **滚动按钮** — 编辑区和预览区各有一键到顶/到底悬浮按钮
- **欢迎页面** — 温暖文艺感全屏沉浸式布局，鼠标跟随光效、4 种动效、功能卡片网格

### 文件管理

- **文件树** — 树形结构，文件夹/文件层级管理，内置折叠按钮
- **创建/删除/重命名** — 右键菜单或三点按钮操作，删除带确认对话框
- **拖拽移动与排序** — 文件/文件夹拖拽到不同位置，三种放置区域视觉反馈
- **多标签页** — 打开多个文件，标签页切换和关闭
- **快速打开** — `Ctrl+P` 模糊搜索文件名，最近打开优先
- **自动保存** — 编辑后 500ms 防抖自动保存到 localStorage
- **打开本地文件** — 支持 .md 和 .markdown 格式

### 导出

- **另存为** — File System Access API 优先，降级为 Blob 下载
- **多格式导出** — 支持 Markdown (.md)、HTML (.html)、PDF (.pdf) 三种格式
- **位置选择** — 支持选择完整文件路径或目标文件夹

### 数学公式与图表

- **KaTeX 渲染** — 行内公式 `$...$` 和块级公式 `$$...$$` 实时渲染
- **行内预览** — 编辑区光标在公式内时显示渲染预览
- **数学符号面板** — 常用数学符号快速插入
- **Mermaid 图表** — 支持流程图、思维导图等渲染，跟随主题切换
- **脚注支持** — marked-footnote 插件，脚注侧边栏管理

### 大纲导航

- **标题树形展示** — 6 色层级色彩系统，层级缩进，折叠/展开
- **点击跳转** — 点击标题跳转到编辑区对应行
- **滚动联动** — 编辑区滚动时自动高亮当前标题
- **全部展开/折叠** — 一键操作
- **统计信息** — 标题计数、最大深度指示

---

## 技术栈


| 类别            | 技术                                    | 版本               | 说明                |
| ------------- | ------------------------------------- | ---------------- | ----------------- |
| 前端框架          | React                                 | ^18.2.0          | 函数式组件 + Hooks     |
| 编程语言          | TypeScript                            | ^5.2.2           | strict 模式         |
| 构建工具          | Vite                                  | ^5.2.0           | HMR + 生产优化        |
| 样式方案          | Tailwind CSS + CSS 变量 + Inline Styles | ^3.4.3           | 原子化 + 主题变量 + 组件样式 |
| Markdown 解析   | marked                                | ^14.1.3          | GFM + breaks      |
| 代码高亮          | highlight.js                          | ^11.11.1         | 21+ 语言支持          |
| Markdown→高亮集成 | marked-highlight                      | ^2.2.4           | marked 插件         |
| 数学公式          | KaTeX                                 | ^0.16.45         | 行内 + 块级渲染         |
| 图表渲染          | mermaid                               | ^11.14.0         | 流程图 + 思维导图        |
| HTML→Markdown | TurndownService                       | ^7.2.4           | WYSIWYG 反向转换      |
| 脚注支持          | marked-footnote                       | ^1.4.0           | marked 插件         |
| PDF 导出        | html2pdf.js                           | ^0.14.0          | 客户端 PDF 生成        |
| 测试框架          | Vitest + Testing Library              | ^1.0.0 / ^14.0.0 | 单元测试 + 组件测试       |


---

## 快速开始

### 环境要求


| 依赖      | 最低版本    | 推荐版本        | 说明                 |
| ------- | ------- | ----------- | ------------------ |
| Node.js | >= 16.0 | >= 18.0 LTS | JavaScript 运行时     |
| npm     | >= 7.0  | >= 9.0      | 包管理器（随 Node.js 安装） |
| Git     | >= 2.0  | 最新版         | 版本控制（可选，用于克隆仓库）    |


> **提示**：推荐使用 Node.js 18.x 或 20.x LTS 版本以确保兼容性。可使用 [nvm](https://github.com/nvm-sh/nvm)（macOS/Linux）或 [nvm-windows](https://github.com/coreybutler/nvm-windows)（Windows）管理多个 Node.js 版本。

### Windows 安装与运行

#### 1. 安装 Node.js

**方式一：官方安装包（推荐新手）**

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 **LTS** 版本的 Windows Installer（`.msi` 文件）
3. 双击运行安装程序，勾选 **Add to PATH**，一路 Next 完成安装
4. 打开 **命令提示符** 或 **PowerShell**，验证安装：

```powershell
node --version
npm --version
```

**方式二：nvm-windows（推荐开发者）**

1. 访问 [nvm-windows Releases](https://github.com/coreybutler/nvm-windows/releases)
2. 下载最新版 `nvm-setup.exe` 并安装
3. 在命令提示符或 PowerShell 中执行：

```powershell
nvm install 20
nvm use 20
```

**方式三：winget（Windows 10/11 内置）**

```powershell
winget install OpenJS.NodeJS.LTS
```

安装完成后**重新打开终端**，验证：

```powershell
node --version
npm --version
```

> **注意**：如果安装后 `node` 命令无法识别，请检查系统环境变量 `PATH` 中是否包含 Node.js 的安装路径，或重新打开终端窗口。

#### 2. 获取项目代码

**方式一：Git 克隆**

```powershell
git clone https://github.com/your-username/markdown-editor.git
cd markdown-editor
```

**方式二：下载 ZIP**

1. 访问项目 GitHub 页面，点击绿色 **Code** 按钮
2. 选择 **Download ZIP**
3. 解压到目标目录，在终端中进入：

```powershell
cd D:\path\to\markdown-editor
```

#### 3. 安装依赖

```powershell
npm install
```

> 如果下载速度慢，可使用国内镜像：
>
> ```powershell
> npm config set registry https://registry.npmmirror.com
> npm install
> ```

#### 4. 启动开发服务器

```powershell
npm run dev
```

终端输出类似：

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

在浏览器中打开 `http://localhost:5173/` 即可使用。

#### 5. 生产构建

```powershell
npm run build
npm run preview
```

### macOS 安装与运行

#### 1. 安装 Node.js

**方式一：官方安装包**

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 **LTS** 版本的 macOS Installer（`.pkg` 文件）
3. 双击运行安装程序，按提示完成安装
4. 打开 **终端**（Terminal），验证安装：

```bash
node --version
npm --version
```

**方式二：Homebrew（推荐开发者）**

```bash
# 安装 Homebrew（如未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js
brew install node

# 验证
node --version
npm --version
```

**方式三：nvm（推荐多版本管理）**

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 重新打开终端，或执行
source ~/.zshrc

# 安装并使用 Node.js LTS
nvm install --lts
nvm use --lts

# 验证
node --version
npm --version
```

#### 2. 获取项目代码

```bash
git clone https://github.com/your-username/markdown-editor.git
cd markdown-editor
```

#### 3. 安装依赖

```bash
npm install
```

> 如果下载速度慢，可使用国内镜像：
>
> ```bash
> npm config set registry https://registry.npmmirror.com
> npm install
> ```

#### 4. 启动开发服务器

```bash
npm run dev
```

在浏览器中打开 `http://localhost:5173/` 即可使用。

#### 5. 生产构建

```bash
npm run build
npm run preview
```

### Linux 安装与运行

#### 1. 安装 Node.js

**Ubuntu / Debian**

```bash
# 使用 NodeSource 仓库安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node --version
npm --version
```

**Fedora / RHEL / CentOS**

```bash
# 使用 NodeSource 仓库安装 Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 验证
node --version
npm --version
```

**Arch Linux**

```bash
sudo pacman -S nodejs npm

# 验证
node --version
npm --version
```

**nvm（通用，推荐开发者）**

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 重新打开终端，或执行
source ~/.bashrc

# 安装并使用 Node.js LTS
nvm install --lts
nvm use --lts

# 验证
node --version
npm --version
```

**Snap（Ubuntu 等）**

```bash
sudo snap install node --classic
```

#### 2. 获取项目代码

```bash
git clone https://github.com/your-username/markdown-editor.git
cd markdown-editor
```

#### 3. 安装依赖

```bash
npm install
```

> 如果下载速度慢，可使用国内镜像：
>
> ```bash
> npm config set registry https://registry.npmmirror.com
> npm install
> ```

#### 4. 启动开发服务器

```bash
npm run dev
```

在浏览器中打开 `http://localhost:5173/` 即可使用。

#### 5. 生产构建

```bash
npm run build
npm run preview
```

### 常见问题


| 问题                      | 原因                   | 解决方案                                                                  |
| ----------------------- | -------------------- | --------------------------------------------------------------------- |
| `node` 不是内部或外部命令        | Node.js 未安装或未加入 PATH | 重新安装 Node.js 并勾选 Add to PATH，或手动添加环境变量                                |
| `npm install` 报错 EACCES | npm 全局目录权限不足         | 使用 `nvm` 管理 Node.js，或执行 `sudo chown -R $(whoami) ~/.npm`（macOS/Linux） |
| `npm install` 速度极慢      | 默认源在国外               | 执行 `npm config set registry https://registry.npmmirror.com` 切换国内镜像    |
| `npm run dev` 端口被占用     | 5173 端口已被其他程序使用      | Vite 会自动尝试 5174 等下一个可用端口，或手动指定：`npx vite --port 3000`                 |
| macOS 提示"无法验证开发者"       | Gatekeeper 安全限制      | 系统偏好设置 → 安全性与隐私 → 点击"仍要打开"                                            |
| Linux 下 `git clone` 失败  | 未安装 Git              | Ubuntu: `sudo apt install git` / Fedora: `sudo dnf install git`       |


### 可用脚本


| 命令                      | 说明                          |
| ----------------------- | --------------------------- |
| `npm run dev`           | 启动 Vite 开发服务器（热更新）          |
| `npm run build`         | TypeScript 类型检查 + Vite 生产构建 |
| `npm run preview`       | 预览生产构建结果                    |
| `npm run lint`          | ESLint 代码检查                 |
| `npm run test`          | 运行 Vitest 测试（watch 模式）      |
| `npm run test:coverage` | 运行测试并生成覆盖率报告                |


---

## 配置说明

本项目为纯前端应用，无需环境变量配置。以下为内置的运行时参数：


| 参数              | 默认值   | 说明                        |
| --------------- | ----- | ------------------------- |
| 自动保存延迟          | 500ms | 编辑后防抖自动保存到 localStorage   |
| 撤销栈最大步数         | 100   | 自定义撤销/重做历史记录上限            |
| 滚动同步节流          | 8ms   | 编辑器与预览区滚动同步的节流间隔          |
| 同步锁定时长          | 50ms  | 双向滚动同步时防止回弹的锁定时间          |
| 代码块折叠阈值         | 10 行  | 超过此行数的代码块默认折叠             |
| 图片大小确认阈值        | 2MB   | 超过此大小的图片嵌入前弹出确认           |
| 博客预览防抖          | 500ms | Blog Studio 中设计变更到预览更新的延迟 |
| localStorage 版本 | v5    | 版本不匹配时重置为默认数据             |


---

## 项目结构

```
MarkdownEditor/
├── .gitignore                          # Git 忽略规则（排除 node_modules、dist 等）
├── index.html                          # Vite 入口 HTML，挂载 React 根节点
├── package.json                        # 项目依赖与脚本（dev/build/lint/test）
├── package-lock.json                   # 依赖版本锁定文件（自动生成）
├── server.ps1                          # Windows PowerShell 静态文件服务器（用于预览 dist/）
├── vite.config.ts                      # Vite 构建配置（React 插件）
├── tsconfig.json                       # TypeScript 主配置（strict 模式）
├── tsconfig.node.json                  # Node 端 TypeScript 配置（Vite 配置文件用）
├── tailwind.config.js                  # Tailwind CSS 配置
├── postcss.config.js                   # PostCSS 配置（Tailwind + Autoprefixer）
├── vitest.config.ts                    # Vitest 测试框架配置
│
├── src/                                # ★ 项目源码目录
│   ├── main.tsx                        # 应用入口：挂载 React、包裹 ThemeProvider
│   ├── App.tsx                         # 主应用组件：布局编排、Markdown 渲染管道、快捷键
│   ├── index.css                       # 全局样式：CSS 变量定义（深色/浅色主题色板）
│   ├── vite-env.d.ts                   # Vite 类型声明
│   ├── setupTests.ts                   # 测试初始化：引入 @testing-library/jest-dom
│   │
│   ├── types/                          # TypeScript 类型定义
│   │   └── fileManager.ts             # FileNode（文件树节点）、Tab（标签页）、FileManagerState
│   │
│   ├── components/                     # 跨模块复用的 UI 组件
│   │   ├── TabBar.tsx                  # 多标签页栏：切换/关闭标签、渐变色装饰线
│   │   ├── SearchReplace.tsx           # 搜索替换面板：匹配导航、替换统计、搜索历史
│   │   ├── InlineMathPreview.tsx       # KaTeX 行内公式悬浮预览：光标在公式内时弹出
│   │   ├── MathSymbolsPopover.tsx      # 数学符号分类选择器：希腊字母、运算符等 11 类
│   │   ├── FootnoteSidebar.tsx         # 脚注侧边栏：列出所有脚注定义，点击定位到预览区
│   │   ├── OptimizeImagesModal.tsx     # 图片优化弹窗：检测 Base64 图片，保存为本地文件
│   │   ├── RichEditor.tsx              # 富文本编辑区（已弃用）：canvas 预览式编辑
│   │   └── WelcomePage.tsx             # 欢迎主页：全屏沉浸式布局，打字机动效，功能卡片
│   │
│   ├── modules/                        # 功能模块（按职责划分）
│   │   ├── editor/                     # ★ 编辑器核心模块
│   │   │   ├── Editor.tsx             # 主编辑器组件：textarea + 行号 + 工具栏 + 语法检查全覆盖
│   │   │   ├── EditorOverlay.tsx       # Canvas 覆盖层（已弃用）：在编辑区上绘制波浪线/圆点标记
│   │   │   ├── LineNumbers.tsx         # 行号组件：与文本像素级对齐，支持大量行截断
│   │   │   ├── editorHelpers.ts        # 滚动到指定行：Canvas 测量换行后精确定位
│   │   │   ├── scrollSync.ts           # 滚动同步引擎：节流 + 平滑动画 + 性能监控
│   │   │   ├── stats.ts                # 文档统计：三种计数模式（纯文本/标准/字符）
│   │   │   ├── footnote.ts             # 脚注工具：提取/排序/插入脚注定义和引用
│   │   │   ├── markdownAutocomplete.ts  # 智能自动补全：代码块、链接、表格、任务列表等 8 种
│   │   │   ├── markdownShortcuts.ts     # 格式化快捷键：加粗/斜体/代码块等 wrap 函数
│   │   │   ├── UndoRedoManager.ts       # 撤销/重做管理器：操作分组、文件级历史栈
│   │   │   └── UndoRedoContext.tsx      # 撤销/重做 Context：全局状态，支持多文件独立历史
│   │   │
│   │   ├── preview/                    # ★ 预览渲染模块
│   │   │   ├── Preview.tsx            # 预览面板：HTML 渲染 + Turndown 反向编辑 + 复制代码
│   │   │   ├── mathRenderer.ts         # KaTeX 数学渲染器：缓存、分块渲染、错误隔离
│   │   │   └── mathUtils.ts            # 公式插入工具：光标位置计算行内/块级公式
│   │   │
│   │   ├── fileManager/               # ★ 文件管理模块
│   │   │   ├── FileManagerContext.tsx   # 文件管理器 Context：CRUD、标签页、搜索、localStorage 持久化
│   │   │   ├── fileManagerUtils.ts     # 工具函数：localStorage 读写、ID生成、节点查找/移动
│   │   │   ├── Sidebar.tsx             # 侧边栏：文件树 + 搜索框 + 操作按钮
│   │   │   ├── FileTreeNode.tsx        # 文件树节点：拖拽排序、右键菜单、重命名/删除
│   │   │   ├── CreateFileModal.tsx     # 创建文件弹窗：选择目标文件夹 + 文件名输入
│   │   │   └── FolderSelector.tsx      # 文件夹选择器：树形目录浏览，用于移动文件
│   │   │
│   │   ├── toolbar/                    # ★ 工具栏模块
│   │   │   ├── MarkdownToolbar.tsx     # 主工具栏：B/I/标题/列表/链接/图片/表格/图表等按钮
│   │   │   ├── MathPopover.tsx         # 数学公式符号选择器：希腊字母、运算符、模板
│   │   │   ├── TableToolbar.tsx        # 表格快捷插入：行/列选择 + 对齐设置
│   │   │   ├── TableEditor.tsx         # 可视化表格编辑器：单元格编辑、行列增删、对齐
│   │   │   └── ListMenuPopover.tsx     # 列表菜单：无序/有序/任务列表 + 缩进/反缩进
│   │   │
│   │   ├── outline/                    # ★ 大纲导航模块
│   │   │   ├── Outline.tsx            # 大纲面板：树形标题展示、折叠/展开、点击跳转
│   │   │   ├── outlineUtils.ts         # 标题解析：提取 Markdown 标题并构建层级树
│   │   │   └── __tests__/              # 测试文件
│   │   │       ├── outlineUtils.test.ts # 标题解析单元测试（Vitest）
│   │   │       └── Outline.test.tsx     # 大纲组件测试（React Testing Library）
│   │   │
│   │   ├── lint/                       # ★ 语法检查模块
│   │   │   ├── LintPopover.tsx         # 问题列表悬浮面板：分类显示错误/警告，一键修复
│   │   │   └── markdownLinter.ts       # Markdown 语法检查器：7 类规则 + 自动修复
│   │   │
│   │   ├── export/                     # ★ 导出模块
│   │   │   ├── SaveAsModal.tsx         # 另存为弹窗：格式选择 + File System Access API
│   │   │   └── exportUtils.ts          # 导出工具：生成 .md/.html/.pdf Blob + 下载
│   │   │
│   │   ├── blog/                       # ★ 博客生成模块
│   │   │   ├── BlogStudio.tsx         # 博客设计工作室：全屏界面、9 种风格、实时预览
│   │   │   ├── BlogModal.tsx           # 博客生成入口弹窗：文件选择 + 配置
│   │   │   ├── FrontMatterPanel.tsx    # Front Matter 可视化编辑面板
│   │   │   ├── blogGenerator.ts        # 博客生成引擎：单文件 SPA / 文件夹 ZIP 输出
│   │   │   ├── blogTemplates.ts        # 博客配置类型与模板函数：主页/文章/归档/RSS 等
│   │   │   ├── blogThemeStyles.ts      # 9 种博客主题 CSS 生成器
│   │   │   └── frontMatter.ts          # YAML Front Matter 解析与生成
│   │   │
│   │   ├── settings/                   # ★ 设置模块
│   │   │   └── ThemeContext.tsx        # 主题 Context：深色/浅色切换，CSS 变量驱动
│   │   │
│   │   └── shared/                     # ★ 共享工具模块
│   │       ├── ModalContext.tsx        # 模态框 Context：统一管理 Input/CreateFile 弹窗
│   │       ├── InputModal.tsx          # 通用输入弹窗：标题 + 输入框 + 确认/取消
│   │       ├── ScrollButtons.tsx       # 滚动按钮：编辑区和预览区的置顶/置底悬浮按钮
│   │       ├── QuickOpen.tsx           # 快速打开（Ctrl+P）：模糊搜索文件名，最近打开优先
│   │       ├── GlobalSearch.tsx        # 全局搜索（Ctrl+Shift+F）：跨文件内容搜索
│   │       ├── imageHelpers.ts         # 图片辅助工具：查找图片标记、Base64 信息提取
│   │       └── imageStore.ts           # 图片占位符存储：Base64 → 占位符 ID 映射
│   │
│   └── index.css (已在前文列出，此为根级 CSS)
│
├── dist/                               # 构建产物（自动生成，已加入 .gitignore）
│   ├── assets/                         # 打包后的 JS/CSS/字体文件
│   └── index.html                      # 构建后的入口 HTML
│
└── node_modules/                       # npm 依赖包（自动生成，已加入 .gitignore）
    ├── react/                          # UI 框架
    ├── marked/                         # Markdown 解析器
    ├── katex/                          # 数学公式渲染
    ├── mermaid/                        # 图表渲染
    ├── highlight.js/                   # 代码高亮
    ├── turndown/                       # HTML→Markdown 转换
    ├── html2pdf.js/                    # PDF 生成
    ├── vite/                           # 构建工具
    ├── tailwindcss/                    # CSS 框架
    ├── typescript/                     # 类型检查
    └── ...                             # 其他依赖
```

### 核心模块说明

#### 博客模块 (`modules/blog/`)


| 文件                     | 说明                                  |
| ---------------------- | ----------------------------------- |
| `BlogStudio.tsx`       | 博客设计工作室主界面，深色工作台 + Tab 导航 + 设备模拟预览  |
| `BlogModal.tsx`        | 博客入口弹窗                              |
| `FrontMatterPanel.tsx` | Front Matter 可视化编辑面板                |
| `blogGenerator.ts`     | 博客生成核心，单文件 SPA 生成 + 多文件导出           |
| `blogTemplates.ts`     | 博客配置接口、默认配置、辅助函数                    |
| `blogThemeStyles.ts`   | 6 种新主题（水墨/终端/报纸/玻璃/便当/故事）的完整 CSS 生成 |
| `frontMatter.ts`       | Front Matter YAML 解析与生成             |


#### 编辑器核心 (`modules/editor/`)


| 文件                        | 说明                           |
| ------------------------- | ---------------------------- |
| `UndoRedoManager.ts`      | 操作分组历史栈，支持事务性撤销/重做           |
| `UndoRedoContext.tsx`     | React Context，提供全局撤销/重做状态    |
| `markdownAutocomplete.ts` | 8 个 Markdown 自动补全纯函数         |
| `imageStore.ts`           | 图片占位符系统，`image:ID` 替代 Base64 |


---

## 使用指南

### 普通用户

#### 首次启动

启动后显示欢迎页面，左侧文件树包含两个内置示例文件：

- **用户手册.md** — 编辑器功能使用指南
- **Markdown 入门教程.md** — Markdown 语法入门教程

双击文件即可打开编辑。

#### 文件操作


| 操作     | 方法                     |
| ------ | ---------------------- |
| 创建文件   | 点击侧边栏顶部 **+** 按钮       |
| 重命名    | 右键文件 → 重命名，或三点菜单 → 重命名 |
| 删除     | 右键文件 → 删除，确认对话框后执行     |
| 移动     | 拖拽文件到目标文件夹             |
| 快速打开   | `Ctrl+P` 输入文件名模糊搜索     |
| 打开本地文件 | 侧边栏「打开文件」按钮            |


#### 格式化操作


| 操作  | 快捷键            | 工具栏按钮 |
| --- | -------------- | ----- |
| 加粗  | `Ctrl+B`       | **B** |
| 斜体  | `Ctrl+I`       | *I*   |
| 代码块 | `Ctrl+Shift+K` | `</>` |
| 搜索  | `Ctrl+F`       | 搜索图标  |
| 替换  | `Ctrl+Shift+H` | 替换图标  |
| 缩进  | `Tab`          | —     |
| 反缩进 | `Shift+Tab`    | —     |
| 撤销  | `Ctrl+Z`       | —     |
| 重做  | `Ctrl+Shift+Z` | —     |


#### 写作模式

- **专注模式**：点击工具栏右侧「专注」按钮，隐藏所有面板，编辑区居中，当前行高亮、非当前行淡出
- **打字机模式**：点击工具栏右侧「打字机」按钮或 `Ctrl+Shift+T`，光标保持垂直居中，当前行蓝色竖线高亮

两种模式可独立组合使用，共 4 种工作状态。

#### 语法检查与修复

1. 编辑区中，有语法错误的行会显示波浪下划线和行尾圆点（红色=错误，黄色=警告）
2. 将鼠标悬停在状态栏的错误/警告计数上，弹出问题列表面板
3. 点击问题项可跳转到对应行
4. 可修复的问题右侧显示按钮，点击自动修复

#### 个人博客生成

1. 在欢迎页面或侧边栏点击「博客工作室」入口
2. 进入 Blog Studio 设计工作室
3. 在左侧「内容」Tab 中勾选需要包含的 Markdown 文档
4. 在左侧「风格」和「配色」Tab 中选择博客风格、配色、字体等
5. 中间区域实时预览博客效果，可切换桌面/平板/手机视图
6. 点击右侧「生成博客」按钮生成博客文件
7. 选择下载方式：单文件 HTML 或文件夹 ZIP

#### Front Matter 编辑

1. 打开包含 Front Matter 的 Markdown 文件
2. 编辑区上方自动显示 Front Matter 可视化编辑面板
3. 直接在面板中修改标题、日期、标签等元数据
4. 修改会实时同步到编辑区的 YAML 代码中

#### 导出文件

点击工具栏「另存为」按钮，选择保存位置和格式（Markdown / HTML / PDF）。

#### 插入图表

- **数学公式**：工具栏按钮，选择行内 `$...$` 或块级 `$$...$$`
- **Mermaid 图表**：工具栏「图表」按钮，插入流程图或思维导图代码块
- **表格**：工具栏「表格」按钮，快速插入或使用高级编辑器
- **脚注**：工具栏「脚注」按钮，自动生成脚注引用和定义

### 开发者

#### 二次开发

1. Fork 项目仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 开发并测试
4. 提交 PR

#### 添加博客主题风格

在 `src/modules/blog/blogThemeStyles.ts` 中：

1. 编写 `getXxxCss(isDark: boolean): string` 函数，返回完整 CSS 字符串
2. 在 `getThemeStyleCss()` 中添加新风格的分支
3. 在 `src/modules/blog/blogTemplates.ts` 的 `ThemeStyle` 联合类型中添加新 key
4. 在 `BlogStudio.tsx` 的 `THEME_STYLE_OPTIONS` 数组中添加选项
5. 在 `blogGenerator.ts` 的 `THEME_NAV_LABELS` 中添加导航标签

#### 添加语法检查规则

在 `src/modules/lint/markdownLinter.ts` 中：

1. 编写检查函数，签名为 `function checkXxx(text: string, lines: string[], issues: LintIssue[]): void`
2. 在 `lintMarkdown()` 函数中调用新规则
3. 如需支持自动修复，在 `fixIssue()` 函数中添加对应的修复逻辑

#### 模块结构约定

每个模块文件夹包含：

- 组件文件（`.tsx`）
- 工具函数文件（`.ts`，命名为 `xxxUtils.ts` 或描述性名称）
- 测试文件（`__tests__/` 子目录）

---

## API 文档

本项目为**纯前端应用**，无后端 API。所有数据存储在浏览器 localStorage 中。

### 数据存储结构

```typescript
// localStorage key: 'markdown-editor-data'
interface StorageData {
  version: string          // 存储版本号（当前 'v5'）
  rootFolder: FileNode     // 文件树根节点
  openTabs: Tab[]          // 打开的标签页
  activeTabId: string | null
}

// localStorage key: 'app-theme-preference'
type ThemePreference = 'dark' | 'light'
```

### Context API


| Context            | 位置                     | 主要方法                                                   |
| ------------------ | ---------------------- | ------------------------------------------------------ |
| ThemeContext       | `modules/settings/`    | `useTheme()` → `{ theme, toggleTheme }`                |
| FileManagerContext | `modules/fileManager/` | `useFileManager()` → 文件CRUD、标签页、搜索                     |
| ModalContext       | `modules/shared/`      | `useModal()` → `openInputModal`, `openCreateFileModal` |
| UndoRedoContext    | `modules/editor/`      | `useUndoRedo()` → `{ canUndo, canRedo, undo, redo }`   |


### 博客模块核心接口

```typescript
interface BlogConfig {
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

type ThemeStyle = 'magazine' | 'minimal' | 'classic'
  | 'ink-wash' | 'terminal' | 'newspaper'
  | 'glassmorphism' | 'bento' | 'narrative'
```

---

## 测试

```bash
# 运行所有测试（watch 模式）
npm run test

# 运行特定测试文件
npx vitest src/modules/outline/__tests__/outlineUtils.test.ts

# 生成覆盖率报告
npm run test:coverage

# 单次运行（CI 环境）
npx vitest run
```

### 测试覆盖范围


| 模块   | 测试文件                   | 覆盖内容                  |
| ---- | ---------------------- | --------------------- |
| 大纲工具 | `outlineUtils.test.ts` | 标题解析、嵌套结构、ID 生成、代码块过滤 |
| 大纲组件 | `Outline.test.tsx`     | 渲染、折叠/展开、跳转、性能        |


---

## 部署说明

### Vercel

```bash
npm i -g vercel
vercel
```

或通过 Vercel Dashboard 导入 Git 仓库，框架选择 **Vite**，自动部署。

### GitHub Pages

1. 修改 `vite.config.ts`：

```typescript
export default defineConfig({
  base: '/markdown-editor/',
  plugins: [react()]
})
```

1. 构建并部署：

```bash
npm run build
npx gh-pages -d dist
```

### Docker

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t markdown-editor .
docker run -p 8080:80 markdown-editor
```

---

## 已知问题与路线图

### 已知问题

- 部分浏览器不支持 File System Access API，「另存为」功能降级为 Blob 下载
- PDF 导出依赖 html2pdf.js，复杂布局可能出现分页问题
- `EditorOverlay.tsx` 为已弃用的 Canvas 叠加层，文件保留但未使用

### 路线图

- 云端同步（WebDAV / 自建后端）
- 移动端适配（响应式布局优化）
- 协作编辑（WebSocket + CRDT）
- 浏览器扩展（Chrome / Firefox）
- SEO 搜索引擎优化
- AEO 答案引擎优化
- GitHub Pages 一键部署博客
- Hexo 主题融合方案
- 更多博客风格主题
- PWA 离线支持
- 国际化（i18n）

---

## 贡献指南

### 开发流程

1. **Fork** 项目仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 编写代码并添加测试
4. 确保通过 lint 检查：`npm run lint`
5. 确保通过测试：`npm run test`
6. 提交更改：`git commit -m 'feat: add some feature'`
7. 推送分支：`git push origin feature/your-feature`
8. 提交 **Pull Request**

### 提交规范


| 前缀          | 说明        |
| ----------- | --------- |
| `feat:`     | 新功能       |
| `fix:`      | 修复 Bug    |
| `refactor:` | 重构（不改变功能） |
| `docs:`     | 文档更新      |
| `test:`     | 测试相关      |
| `chore:`    | 构建/工具变更   |


### 代码规范

- 使用 TypeScript strict 模式
- 遵循 ESLint 配置（`npm run lint`）
- 组件使用**函数式组件 + Hooks**
- 样式优先使用 CSS 变量（`var(--xxx)`），确保主题兼容
- 布局使用 CSS Grid + `min-h-0` 约束链，确保滚动正常
- 新增功能需添加对应的测试用例
- 新增模块放置在 `src/modules/` 对应子目录下

---

## 许可证

[MIT License](https://opensource.org/licenses/MIT)

Copyright © 2026 Markdown Editor Contributors

---

## 鸣谢

本项目依赖以下优秀的开源项目：


| 项目                                                      | 说明                  |
| ------------------------------------------------------- | ------------------- |
| [React](https://react.dev/)                             | 用户界面构建库             |
| [TypeScript](https://www.typescriptlang.org/)           | 类型安全的 JavaScript 超集 |
| [Vite](https://vitejs.dev/)                             | 下一代前端构建工具           |
| [Tailwind CSS](https://tailwindcss.com/)                | 原子化 CSS 框架          |
| [marked](https://marked.js.org/)                        | Markdown 解析器        |
| [highlight.js](https://highlightjs.org/)                | 代码语法高亮              |
| [KaTeX](https://katex.org/)                             | 数学公式渲染              |
| [Mermaid](https://mermaid.js.org/)                      | 图表和流程图渲染            |
| [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) | 客户端 PDF 生成          |
| [Turndown](https://github.com/mixmark-io/turndown)      | HTML → Markdown 转换  |
| [Vitest](https://vitest.dev/)                           | Vite 原生测试框架         |


