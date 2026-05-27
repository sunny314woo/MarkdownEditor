import { useState, useEffect, useRef } from 'react'

interface SymbolItem {
  latex: string
  display: string
  label: string
}

interface TemplateItem {
  name: string
  latex: string
  preview: string
}

interface MathPopoverProps {
  isOpen: boolean
  onClose: () => void
  mode: 'inline' | 'block'
  anchorEl: HTMLElement | null
  onInsert: (latex: string, isTemplate: boolean) => void
}

const SYMBOL_GROUPS: { name: string; items: SymbolItem[] }[] = [
  {
    name: '希腊字母',
    items: [
      { latex: '\\alpha', display: 'α', label: 'alpha' },
      { latex: '\\beta', display: 'β', label: 'beta' },
      { latex: '\\gamma', display: 'γ', label: 'gamma' },
      { latex: '\\delta', display: 'δ', label: 'delta' },
      { latex: '\\epsilon', display: 'ε', label: 'epsilon' },
      { latex: '\\theta', display: 'θ', label: 'theta' },
      { latex: '\\lambda', display: 'λ', label: 'lambda' },
      { latex: '\\mu', display: 'μ', label: 'mu' },
      { latex: '\\pi', display: 'π', label: 'pi' },
      { latex: '\\sigma', display: 'σ', label: 'sigma' },
      { latex: '\\tau', display: 'τ', label: 'tau' },
      { latex: '\\phi', display: 'φ', label: 'phi' },
      { latex: '\\omega', display: 'ω', label: 'omega' },
      { latex: '\\Gamma', display: 'Γ', label: 'Gamma' },
      { latex: '\\Delta', display: 'Δ', label: 'Delta' },
      { latex: '\\Sigma', display: 'Σ', label: 'Sigma' },
      { latex: '\\Omega', display: 'Ω', label: 'Omega' },
      { latex: '\\Pi', display: 'Π', label: 'Pi' },
    ],
  },
  {
    name: '运算符号',
    items: [
      { latex: '\\int', display: '∫', label: '积分' },
      { latex: '\\sum', display: '∑', label: '求和' },
      { latex: '\\prod', display: '∏', label: '求积' },
      { latex: '\\sqrt{}', display: '√', label: '根号' },
      { latex: '\\infty', display: '∞', label: '无穷' },
      { latex: '\\partial', display: '∂', label: '偏导' },
      { latex: '\\nabla', display: '∇', label: '梯度' },
      { latex: '\\times', display: '×', label: '乘' },
      { latex: '\\div', display: '÷', label: '除' },
      { latex: '\\pm', display: '±', label: '加减' },
      { latex: '\\cdot', display: '·', label: '点乘' },
      { latex: '\\frac{}{}', display: 'a/b', label: '分数' },
    ],
  },
  {
    name: '关系符号',
    items: [
      { latex: '\\neq', display: '≠', label: '不等于' },
      { latex: '\\leq', display: '≤', label: '小于等于' },
      { latex: '\\geq', display: '≥', label: '大于等于' },
      { latex: '\\approx', display: '≈', label: '约等于' },
      { latex: '\\equiv', display: '≡', label: '恒等于' },
      { latex: '\\sim', display: '∼', label: '相似' },
      { latex: '\\propto', display: '∝', label: '正比于' },
      { latex: '\\ll', display: '≪', label: '远小于' },
      { latex: '\\gg', display: '≫', label: '远大于' },
      { latex: '\\perp', display: '⊥', label: '垂直' },
      { latex: '\\parallel', display: '∥', label: '平行' },
      { latex: '\\in', display: '∈', label: '属于' },
    ],
  },
  {
    name: '集合与逻辑',
    items: [
      { latex: '\\in', display: '∈', label: '属于' },
      { latex: '\\notin', display: '∉', label: '不属于' },
      { latex: '\\cup', display: '∪', label: '并集' },
      { latex: '\\cap', display: '∩', label: '交集' },
      { latex: '\\subseteq', display: '⊆', label: '子集' },
      { latex: '\\subset', display: '⊂', label: '真子集' },
      { latex: '\\forall', display: '∀', label: '任意' },
      { latex: '\\exists', display: '∃', label: '存在' },
      { latex: '\\land', display: '∧', label: '与' },
      { latex: '\\lor', display: '∨', label: '或' },
      { latex: '\\neg', display: '¬', label: '非' },
      { latex: '\\emptyset', display: '∅', label: '空集' },
    ],
  },
  {
    name: '箭头',
    items: [
      { latex: '\\rightarrow', display: '→', label: '右箭头' },
      { latex: '\\Rightarrow', display: '⇒', label: '双线右' },
      { latex: '\\leftarrow', display: '←', label: '左箭头' },
      { latex: '\\Leftarrow', display: '⇐', label: '双线左' },
      { latex: '\\leftrightarrow', display: '↔', label: '左右' },
      { latex: '\\Leftrightarrow', display: '⇔', label: '等价' },
      { latex: '\\mapsto', display: '↦', label: '映射' },
      { latex: '\\uparrow', display: '↑', label: '上' },
      { latex: '\\downarrow', display: '↓', label: '下' },
      { latex: '\\nearrow', display: '↗', label: '右上' },
      { latex: '\\searrow', display: '↘', label: '右下' },
      { latex: '\\implies', display: '⟹', label: '蕴含' },
    ],
  },
]

