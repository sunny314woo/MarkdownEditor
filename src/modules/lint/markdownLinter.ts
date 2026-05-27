export interface LintIssue {
  line: number;
  startCol: number;
  endCol: number;
  severity: 'error' | 'warning';
  message: string;
  suggestion: string;
}

export function lintMarkdown(text: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = text.split('\n');

  checkUnclosedCodeBlocks(lines, issues);
  checkLinks(text, lines, issues);
  checkHeadings(lines, issues);
  checkListFormat(lines, issues);
  checkUnclosedInlineCode(text, lines, issues);
  checkImages(text, lines, issues);
  checkHorizontalRules(lines, issues);

  return issues;
}

function checkUnclosedCodeBlocks(lines: string[], issues: LintIssue[]) {
  let inCodeBlock = false;
  let codeBlockStartLine = -1;
  let codeBlockFence = '';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockStartLine = i;
        codeBlockFence = trimmed.substring(0, 3);
      } else {
        const fence = trimmed.substring(0, 3);
        if (fence === codeBlockFence) {
          inCodeBlock = false;
        }
      }
    }
  }

  if (inCodeBlock) {
    const line = lines[codeBlockStartLine];
    const startCol = line.indexOf(codeBlockFence);
    issues.push({
      line: codeBlockStartLine,
      startCol,
      endCol: startCol + codeBlockFence.length,
      severity: 'error',
      message: '未闭合的代码块',
      suggestion: `在代码块末尾添加 "${codeBlockFence}" 来闭合代码块`,
    });
  }
}

function checkLinks(text: string, lines: string[], issues: LintIssue[]) {
  const inCodeBlock = isInsideCodeBlock(text);

  const incompleteLinkPattern = /\[([^\]]*)\]\(/g;
  const emptyLinkPattern = /\[\s*\]\([^)]*\)/g;
  const emptyUrlPattern = /\[([^\]]+)\]\(\s*\)/g;
  const orphanBracketPattern = /\[([^\]]{1,50})\](?!\(|\[)/g;

  let match: RegExpExecArray | null;

  incompleteLinkPattern.lastIndex = 0;
  while ((match = incompleteLinkPattern.exec(text)) !== null) {
    const pos = match.index;
    const afterParen = text.substring(pos + match[0].length, pos + match[0].length + 50);
    const hasClosingParen = afterParen.includes(')');

    if (!hasClosingParen) {
      if (isPositionInCodeBlock(pos, inCodeBlock)) continue;
      const { line, col } = getLineAndCol(text, pos);
      issues.push({
        line,
        startCol: col,
        endCol: col + match[0].length,
        severity: 'error',
        message: '链接格式不完整：缺少右括号 ")"',
        suggestion: '补全链接地址并添加右括号，如 [文字](url)',
      });
    }
  }

  emptyLinkPattern.lastIndex = 0;
  while ((match = emptyLinkPattern.exec(text)) !== null) {
    if (isPositionInCodeBlock(match.index, inCodeBlock)) continue;
    const { line, col } = getLineAndCol(text, match.index);
    issues.push({
      line,
      startCol: col,
      endCol: col + match[0].length,
      severity: 'warning',
      message: '链接文字为空',
      suggestion: '在方括号内添加链接描述文字，如 [描述](url)',
    });
  }

  emptyUrlPattern.lastIndex = 0;
  while ((match = emptyUrlPattern.exec(text)) !== null) {
    if (isPositionInCodeBlock(match.index, inCodeBlock)) continue;
    const { line, col } = getLineAndCol(text, match.index);
    issues.push({
      line,
      startCol: col,
      endCol: col + match[0].length,
      severity: 'error',
      message: '链接地址为空',
      suggestion: '在圆括号内添加链接地址，如 [文字](https://example.com)',
    });
  }

  orphanBracketPattern.lastIndex = 0;
  while ((match = orphanBracketPattern.exec(text)) !== null) {
    if (isPositionInCodeBlock(match.index, inCodeBlock)) continue;
    const before = text.substring(Math.max(0, match.index - 1), match.index);
    if (before === '!' || before === '[') continue;

    const content = match[1];
    if (content.includes(']') || content.length > 40) continue;

    const { line, col } = getLineAndCol(text, match.index);
    const lineText = lines[line];
    if (lineText && lineText.trimStart().startsWith('[')) continue;

    issues.push({
      line,
      startCol: col,
      endCol: col + match[0].length,
      severity: 'warning',
      message: '可能的未完成链接：方括号后缺少圆括号',
      suggestion: '如果是链接，请添加 (url)；如果是普通文本，可忽略此提示',
    });
  }
}

function checkHeadings(lines: string[], issues: LintIssue[]) {
  let lastHeadingLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    const headingMatch = trimmed.match(/^(#{1,6})\s/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const startCol = lines[i].indexOf('#');

      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        issues.push({
          line: i,
          startCol,
          endCol: startCol + headingMatch[1].length,
          severity: 'warning',
          message: `标题层级跳跃：从 H${lastHeadingLevel} 直接跳到 H${level}`,
          suggestion: `建议在 H${lastHeadingLevel} 和 H${level} 之间添加 H${lastHeadingLevel + 1} 标题`,
        });
      }

      const afterHash = trimmed.substring(headingMatch[1].length);
      if (!afterHash.startsWith(' ')) {
        issues.push({
          line: i,
          startCol,
          endCol: startCol + headingMatch[1].length,
          severity: 'warning',
          message: '# 号后缺少空格',
          suggestion: '在 # 号和标题文字之间添加一个空格，如 "# 标题"',
        });
      }

      const headingText = trimmed.substring(headingMatch[1].length).trim();
      if (!headingText) {
        issues.push({
          line: i,
          startCol,
          endCol: startCol + headingMatch[1].length + 1,
          severity: 'error',
          message: '标题内容为空',
          suggestion: '在 # 号后添加标题文字',
        });
      }

      lastHeadingLevel = level;
    }
  }
}

