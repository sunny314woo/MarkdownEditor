import { useEffect, useRef, useState } from 'react'

interface MathSymbolItem {
  latex: string
  display: string
  label: string
}

interface MathSymbolCategory {
  name: string
  symbols: MathSymbolItem[]
}

interface MathTemplate {
  name: string
  inline: string
  block: string
}

const SYMBOL_CATEGORIES: MathSymbolCategory[] = [
  {
    name: '希腊字母',
    symbols: [
      { latex: '\\alpha', display: 'α', label: 'alpha' },
      { latex: '\\beta', display: 'β', label: 'beta' },
      { latex: '\\gamma', display: 'γ', label: 'gamma' },
      { latex: '\\delta', display: 'δ', label: 'delta' },
      { latex: '\\epsilon', display: 'ε', label: 'epsilon' },
      { latex: '\\zeta', display: 'ζ', label: 'zeta' },
      { latex: '\\eta', display: 'η', label: 'eta' },
      { latex: '\\theta', display: 'θ', label: 'theta' },
      { latex: '\\lambda', display: 'λ', label: 'lambda' },
      { latex: '\\mu', display: 'μ', label: 'mu' },
      { latex: '\\pi', display: 'π', label: 'pi' },
      { latex: '\\rho', display: 'ρ', label: 'rho' },
      { latex: '\\sigma', display: 'σ', label: 'sigma' },
      { latex: '\\tau', display: 'τ', label: 'tau' },
      { latex: '\\phi', display: 'φ', label: 'phi' },
      { latex: '\\omega', display: 'ω', label: 'omega' },
      { latex: '\\Gamma', display: 'Γ', label: 'Gamma' },
      { latex: '\\Delta', display: 'Δ', label: 'Delta' },
      { latex: '\\Theta', display: 'Θ', label: 'Theta' },
      { latex: '\\Lambda', display: 'Λ', label: 'Lambda' },
      { latex: '\\Sigma', display: 'Σ', label: 'Sigma' },
      { latex: '\\Phi', display: 'Φ', label: 'Phi' },
      { latex: '\\Omega', display: 'Ω', label: 'Omega' },
      { latex: '\\Pi', display: 'Π', label: 'Pi' },
    ],
  },
  {
    name: '运算符',
    symbols: [
      { latex: '\\times', display: '×', label: '乘' },
      { latex: '\\div', display: '÷', label: '除' },
      { latex: '\\pm', display: '±', label: '加减' },
      { latex: '\\mp', display: '∓', label: '减加' },
      { latex: '\\cdot', display: '·', label: '点乘' },
      { latex: '\\ast', display: '∗', label: '星号' },
      { latex: '\\circ', display: '∘', label: '圆' },
      { latex: '\\bullet', display: '•', label: '圆点' },
      { latex: '\\oplus', display: '⊕', label: '直和' },
      { latex: '\\otimes', display: '⊗', label: '张量积' },
      { latex: '\\odot', display: '⊙', label: '点积' },
      { latex: '\\dagger', display: '†', label: '匕首' },
    ],
  },
  {
    name: '关系符',
    symbols: [
      { latex: '\\neq', display: '≠', label: '不等于' },
      { latex: '\\leq', display: '≤', label: '小于等于' },
      { latex: '\\geq', display: '≥', label: '大于等于' },
      { latex: '\\ll', display: '≪', label: '远小于' },
      { latex: '\\gg', display: '≫', label: '远大于' },
      { latex: '\\approx', display: '≈', label: '约等于' },
      { latex: '\\equiv', display: '≡', label: '恒等于' },
      { latex: '\\sim', display: '∼', label: '相似' },
      { latex: '\\simeq', display: '≃', label: '近似' },
      { latex: '\\propto', display: '∝', label: '正比于' },
      { latex: '\\parallel', display: '∥', label: '平行' },
      { latex: '\\perp', display: '⊥', label: '垂直' },
    ],
  },
  {
    name: '集合',
    symbols: [
      { latex: '\\in', display: '∈', label: '属于' },
      { latex: '\\notin', display: '∉', label: '不属于' },
      { latex: '\\subset', display: '⊂', label: '真子集' },
      { latex: '\\supset', display: '⊃', label: '真超集' },
      { latex: '\\subseteq', display: '⊆', label: '子集' },
      { latex: '\\supseteq', display: '⊇', label: '超集' },
      { latex: '\\cup', display: '∪', label: '并集' },
      { latex: '\\cap', display: '∩', label: '交集' },
      { latex: '\\emptyset', display: '∅', label: '空集' },
      { latex: '\\setminus', display: '\\', label: '差集' },
      { latex: '\\mathbb{N}', display: 'ℕ', label: '自然数' },
      { latex: '\\mathbb{R}', display: 'ℝ', label: '实数' },
    ],
  },
  {
    name: '逻辑',
    symbols: [
      { latex: '\\forall', display: '∀', label: '任意' },
      { latex: '\\exists', display: '∃', label: '存在' },
      { latex: '\\nexists', display: '∄', label: '不存在' },
      { latex: '\\land', display: '∧', label: '与' },
      { latex: '\\lor', display: '∨', label: '或' },
      { latex: '\\neg', display: '¬', label: '非' },
      { latex: '\\Rightarrow', display: '⇒', label: '推出' },
      { latex: '\\Leftarrow', display: '⇐', label: '被推出' },
      { latex: '\\Leftrightarrow', display: '⇔', label: '等价' },
      { latex: '\\implies', display: '⟹', label: '蕴含' },
      { latex: '\\therefore', display: '∴', label: '所以' },
      { latex: '\\because', display: '∵', label: '因为' },
    ],
  },
  {
    name: '箭头',
    symbols: [
      { latex: '\\leftarrow', display: '←', label: '左箭头' },
      { latex: '\\rightarrow', display: '→', label: '右箭头' },
      { latex: '\\uparrow', display: '↑', label: '上箭头' },
      { latex: '\\downarrow', display: '↓', label: '下箭头' },
      { latex: '\\Leftarrow', display: '⇐', label: '双线左' },
      { latex: '\\Rightarrow', display: '⇒', label: '双线右' },
      { latex: '\\Uparrow', display: '⇑', label: '双线上' },
      { latex: '\\Downarrow', display: '⇓', label: '双线下' },
      { latex: '\\leftrightarrow', display: '↔', label: '左右' },
      { latex: '\\Leftrightarrow', display: '⇔', label: '双线左右' },
      { latex: '\\mapsto', display: '↦', label: '映射' },
      { latex: '\\hookrightarrow', display: '↪', label: '钩右' },
    ],
  },
  {
    name: '大型运算',
    symbols: [
      { latex: '\\sum', display: '∑', label: '求和' },
      { latex: '\\prod', display: '∏', label: '求积' },
      { latex: '\\int', display: '∫', label: '积分' },
      { latex: '\\iint', display: '∬', label: '二重积分' },
      { latex: '\\iiint', display: '∭', label: '三重积分' },
      { latex: '\\oint', display: '∮', label: '环路积分' },
      { latex: '\\lim', display: 'lim', label: '极限' },
      { latex: '\\infty', display: '∞', label: '无穷' },
      { latex: '\\partial', display: '∂', label: '偏导' },
      { latex: '\\nabla', display: '∇', label: '梯度' },
      { latex: '\\sqrt{}', display: '√', label: '根号' },
      { latex: '\\frac{}{}', display: 'a/b', label: '分数' },
    ],
  },
  {
    name: '修饰',
    symbols: [
      { latex: '\\hat{}', display: 'x̂', label: '帽子' },
      { latex: '\\bar{}', display: 'x̄', label: '横线' },
      { latex: '\\vec{}', display: 'x⃗', label: '向量' },
      { latex: '\\dot{}', display: 'ẋ', label: '点' },
      { latex: '\\ddot{}', display: 'ẍ', label: '双点' },
      { latex: '\\tilde{}', display: 'x̃', label: '波浪' },
      { latex: '\\overline{}', display: '上划线', label: '上划线' },
      { latex: '\\underline{}', display: '下划线', label: '下划线' },
      { latex: '\\overbrace{}', display: '上花括', label: '上花括号' },
      { latex: '\\underbrace{}', display: '下花括', label: '下花括号' },
      { latex: '\\boxed{}', display: '□', label: '方框' },
      { latex: '\\cancel{}', display: '删除线', label: '删除线' },
    ],
  },
]