const TEMPLATES: TemplateItem[] = [
  { name: '分数', latex: '\\frac{}{}', preview: 'a/b' },
  { name: '根号', latex: '\\sqrt{}', preview: '√x' },
  { name: 'n次根', latex: '\\sqrt[n]{}', preview: 'ⁿ√x' },
  { name: '上标', latex: '^{}', preview: 'xⁿ' },
  { name: '下标', latex: '_{}', preview: 'xᵢ' },
  { name: '积分', latex: '\\int_{}^{}', preview: '∫ₐᵇ' },
  { name: '求和', latex: '\\sum_{}^{}', preview: '∑ⁿᵢ' },
  { name: '极限', latex: '\\lim_{}', preview: 'lim→' },
  { name: '矩阵', latex: '\\begin{pmatrix}  &  \\\\  &  \\end{pmatrix}', preview: '2×2' },
  { name: '行列式', latex: '\\begin{vmatrix}  &  \\\\  &  \\end{vmatrix}', preview: '|2×2|' },
  { name: '分段函数', latex: 'f(x) = \\begin{cases}  & x>0 \\\\  & x \\leq 0 \\end{cases}', preview: 'cases' },
  { name: '方程组', latex: '\\begin{cases}  \\\\  \\end{cases}', preview: 'system' },
]

export default function MathPopover({ isOpen, onClose, mode, anchorEl, onInsert }: MathPopoverProps) {
  const [tab, setTab] = useState<'symbols' | 'templates'>('symbols')
  const [activeGroup, setActiveGroup] = useState(0)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  useEffect(() => {
    if (isOpen) {
      setTab('symbols')
      setActiveGroup(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !anchorEl) return

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect()
      const popoverWidth = 400
      const viewportWidth = window.innerWidth

      let left = rect.left
      if (left + popoverWidth > viewportWidth - 12) {
        left = viewportWidth - popoverWidth - 12
      }
      if (left < 12) left = 12

      setPosition({
        top: rect.bottom + 4,
        left,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [isOpen, anchorEl])

  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        popoverRef.current && !popoverRef.current.contains(target) &&
        anchorEl && !anchorEl.contains(target)
      ) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, anchorEl])

  if (!isOpen) return null

  const handleSymbolClick = (latex: string) => {
    onInsert(latex, false)
    onClose()
  }

  const handleTemplateClick = (latex: string) => {
    onInsert(latex, true)
    onClose()
  }

  return (
    <div
      ref={popoverRef}
      className="math-popover"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
      }}
    >
      <div className="math-popover-header-bar">
        <span className="math-popover-mode-label">
          {mode === 'inline' ? '行内公式' : '块级公式'}
        </span>
        <div className="math-popover-tab-group">
          <button
            className={`math-popover-tab-btn ${tab === 'symbols' ? 'active' : ''}`}
            onClick={() => setTab('symbols')}
          >
            常用符号
          </button>
          <button
            className={`math-popover-tab-btn ${tab === 'templates' ? 'active' : ''}`}
            onClick={() => setTab('templates')}
          >
            公式模板
          </button>
        </div>
      </div>

      {tab === 'symbols' && (
        <>
          <div className="math-popover-group-tabs">
            {SYMBOL_GROUPS.map((group, i) => (
              <button
                key={group.name}
                className={`math-popover-group-btn ${activeGroup === i ? 'active' : ''}`}
                onClick={() => setActiveGroup(i)}
              >
                {group.name}
              </button>
            ))}
          </div>
          <div className="math-popover-symbol-grid">
            {SYMBOL_GROUPS[activeGroup].items.map((sym) => (
              <button
                key={sym.latex + sym.label}
                className="math-popover-symbol-item"
                title={`${sym.label}: ${sym.latex}`}
                onClick={() => handleSymbolClick(sym.latex)}
              >
                <span className="math-popover-symbol-char">{sym.display}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'templates' && (
        <div className="math-popover-template-grid">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              className="math-popover-template-item"
              title={tpl.latex}
              onClick={() => handleTemplateClick(tpl.latex)}
            >
              <span className="math-popover-template-name">{tpl.name}</span>
              <span className="math-popover-template-preview">{tpl.preview}</span>
            </button>
          ))}
        </div>
      )}

      <div className="math-popover-footer-bar">
        <span className="math-popover-footer-hint">
          {mode === 'inline' ? 'Ctrl+M 快速插入' : 'Ctrl+Shift+M 快速插入'}
        </span>
      </div>
    </div>
  )
}