function checkListFormat(lines: string[], issues: LintIssue[]) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    const unorderedMatch = trimmed.match(/^([-*+])([^ ])/);
    if (unorderedMatch) {
      const indent = line.length - trimmed.length;
      issues.push({
        line: i,
        startCol: indent + 1,
        endCol: indent + 1 + unorderedMatch[2].length,
        severity: 'warning',
        message: `列表标记 "${unorderedMatch[1]}" 后缺少空格`,
        suggestion: `在列表标记后添加空格，如 "${unorderedMatch[1]} 项目"`,
      });
    }

    const orderedMatch = trimmed.match(/^(\d+\.)([^ ])/);
    if (orderedMatch) {
      const indent = line.length - trimmed.length;
      issues.push({
        line: i,
        startCol: indent + orderedMatch[1].length,
        endCol: indent + orderedMatch[1].length + orderedMatch[2].length,
        severity: 'warning',
        message: '有序列表标记后缺少空格',
        suggestion: `在列表标记后添加空格，如 "${orderedMatch[1]} 项目"`,
      });
    }

    const mixedIndent = line.match(/^( +\t|\t +)/);
    if (mixedIndent) {
      issues.push({
        line: i,
        startCol: 0,
        endCol: mixedIndent[0].length,
        severity: 'warning',
        message: '缩进混用了空格和制表符',
        suggestion: '统一使用空格或制表符进行缩进',
      });
    }
  }
}

function checkUnclosedInlineCode(text: string, _lines: string[], issues: LintIssue[]) {
  const inCodeBlock = isInsideCodeBlock(text);
  let count = 0;
  let lastBacktickPos = -1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '`' && (i === 0 || text[i - 1] !== '\\')) {
      if (i + 2 < text.length && text[i + 1] === '`' && text[i + 2] === '`') {
        i += 2;
        continue;
      }
      count++;
      lastBacktickPos = i;
    }
  }

  if (count % 2 !== 0 && lastBacktickPos >= 0) {
    if (isPositionInCodeBlock(lastBacktickPos, inCodeBlock)) return;
    const { line, col } = getLineAndCol(text, lastBacktickPos);
    issues.push({
      line,
      startCol: col,
      endCol: col + 1,
      severity: 'error',
      message: '未闭合的行内代码：反引号数量为奇数',
      suggestion: '添加一个反引号 ` 来闭合行内代码',
    });
  }
}

