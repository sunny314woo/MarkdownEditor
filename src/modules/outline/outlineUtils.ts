export interface OutlineItem {
  id: string;
  text: string;
  level: number;
  children?: OutlineItem[];
}

export function parseMarkdownHeadings(markdown: string): OutlineItem[] {
  const lines = markdown.split('\n');
  const headings: OutlineItem[] = [];
  const stack: OutlineItem[] = [];
  let headingIndex = 0;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测代码块的开始和结束
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // 在代码块内不解析标题
    if (inCodeBlock) {
      continue;
    }

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      headingIndex++;
      const id = `heading-${headingIndex}`;

      const item: OutlineItem = { id, text, level, children: [] };

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        headings.push(item);
      } else {
        const parent = stack[stack.length - 1];
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(item);
      }

      stack.push(item);
    }
  }

  return headings;
}

export function getFlatHeadingList(markdown: string): Array<{ id: string; text: string; level: number }> {
  const tree = parseMarkdownHeadings(markdown);
  const result: Array<{ id: string; text: string; level: number }> = [];

  function flatten(items: OutlineItem[]) {
    for (const item of items) {
      result.push({ id: item.id, text: item.text, level: item.level });
      if (item.children && item.children.length > 0) {
        flatten(item.children);
      }
    }
  }

  flatten(tree);
  return result;
}