const MATH_TEMPLATES: MathTemplate[] = [
  { name: '分数', inline: '\\frac{a}{b}', block: '\\frac{a}{b}' },
  { name: '根号', inline: '\\sqrt{x}', block: '\\sqrt{x}' },
  { name: 'n次根', inline: '\\sqrt[n]{x}', block: '\\sqrt[n]{x}' },
  { name: '上标', inline: 'x^{n}', block: 'x^{n}' },
  { name: '下标', inline: 'x_{i}', block: 'x_{i}' },
  { name: '求和', inline: '\\sum_{i=1}^{n}', block: '\\sum_{i=1}^{n} x_i' },
  { name: '积分', inline: '\\int_{a}^{b}', block: '\\int_{a}^{b} f(x) \\, dx' },
  { name: '极限', inline: '\\lim_{x \\to \\infty}', block: '\\lim_{x \\to \\infty} f(x)' },
  { name: '矩阵', inline: '', block: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { name: '行列式', inline: '', block: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
  { name: '分段函数', inline: '', block: 'f(x) = \\begin{cases} a & x > 0 \\\\ b & x \\leq 0 \\end{cases}' },
  { name: '方程组', inline: '', block: '\\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases}' },
]

interface MathSymbolsPopoverProps {
  isOpen: boolean
  onClose: () => void
  mode: 'inline' | 'block'
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onInsertSymbol: (latex: string) => void
  onInsertTemplate: (template: string, mode: 'inline' | 'block') => void
  onInsertEmptyFormula: (mode: 'inline' | 'block') => void
  anchorRef?: React.RefObject<HTMLElement | null>
}

export default function MathSymbolsPopover({
  isOpen,
  onClose,
  mode,
  textareaRef,
  onInsertSymbol,
  onInsertTemplate,
  onInsertEmptyFormula,
  anchorRef,
}: MathSymbolsPopoverProps) {
  const [activeCategory, setActiveCategory] = useState(0)
  const [activeTab, setActiveTab] = useState<'symbols' | 'templates'>('symbols')
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setActiveCategory(0)
      setActiveTab('symbols')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, anchorRef])

  const handleSymbolClick = (latex: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const { selectionStart, value } = textarea
    const before = value.substring(0, selectionStart)
    const isInFormula = isCursorInFormula(before)

    if (isInFormula) {
      insertAtCursor(textarea, latex)
    } else {
      insertAtCursor(textarea, `$${latex}$`)
    }

    onInsertSymbol(latex)
    onClose()
  }

  const handleTemplateClick = (template: MathTemplate) => {
    const content = mode === 'inline' ? template.inline : template.block
    if (!content) {
      onInsertEmptyFormula(mode)
      onClose()
      return
    }
    onInsertTemplate(content, mode)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={popoverRef}
      className="math-symbols-popover"
    >
      <div className="math-popover-header">
        <span className="math-popover-title">
          {mode === 'inline' ? '行内公式' : '块级公式'}
        </span>
        <div className="math-popover-tabs">
          <button
            onClick={() => setActiveTab('symbols')}
            className="math-popover-tab"
            style={{
              backgroundColor: activeTab === 'symbols' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'symbols' ? 'var(--link-color)' : 'var(--sidebar-text)',
              fontWeight: activeTab === 'symbols' ? 600 : 400,
            }}
          >
            符号
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className="math-popover-tab"
            style={{
              backgroundColor: activeTab === 'templates' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'templates' ? 'var(--link-color)' : 'var(--sidebar-text)',
              fontWeight: activeTab === 'templates' ? 600 : 400,
            }}
          >
            模板
          </button>
        </div>
      </div>

      {activeTab === 'symbols' && (
        <>
          <div className="math-symbols-tabs">
            {SYMBOL_CATEGORIES.map((cat, index) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(index)}
                className="math-symbols-tab"
                style={{
                  backgroundColor: activeCategory === index
                    ? 'rgba(59, 130, 246, 0.15)'
                    : 'transparent',
                  color: activeCategory === index
                    ? 'var(--link-color)'
                    : 'var(--sidebar-text)',
                  fontWeight: activeCategory === index ? 600 : 400,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="math-symbols-grid">
            {SYMBOL_CATEGORIES[activeCategory].symbols.map((symbol) => (
              <button
                key={symbol.latex}
                onClick={() => handleSymbolClick(symbol.latex)}
                className="math-symbol-btn"
                title={`${symbol.label}: ${symbol.latex}`}
              >
                <span className="math-symbol-display">{symbol.display}</span>
                <span className="math-symbol-latex">{symbol.latex}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {activeTab === 'templates' && (
        <div className="math-templates-grid">
          {MATH_TEMPLATES.map((template) => {
            const content = mode === 'inline' ? template.inline : template.block
            const available = content.length > 0
            return (
              <button
                key={template.name}
                onClick={() => handleTemplateClick(template)}
                className="math-template-btn"
                title={available ? content : '仅块级公式可用'}
                style={{
                  opacity: available ? 1 : 0.4,
                  cursor: available ? 'pointer' : 'not-allowed',
                }}
              >
                <span className="math-template-name">{template.name}</span>
                <span className="math-template-preview">
                  {available ? content.replace(/\\/g, '').substring(0, 20) : '块级'}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="math-popover-footer">
        <button
          onClick={() => { onInsertEmptyFormula(mode); onClose() }}
          className="math-popover-insert-btn"
        >
          {mode === 'inline' ? '插入空行内公式 $...$' : '插入空块级公式 $$...$$'}
        </button>
        <span className="math-popover-hint">
          {mode === 'inline' ? 'Ctrl+M 快捷插入' : 'Ctrl+Shift+M 快捷插入'}
        </span>
      </div>
    </div>
  )
}

function isCursorInFormula(before: string): boolean {
  let dollarCount = 0
  for (let i = before.length - 1; i >= 0; i--) {
    if (before[i] === '$' && (i === 0 || before[i - 1] !== '\\')) {
      dollarCount++
    }
  }
  return dollarCount % 2 === 1
}

function insertAtCursor(textarea: HTMLTextAreaElement, text: string): void {
  const { selectionStart, selectionEnd, value } = textarea
  const before = value.substring(0, selectionStart)
  const after = value.substring(selectionEnd)

  textarea.value = before + text + after
  textarea.selectionStart = selectionStart + text.length
  textarea.selectionEnd = selectionStart + text.length
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.focus()
}