function checkImages(text: string, _lines: string[], issues: LintIssue[]) {
  const inCodeBlock = isInsideCodeBlock(text);

  const incompleteImagePattern = /!\[([^\]]*)\]\(/g;

  let match: RegExpExecArray | null;

  incompleteImagePattern.lastIndex = 0;
  while ((match = incompleteImagePattern.exec(text)) !== null) {
    const pos = match.index;
    const afterParen = text.substring(pos + match[0].length, pos + match[0].length + 100);
    const hasClosingParen = afterParen.includes(')');

    if (!hasClosingParen) {
      if (isPositionInCodeBlock(pos, inCodeBlock)) continue;
      const { line, col } = getLineAndCol(text, pos);
      issues.push({
        line,
        startCol: col,
        endCol: col + match[0].length,
        severity: 'error',
        message: '图片格式不完整：缺少右括号 ")"',
        suggestion: '补全图片地址并添加右括号，如 ![描述](url)',
      });
    }
  }

  const emptyImageAlt = /!\[\s*\]\((image:[^)]+|[^)]*)\)/g;
  emptyImageAlt.lastIndex = 0;
  while ((match = emptyImageAlt.exec(text)) !== null) {
    if (isPositionInCodeBlock(match.index, inCodeBlock)) continue;
    const urlMatch = match[0].match(/\]\(([^)]*)\)/);
    if (urlMatch && urlMatch[1].startsWith('image:')) continue;
    const { line, col } = getLineAndCol(text, match.index);
    issues.push({
      line,
      startCol: col,
      endCol: col + match[0].length,
      severity: 'warning',
      message: '图片缺少替代文字',
      suggestion: '在方括号内添加图片描述，如 ![图片描述](url)，有助于无障碍访问',
    });
  }
}

function checkHorizontalRules(lines: string[], issues: LintIssue[]) {
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length >= 3 && /^[*\-_]+$/.test(trimmed)) {
      const chars = new Set(trimmed.split(''));
      if (chars.size > 1) {
        issues.push({
          line: i,
          startCol: lines[i].indexOf(trimmed),
          endCol: lines[i].indexOf(trimmed) + trimmed.length,
          severity: 'warning',
          message: '水平分割线混用了不同字符',
          suggestion: '水平分割线应使用同一种字符，如 --- 或 *** 或 ___',
        });
      }
    }
  }
}

function isInsideCodeBlock(text: string): boolean[] {
  const positions = new Array(text.length).fill(false);
  let inBlock = false;
  let blockStart = 0;

  for (let i = 0; i < text.length; i++) {
    if (i === 0 || text[i - 1] === '\n') {
      const rest = text.substring(i);
      if (rest.startsWith('```') || rest.startsWith('~~~')) {
        if (!inBlock) {
          inBlock = true;
          blockStart = i;
        } else {
          inBlock = false;
          for (let j = blockStart; j <= i + 3 && j < text.length; j++) {
            positions[j] = true;
          }
        }
      }
    }
    if (inBlock && i >= blockStart) {
      positions[i] = true;
    }
  }

  return positions;
}

function isPositionInCodeBlock(pos: number, codeBlockMap: boolean[]): boolean {
  return pos >= 0 && pos < codeBlockMap.length && codeBlockMap[pos];
}

function getLineAndCol(text: string, pos: number): { line: number; col: number } {
  let line = 0;
  let lastNewline = -1;

  for (let i = 0; i < pos && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      lastNewline = i;
    }
  }

  return { line, col: pos - lastNewline - 1 };
}

