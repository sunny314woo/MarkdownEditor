import { FileNode, FileManagerState } from '../../types/fileManager';

const STORAGE_KEY = 'markdown-editor-file-manager';
const STORAGE_VERSION = 'v5';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createInitialFileTree(): FileNode {
  return {
    id: 'root',
    name: '文件管理器',
    type: 'folder',
    children: [
      {
        id: generateId(),
        name: '我的笔记',
        type: 'folder',
        children: [
          {
            id: generateId(),
            name: '用户手册.md',
            type: 'file',
            content: `# Markdown 编辑器 — 用户手册

欢迎使用 Markdown 编辑器！本手册将详细介绍编辑器的所有功能，帮助您快速上手并高效使用。

---

## 1. 界面布局

编辑器界面由以下几个区域组成：

| 区域 | 位置 | 功能 |
|------|------|------|
| 文件列表 | 左侧 | 管理文件夹和文档，支持创建、重命名、删除 |
| 编辑区 | 中间 | Markdown 文本编辑，支持语法高亮和快捷操作 |
| 预览区 | 右侧 | 实时渲染 Markdown 内容，与编辑区滚动同步 |
| 大纲导航 | 最右侧 | 显示文档标题结构，点击可快速跳转 |
| 工具栏 | 编辑区顶部 | 提供格式化、文件操作等快捷按钮 |

> 💡 您可以通过侧边栏的切换按钮来显示或隐藏文件列表和大纲导航，也可以通过工具栏的"关闭预览"按钮切换纯编辑模式。

---

## 2. 文件管理

### 2.1 创建文件

1. 点击文件列表顶部的 📄 按钮，或右键文件夹选择"新建文件"
2. 在弹出的对话框中输入文件名
3. 选择目标文件夹
4. 点击"确认创建"即可

### 2.2 创建文件夹

1. 点击文件列表顶部的 📁 按钮，或右键文件夹选择"新建文件夹"
2. 输入文件夹名称并确认

### 2.3 文件操作

- **打开文件**：单击文件列表中的文件
- **重命名**：右键文件或文件夹，选择"重命名"
- **删除**：右键文件或文件夹，选择"删除"
- **多标签页**：打开多个文件时，顶部标签栏可快速切换

### 2.4 另存为

点击工具栏的"另存为"按钮，可将当前文档保存为 \`.md\` 文件到本地磁盘。

---

## 3. 文本编辑基础

### 3.1 编辑操作

编辑区是一个功能完整的文本编辑器，支持：

- 常规文本输入和编辑
- 鼠标选中文本进行操作
- 多光标编辑（按住 Alt 点击）
- 拖拽图片直接插入

### 3.2 撤销与重做

| 操作 | 快捷键 | 说明 |
|------|--------|------|
| 撤销 | \`Ctrl+Z\` | 撤销上一步编辑操作 |
| 重做 | \`Ctrl+Y\` | 重做已撤销的操作 |
| 重做（Mac） | \`Ctrl+Shift+Z\` | Mac 风格的重做快捷键 |

> 💡 编辑器最多记录 100 步操作历史。

### 3.3 查找与替换

| 操作 | 快捷键 | 说明 |
|------|--------|------|
| 查找 | \`Ctrl+F\` | 打开搜索栏，输入关键词查找 |
| 替换 | \`Ctrl+Shift+H\` | 打开替换栏，支持批量替换 |

---

## 4. 格式化功能

工具栏提供了丰富的格式化按钮，也可以使用快捷键快速操作。

### 4.1 标题

点击工具栏的标题按钮，或在行首输入 \`#\` 加空格：

\`\`\`markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
\`\`\`

> 💡 多次点击标题按钮可循环切换标题级别（H1 → H2 → ... → H6 → 取消标题）。

### 4.2 文本样式

| 样式 | 快捷键 | Markdown 语法 | 效果 |
|------|--------|---------------|------|
| 加粗 | \`Ctrl+B\` | \`**文本**\` | **文本** |
| 斜体 | \`Ctrl+I\` | \`*文本*\` | *文本* |
| 行内代码 | — | \`\\\`代码\\\`\` | \`代码\` |

### 4.3 列表

**无序列表**：点击工具栏按钮或在行首输入 \`- \`

\`\`\`markdown
- 项目一
- 项目二
  - 子项目
\`\`\`

**有序列表**：点击工具栏按钮或在行首输入 \`1. \`

\`\`\`markdown
1. 第一步
2. 第二步
3. 第三步
\`\`\`

### 4.4 引用

点击工具栏的引用按钮，或在行首输入 \`> \`：

\`\`\`markdown
> 这是一段引用文字
> 可以跨越多行
\`\`\`

### 4.5 代码块

点击工具栏的代码块按钮，选择编程语言：

\`\`\`markdown
\\\`\\\`\\\`javascript
function hello() {
  console.log("Hello, World!");
}
\\\`\\\`\\\`
\`\`\`

支持的语言包括：JavaScript、TypeScript、Python、Java、C/C++、C#、Go、Rust、Ruby、PHP、Swift、Kotlin、SQL、Shell/Bash、HTML、CSS、JSON、YAML、XML 等。

> 💡 快捷键 \`Ctrl+Shift+K\` 可快速插入代码块。

### 4.6 水平分割线

点击工具栏的水平线按钮，或输入 \`---\`：

\`\`\`markdown
---
\`\`\`

### 4.7 链接

点击工具栏的链接按钮，或使用以下语法：

\`\`\`markdown
[链接文字](https://example.com)
\`\`\`

### 4.8 表格

点击工具栏的表格按钮，可快速插入表格：

\`\`\`markdown
| 列1 | 列2 | 列3 |
|------|------|------|
| 内容 | 内容 | 内容 |
\`\`\`

### 4.9 特殊符号

点击工具栏的 😊 按钮，打开 Emoji 选择器，点击即可插入表情符号。

### 4.10 思维导图

点击工具栏的 📊 按钮，插入 Mermaid 思维导图：

\`\`\`markdown
\\\`\\\`\\\`mermaid
mindmap
  root((中心主题))
    子主题1
    子主题2
      孙主题1
      孙主题2
\\\`\\\`\\\`
\`\`\`

---

## 5. 高级功能

### 5.1 实时预览

编辑区的内容会实时渲染到预览区，支持：

- **滚动同步**：编辑区和预览区滚动位置自动同步
- **大纲联动**：预览区当前可见标题在大纲中高亮显示
- **预览切换**：点击工具栏"关闭预览/打开预览"按钮切换

### 5.2 大纲导航

大纲面板显示文档的标题结构：

- 点击标题可快速跳转到对应位置
- 当前可见标题会自动高亮
- 点击右侧切换按钮可显示/隐藏大纲

### 5.3 自动保存

编辑器会自动保存您的内容：

- 每次编辑后自动保存到浏览器本地存储
- 刷新页面后内容不会丢失
- 关闭浏览器后重新打开，数据依然保留

### 5.4 图片上传

支持以下方式插入图片：

- 点击工具栏的"上传图片"按钮选择本地图片
- 直接拖拽图片到编辑区
- 支持 JPG、PNG、GIF、WebP、BMP、SVG 格式
- 图片大小限制为 2MB

### 5.5 主题切换

编辑器支持深色和浅色两种主题：

- 在欢迎界面或预览区顶部点击主题切换按钮
- 主题偏好会自动保存

---

## 6. 快捷键列表

### 6.1 编辑操作

| 快捷键 | 功能 |
|--------|------|
| \`Ctrl+Z\` | 撤销 |
| \`Ctrl+Y\` | 重做 |
| \`Ctrl+Shift+Z\` | 重做（Mac 风格） |
| \`Ctrl+F\` | 查找 |
| \`Ctrl+Shift+H\` | 替换 |

### 6.2 格式化操作

| 快捷键 | 功能 |
|--------|------|
| \`Ctrl+B\` | 加粗 |
| \`Ctrl+I\` | 斜体 |
| \`Ctrl+Shift+K\` | 代码块 |

---

## 7. 常见问题

### Q: 编辑的内容会丢失吗？

不会。编辑器会自动将内容保存到浏览器本地存储，刷新页面或关闭浏览器后重新打开，内容都会保留。

### Q: 如何在文件夹之间移动文件？

目前可以通过以下方式：先在目标文件夹中创建新文件，然后将原文件内容复制过去，最后删除原文件。

### Q: 支持哪些 Markdown 语法？

编辑器支持标准 Markdown 语法（GFM），包括标题、加粗、斜体、列表、代码块、引用、表格、链接、图片、水平线等，还支持 Mermaid 思维导图和流程图。

### Q: 预览区可以编辑吗？

预览区主要用于查看渲染效果，不支持直接编辑。请在左侧编辑区修改内容，预览区会自动更新。

### Q: 如何切换深色/浅色主题？

在欢迎界面或预览区顶部找到主题切换按钮（☀️/🌙），点击即可切换。

---

> 📌 如果您有任何问题或建议，欢迎反馈！祝您使用愉快！`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: generateId(),
            name: 'Markdown 入门教程.md',
            type: 'file',
            content: `# Markdown 入门教程

欢迎来到 Markdown 的世界！🎉

Markdown 是一种**轻量级标记语言**，让您用简单的符号就能写出格式优美的文档。本教程将带您从零开始，一步步掌握 Markdown 的核心语法。

---

## 第一章：什么是 Markdown？

Markdown 由约翰·格鲁伯（John Gruber）于 2004 年创建，它的设计理念是：

> 让文档易读易写，同时可以转换为 HTML 等格式。

**为什么学习 Markdown？**

- ✍️ **简单易学**：只需记住几个符号就能写出漂亮的文档
- 📝 **专注内容**：不用分心调整格式，专注于写作本身
- 🌍 **广泛使用**：GitHub、博客、文档、笔记等场景都在用
- 🔄 **通用兼容**：纯文本格式，任何编辑器都能打开

---

## 第二章：标题

在行首添加 \`#\` 号即可创建标题，\`#\` 的数量代表标题级别：

\`\`\`markdown
# 一级标题（最大）
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题（最小）
\`\`\`

> 💡 通常一篇文章只用一次一级标题，作为文章标题。正文从二级标题开始。

**小技巧**：还可以用 \`===\` 和 \`---\` 来创建一级和二级标题：

\`\`\`markdown
这是一级标题
===

这是二级标题
---
\`\`\`

---

## 第三章：段落与换行

### 3.1 段落

在 Markdown 中，**一个空行**分隔两个段落：

\`\`\`markdown
这是第一段。

这是第二段。
\`\`\`

### 3.2 换行

在行尾加**两个空格**再回车，或者在行尾加 \`<br>\`，可以实现换行：

\`\`\`markdown
第一行  
第二行
\`\`\`

> ⚠️ 注意：只按回车不会换行，两行文字会被合并为一行。

---

## 第四章：文本样式

### 4.1 加粗

用两个 \`*\` 或 \`_\` 包围文字：

\`\`\`markdown
**这是加粗文字**
__这也是加粗文字__
\`\`\`

效果：**这是加粗文字**

### 4.2 斜体

用一个 \`*\` 或 \`_\` 包围文字：

\`\`\`markdown
*这是斜体文字*
_这也是斜体文字_
\`\`\`

效果：*这是斜体文字*

### 4.3 加粗 + 斜体

组合使用三个 \`*\`：

\`\`\`markdown
***加粗且斜体***
\`\`\`

效果：***加粗且斜体***

### 4.4 删除线

用两个 \`~\` 包围文字：

\`\`\`markdown
~~这是删除线~~
\`\`\`

效果：~~这是删除线~~

### 4.5 行内代码

用反引号 \\\` 包围代码：

\`\`\`markdown
使用 \`console.log()\` 输出信息
\`\`\`

效果：使用 \`console.log()\` 输出信息

---

## 第五章：列表

### 5.1 无序列表

用 \`-\`、\`*\` 或 \`+\` 加空格：

\`\`\`markdown
- 苹果
- 香蕉
- 橙子
\`\`\`

效果：

- 苹果
- 香蕉
- 橙子

### 5.2 有序列表

用数字加点加空格：

\`\`\`markdown
1. 打开编辑器
2. 编写内容
3. 保存文件
\`\`\`

效果：

1. 打开编辑器
2. 编写内容
3. 保存文件

### 5.3 嵌套列表

用缩进（2 或 4 个空格）创建子列表：

\`\`\`markdown
- 水果
  - 苹果
  - 香蕉
- 蔬菜
  - 西红柿
  - 黄瓜
\`\`\`

效果：

- 水果
  - 苹果
  - 香蕉
- 蔬菜
  - 西红柿
  - 黄瓜

### 5.4 任务列表

用 \`[ ]\` 和 \`[x]\` 创建待办事项：

\`\`\`markdown
- [x] 学习 Markdown 基础语法
- [x] 了解标题和段落
- [ ] 学习高级语法
- [ ] 完成练习
\`\`\`

效果：

- [x] 学习 Markdown 基础语法
- [x] 了解标题和段落
- [ ] 学习高级语法
- [ ] 完成练习

---

## 第六章：链接与图片

### 6.1 链接

\`\`\`markdown
[显示文字](网址)
\`\`\`

示例：

\`\`\`markdown
[访问 GitHub](https://github.com)
\`\`\`

效果：[访问 GitHub](https://github.com)

### 6.2 图片

图片语法和链接类似，只需在前面加 \`!\`：

\`\`\`markdown
![图片描述](图片地址)
\`\`\`

示例：

\`\`\`markdown
![Logo](https://example.com/logo.png)
\`\`\`

> 💡 图片描述是可选的，当图片无法加载时会显示这段文字。

---

## 第七章：引用

用 \`>\` 创建引用块：

\`\`\`markdown
> 这是一段引用
> 可以写多行
\`\`\`

效果：

> 这是一段引用
> 可以写多行

**嵌套引用**：

\`\`\`markdown
> 一级引用
> > 二级引用
> > > 三级引用
\`\`\`

---

## 第八章：代码块

### 8.1 行内代码

用反引号包围：

\`\`\`markdown
使用 \`print()\` 函数输出
\`\`\`

效果：使用 \`print()\` 函数输出

### 8.2 代码块

用三个反引号包围，可以指定语言实现语法高亮：

\\\`\\\`\\\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\\\`\\\`\\\`

**常用语言标识**：

| 语言 | 标识 |
|------|------|
| JavaScript | \`javascript\` 或 \`js\` |
| Python | \`python\` 或 \`py\` |
| HTML | \`html\` |
| CSS | \`css\` |
| Java | \`java\` |
| C/C++ | \`c\` / \`cpp\` |
| SQL | \`sql\` |
| Shell | \`bash\` 或 \`shell\` |
| JSON | \`json\` |

---

## 第九章：表格

用 \`|\` 分隔列，用 \`-\` 分隔表头和内容：

\`\`\`markdown
| 姓名 | 年龄 | 城市 |
|------|------|------|
| 小明 | 25   | 北京 |
| 小红 | 22   | 上海 |
| 小刚 | 28   | 广州 |
\`\`\`

效果：

| 姓名 | 年龄 | 城市 |
|------|------|------|
| 小明 | 25   | 北京 |
| 小红 | 22   | 上海 |
| 小刚 | 28   | 广州 |

### 对齐方式

用 \`:\` 控制对齐：

\`\`\`markdown
| 左对齐 | 居中 | 右对齐 |
|:-------|:----:|-------:|
| 内容   | 内容 | 内容   |
\`\`\`

效果：

| 左对齐 | 居中 | 右对齐 |
|:-------|:----:|-------:|
| 内容   | 内容 | 内容   |

---

## 第十章：分隔线

用三个或更多的 \`-\`、\`*\` 或 \`_\` 创建分隔线：

\`\`\`markdown
---
***
___
\`\`\`

效果：

---

---

## 第十一章：转义字符

如果想在文档中显示 Markdown 的特殊符号，用 \`\\\` 转义：

\`\`\`markdown
\\*这不是斜体\\*
\\# 这不是标题
\`\`\`

效果：

\\*这不是斜体\\*
\\# 这不是标题

**需要转义的字符**：

\`\\\`   \`   *   _   {}   []   ()   #   +   -   .   !   |\`

---

## 第十二章：实用技巧

### 12.1 快速创建文档结构

\`\`\`markdown
# 项目名称

## 简介

简要描述项目...

## 安装

\\\`\\\`\\\`bash
npm install
\\\`\\\`\\\`

## 使用方法

1. 步骤一
2. 步骤二

## 常见问题

> Q: 如何...
> A: 可以...
\`\`\`

### 12.2 写作建议

- 📌 **先写内容，再调格式**：Markdown 的优势就是专注内容
- 📌 **善用标题层级**：保持 H1 → H2 → H3 的逻辑结构
- 📌 **代码用代码块**：不要用截图，代码块可以复制
- 📌 **表格不宜太宽**：列太多会影响阅读体验
- 📌 **预览确认效果**：写完后切换到预览模式检查

### 12.3 常见问题

**Q: 空行不生效怎么办？**

确保段落之间有一个完全空白的行（没有任何空格）。

**Q: 列表项之间有空隙怎么办？**

列表项之间不要加空行，连续写就不会有额外间距。

**Q: 代码块里的反引号怎么写？**

用更多数量的反引号包围，例如用四个反引号包围含三个反引号的内容。

**Q: 表格太复杂写不好怎么办？**

先用简单的格式写，再逐步调整对齐。也可以使用在线表格生成工具。

---

## 恭喜您！🎉

您已经掌握了 Markdown 的核心语法！现在就开始练习吧：

1. 试着创建一个新文件
2. 用标题、列表、代码块写一篇笔记
3. 切换到预览模式查看效果

> 📌 记住：最好的学习方式就是动手实践！`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isExpanded: true,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isExpanded: true,
  };
}

export function loadState(): FileManagerState {
  const initialTree = createInitialFileTree();
  
  const defaultState: FileManagerState = {
    rootFolder: initialTree,
    tabs: [],
    activeTabId: null,
    searchQuery: '',
    sidebarVisible: true,
  };

  try {
     const savedVersion = localStorage.getItem(STORAGE_KEY + '-version');
     if (savedVersion !== STORAGE_VERSION) {
       localStorage.removeItem(STORAGE_KEY);
       localStorage.setItem(STORAGE_KEY + '-version', STORAGE_VERSION);
       return defaultState;
     }
     const saved = localStorage.getItem(STORAGE_KEY);
     if (saved) {
       const parsed = JSON.parse(saved) as FileManagerState;
       if (parsed.rootFolder && parsed.rootFolder.children && parsed.rootFolder.children.length > 0) {
         return parsed;
       }
     }
   } catch (error) {
     // eslint-disable-next-line no-console
     console.error('Failed to load file manager state:', error);
   }
  
  return defaultState;
}

export function saveState(state: FileManagerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save file manager state:', error);
  }
}

export function findNode(root: FileNode, id: string): FileNode | null {
  if (root.id === id) return root;
  
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  
  return null;
}

export function findParentNode(root: FileNode, id: string): FileNode | null {
  if (root.children) {
    for (const child of root.children) {
      if (child.id === id) return root;
      const found = findParentNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

export function updateNodeContent(root: FileNode, id: string, content: string): FileNode {
  if (root.id === id) {
    return {
      ...root,
      content,
      updatedAt: Date.now(),
    };
  }
  
  if (root.children) {
    return {
      ...root,
      children: root.children.map(child => updateNodeContent(child, id, content)),
    };
  }
  
  return root;
}

export function searchFiles(root: FileNode, query: string): FileNode[] {
  const results: FileNode[] = [];
  const searchLower = query.toLowerCase();
  
  const searchRecursive = (node: FileNode) => {
    if (node.type === 'file' && node.name.toLowerCase().includes(searchLower)) {
      results.push(node);
    }
    
    if (node.children) {
      node.children.forEach(searchRecursive);
    }
  };
  
  searchRecursive(root);
  return results;
}
