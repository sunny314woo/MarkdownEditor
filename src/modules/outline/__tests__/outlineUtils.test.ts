import { describe, it, expect } from 'vitest'
import { parseMarkdownHeadings } from '../outlineUtils'

describe('parseMarkdownHeadings 工具函数', () => {
  describe('基本解析', () => {
    it('应该正确解析H1标题', () => {
      const content = '# 标题1'
      const result = parseMarkdownHeadings(content)
      
      expect(result.length).toBe(1)
      expect(result[0].text).toBe('标题1')
      expect(result[0].level).toBe(1)
    })

    it('应该正确解析多级标题', () => {
      const content = `# 标题1
## 标题2
### 标题3`
      const result = parseMarkdownHeadings(content)
      
      expect(result.length).toBe(1)
      expect(result[0].text).toBe('标题1')
      expect(result[0].children?.[0].text).toBe('标题2')
      expect(result[0].children?.[0].children?.[0].text).toBe('标题3')
    })

    it('应该正确解析多个同级标题', () => {
      const content = `# 标题1
# 标题2
# 标题3`
      const result = parseMarkdownHeadings(content)
      
      expect(result.length).toBe(3)
    })

    it('应该正确解析嵌套结构', () => {
      const content = `# 第一章
## 1.1
## 1.2
### 1.2.1
# 第二章
## 2.1`
      const result = parseMarkdownHeadings(content)
      
      expect(result.length).toBe(2)
      expect(result[0].text).toBe('第一章')
      expect(result[0].children?.length).toBe(2)
      expect(result[0].children?.[1].children?.length).toBe(1)
    })
  })

  describe('边界情况', () => {
    it('空内容应该返回空数组', () => {
      const content = ''
      const result = parseMarkdownHeadings(content)
      
      expect(result.length).toBe(0)
    })

    it('无标题内容应该返回空数组', () => {
      const content = '这是普通文本\n没有标题'
      const result = parseMarkdownHeadings(content)
      
      expect(result.length).toBe(0)
    })

    it('应该处理标题前后的空格', () => {
      const content = '#   标题  '
      const result = parseMarkdownHeadings(content)
      
      expect(result[0].text).toBe('标题')
    })
  })

  describe('ID生成', () => {
    it('应该为每个标题生成唯一ID', () => {
      const content = `# 标题1
# 标题2`
      const result = parseMarkdownHeadings(content)
      
      expect(result[0].id).not.toBe(result[1].id)
    })

    it('应该基于标题序号生成稳定ID', () => {
      const content = '# 测试标题'
      const result = parseMarkdownHeadings(content)
      
      expect(result[0].id).toBe('heading-1')
    })
  })

  describe('复杂文档', () => {
    it('应该正确解析包含代码块的文档', () => {
      const content = `# 标题
\`\`\`
# 这不是标题
\`\`\`
## 真实标题`
      const result = parseMarkdownHeadings(content)
      
      expect(result.length).toBe(1)
      expect(result[0].children?.length).toBe(1)
    })

    it('应该正确解析混合内容的文档', () => {
      const content = `# 第一章
普通文本内容
## 1.1
更多内容
- 列表项
## 1.2`
      const result = parseMarkdownHeadings(content)
      
      expect(result.length).toBe(1)
      expect(result[0].children?.length).toBe(2)
    })
  })
})