export function fixIssue(content: string, issue: LintIssue): string | null {
  const lines = content.split('\n');
  const lineText = lines[issue.line];
  if (lineText === undefined) return null;

  if (issue.message === '未闭合的代码块') {
    return content + '\n```';
  }

  if (issue.message === '链接格式不完整：缺少右括号 ")"') {
    const inCodeBlock = isInsideCodeBlock(content);
    const incompleteLinkPattern = /\[([^\]]*)\]\(/g;
    let match: RegExpExecArray | null;
    incompleteLinkPattern.lastIndex = 0;
    while ((match = incompleteLinkPattern.exec(content)) !== null) {
      const pos = match.index;
      const afterParen = content.substring(pos + match[0].length, pos + match[0].length + 50);
      const hasClosingParen = afterParen.includes(')');
      if (!hasClosingParen) {
        if (isPositionInCodeBlock(pos, inCodeBlock)) continue;
        const { line, col } = getLineAndCol(content, pos);
        if (line === issue.line && col === issue.startCol) {
          return content.substring(0, pos + match[0].length) + ')' + content.substring(pos + match[0].length);
        }
      }
    }
    return null;
  }

  if (issue.message === '链接文字为空') {
    return null;
  }

  if (issue.message === '链接地址为空') {
    return null;
  }

  if (issue.message === '可能的未完成链接：方括号后缺少圆括号') {
    return null;
  }

  if (issue.message === '# 号后缺少空格') {
    const headingMatch = lineText.match(/^(#{1,6})([^#\s])/);
    if (headingMatch) {
      const hashPart = headingMatch[1];
      const insertPos = lineText.indexOf(hashPart) + hashPart.length;
      lines[issue.line] = lineText.substring(0, insertPos) + ' ' + lineText.substring(insertPos);
      return lines.join('\n');
    }
    return null;
  }

  if (issue.message.startsWith('标题层级跳跃')) {
    return null;
  }

  if (issue.message === '标题内容为空') {
    return null;
  }

  if (issue.message.includes('列表标记') && issue.message.includes('后缺少空格')) {
    const trimmed = lineText.trimStart();
    const indent = lineText.length - trimmed.length;
    const unorderedMatch = trimmed.match(/^([-*+])([^ ])/);
    if (unorderedMatch) {
      const markerPos = indent + 1;
      lines[issue.line] = lineText.substring(0, markerPos) + ' ' + lineText.substring(markerPos);
      return lines.join('\n');
    }
    const orderedMatch = trimmed.match(/^(\d+\.)([^ ])/);
    if (orderedMatch) {
      const markerEnd = indent + orderedMatch[1].length;
      lines[issue.line] = lineText.substring(0, markerEnd) + ' ' + lineText.substring(markerEnd);
      return lines.join('\n');
    }
    return null;
  }

  if (issue.message === '缩进混用了空格和制表符') {
    const mixedIndent = lineText.match(/^( +\t|\t +)/);
    if (mixedIndent) {
      const newIndent = mixedIndent[0].replace(/\t/g, '  ');
      lines[issue.line] = newIndent + lineText.substring(mixedIndent[0].length);
      return lines.join('\n');
    }
    return null;
  }

  if (issue.message === '未闭合的行内代码：反引号数量为奇数') {
    const inCodeBlock = isInsideCodeBlock(content);
    let count = 0;
    let lastBacktickPos = -1;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '`' && (i === 0 || content[i - 1] !== '\\')) {
        if (i + 2 < content.length && content[i + 1] === '`' && content[i + 2] === '`') {
          i += 2;
          continue;
        }
        count++;
        lastBacktickPos = i;
      }
    }
    if (count % 2 !== 0 && lastBacktickPos >= 0) {
      if (isPositionInCodeBlock(lastBacktickPos, inCodeBlock)) return null;
      const { line } = getLineAndCol(content, lastBacktickPos);
      if (line === issue.line) {
        const lineEnd = content.indexOf('\n', lastBacktickPos);
        const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
        return content.substring(0, actualLineEnd) + '`' + content.substring(actualLineEnd);
      }
    }
    return null;
  }

  if (issue.message === '图片格式不完整：缺少右括号 ")"') {
    const inCodeBlock = isInsideCodeBlock(content);
    const incompleteImagePattern = /!\[([^\]]*)\]\(/g;
    let match: RegExpExecArray | null;
    incompleteImagePattern.lastIndex = 0;
    while ((match = incompleteImagePattern.exec(content)) !== null) {
      const pos = match.index;
      const afterParen = content.substring(pos + match[0].length, pos + match[0].length + 100);
      const hasClosingParen = afterParen.includes(')');
      if (!hasClosingParen) {
        if (isPositionInCodeBlock(pos, inCodeBlock)) continue;
        const { line, col } = getLineAndCol(content, pos);
        if (line === issue.line && col === issue.startCol) {
          return content.substring(0, pos + match[0].length) + ')' + content.substring(pos + match[0].length);
        }
      }
    }
    return null;
  }

  if (issue.message === '图片缺少替代文字') {
    const inCodeBlock = isInsideCodeBlock(content);
    const emptyImageAlt = /!\[\s*\]\([^)]*\)/g;
    let match: RegExpExecArray | null;
    emptyImageAlt.lastIndex = 0;
    while ((match = emptyImageAlt.exec(content)) !== null) {
      if (isPositionInCodeBlock(match.index, inCodeBlock)) continue;
      const { line, col } = getLineAndCol(content, match.index);
      if (line === issue.line && col === issue.startCol) {
        const insertPos = match.index + 2;
        return content.substring(0, insertPos) + 'image' + content.substring(insertPos);
      }
    }
    return null;
  }

  if (issue.message === '水平分割线混用了不同字符') {
    const trimmed = lineText.trim();
    if (trimmed.length >= 3 && /^[*\-_]+$/.test(trimmed)) {
      const chars = new Set(trimmed.split(''));
      if (chars.size > 1) {
        const indent = lineText.indexOf(trimmed);
        lines[issue.line] = lineText.substring(0, indent) + '---' + lineText.substring(indent + trimmed.length);
        return lines.join('\n');
      }
    }
    return null;
  }

  return null;
}
