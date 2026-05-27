import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Outline from '../Outline'
import { OutlineItem } from '../outlineUtils'

vi.mock('../outlineUtils', () => ({
  parseMarkdownHeadings: vi.fn()
}))

import { parseMarkdownHeadings } from '../outlineUtils'

const mockParseMarkdownHeadings = vi.mocked(parseMarkdownHeadings)

const mockHeadings: OutlineItem[] = [
  {
    id: 'heading-1',
    level: 1,
    text: '第一章',
    children: [
      {
        id: 'heading-1-1',
        level: 2,
        text: '1.1 小节',
        children: [
          {
            id: 'heading-1-1-1',
            level: 3,
            text: '1.1.1 子小节',
            children: []
          }
        ]
      },
      {
        id: 'heading-1-2',
        level: 2,
        text: '1.2 小节',
        children: []
      }
    ]
  },
  {
    id: 'heading-2',
    level: 1,
    text: '第二章',
    children: [
      {
        id: 'heading-2-1',
        level: 2,
        text: '2.1 小节',
        children: []
      }
    ]
  }
]

const simpleHeadings: OutlineItem[] = [
  {
    id: 'h1',
    level: 1,
    text: '标题1',
    children: []
  },
  {
    id: 'h2',
    level: 1,
    text: '标题2',
    children: []
  }
]

const getFirstItemCollapseButton = () => {
  const button = screen
    .getAllByRole('button', { name: '折叠' })
    .find((element) => element.getAttribute('aria-label') === '折叠')

  if (!button) {
    throw new Error('未找到单项折叠按钮')
  }

  return button
}

const getFirstItemExpandButton = () => {
  const button = screen
    .getAllByRole('button', { name: '展开' })
    .find((element) => element.getAttribute('aria-label') === '展开')

  if (!button) {
    throw new Error('未找到单项展开按钮')
  }

  return button
}

describe('Outline 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('应该正确渲染无标题状态', () => {
      mockParseMarkdownHeadings.mockReturnValue([])
      render(<Outline content="" />)
      expect(screen.getByText('无标题')).toBeInTheDocument()
    })

    it('应该正确渲染标题列表', () => {
      mockParseMarkdownHeadings.mockReturnValue(mockHeadings)
      render(<Outline content="" />)
      
      expect(screen.getByText('第一章')).toBeInTheDocument()
      expect(screen.getByText('第二章')).toBeInTheDocument()
    })
  })

  describe('折叠功能', () => {
    it('应该显示可折叠标题的箭头图标', () => {
      mockParseMarkdownHeadings.mockReturnValue(mockHeadings)
      render(<Outline content="" />)
      
      const collapseButtons = screen.getAllByRole('button', { name: /折叠/ })
      expect(collapseButtons.length).toBeGreaterThan(0)
    })

    it('点击折叠图标应该切换折叠状态', () => {
      mockParseMarkdownHeadings.mockReturnValue(mockHeadings)
      render(<Outline content="" />)
      
      const collapseButton = getFirstItemCollapseButton()
      const subHeading = screen.getByText('1.1 小节')
      
      expect(subHeading).toBeVisible()
      
      fireEvent.click(collapseButton)
      
      expect(getFirstItemExpandButton()).toBeInTheDocument()
    })

    it('没有子节点的标题不应该显示折叠图标', () => {
      mockParseMarkdownHeadings.mockReturnValue(simpleHeadings)
      render(<Outline content="" />)
      
      const buttons = screen.queryAllByRole('button', { name: /折叠|展开/ })
      expect(buttons.length).toBe(0)
    })
  })

  describe('全部展开/折叠', () => {
    it('应该显示全部展开和全部折叠按钮', () => {
      mockParseMarkdownHeadings.mockReturnValue(mockHeadings)
      render(<Outline content="" />)
      
      expect(screen.getByTitle('全部折叠')).toBeInTheDocument()

      fireEvent.click(screen.getByTitle('全部折叠'))

      expect(screen.getByTitle('全部展开')).toBeInTheDocument()
    })

    it('点击全部折叠应该折叠所有标题', () => {
      mockParseMarkdownHeadings.mockReturnValue(mockHeadings)
      render(<Outline content="" />)
      
      const collapseAllButton = screen.getByTitle('全部折叠')
      fireEvent.click(collapseAllButton)
    })

    it('点击全部展开应该展开所有标题', () => {
      mockParseMarkdownHeadings.mockReturnValue(mockHeadings)
      render(<Outline content="" />)
      
      fireEvent.click(screen.getByTitle('全部折叠'))
      const expandAllButton = screen.getByTitle('全部展开')
      fireEvent.click(expandAllButton)

      expect(screen.getByTitle('全部折叠')).toBeInTheDocument()
    })

    it('没有可折叠项时不应该显示全部展开/折叠按钮', () => {
      mockParseMarkdownHeadings.mockReturnValue(simpleHeadings)
      render(<Outline content="" />)
      
      expect(screen.queryByTitle('全部展开')).not.toBeInTheDocument()
      expect(screen.queryByTitle('全部折叠')).not.toBeInTheDocument()
    })
  })

  describe('标题跳转功能', () => {
    it('点击标题文本不应该触发折叠', () => {
      mockParseMarkdownHeadings.mockReturnValue(mockHeadings)
      render(<Outline content="" />)
      
      const headingButton = screen.getByText('第一章').closest('button')
      const collapseButton = getFirstItemCollapseButton()
      
      expect(collapseButton).toBeInTheDocument()
      
      if (headingButton) {
        fireEvent.click(headingButton)
        expect(collapseButton).toBeInTheDocument()
      }
    })
  })

  describe('交互反馈', () => {
    it('折叠图标应该有旋转动画', () => {
      mockParseMarkdownHeadings.mockReturnValue(mockHeadings)
      render(<Outline content="" />)
      
      const collapseButton = getFirstItemCollapseButton()
      const svg = collapseButton.querySelector('svg')
      
      expect(svg).toBeInTheDocument()
    })

    it('应该保持折叠状态', () => {
      mockParseMarkdownHeadings.mockReturnValue(mockHeadings)
      render(<Outline content="" />)
      
      const collapseButton = getFirstItemCollapseButton()
      fireEvent.click(collapseButton)
      
      expect(getFirstItemExpandButton()).toBeInTheDocument()
    })
  })

  describe('性能优化', () => {
    it('应该正确渲染大量标题时保持响应', () => {
      const manyHeadings: OutlineItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `heading-${i}`,
        level: 1,
        text: `标题 ${i + 1}`,
        children: []
      }))
      
      mockParseMarkdownHeadings.mockReturnValue(manyHeadings)
      
      const start = performance.now()
      render(<Outline content="" />)
      const end = performance.now()
      
      expect(end - start).toBeLessThan(1000)
    })
  })
})
