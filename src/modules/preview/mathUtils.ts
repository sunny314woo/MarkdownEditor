export function insertMath(
  textarea: HTMLTextAreaElement,
  type: 'inline' | 'block',
  latex: string,
  isTemplate: boolean,
  onChange: (value: string) => void
): void {
  const { selectionStart, selectionEnd, value } = textarea
  const before = value.substring(0, selectionStart)
  const after = value.substring(selectionEnd)

  let insertText: string
  let cursorOffset: number
  let cursorEndOffset: number

  if (type === 'inline') {
    if (isTemplate) {
      insertText = `$${latex}$`
      cursorOffset = 2
      cursorEndOffset = insertText.length - 1
    } else {
      insertText = `$${latex}$`
      cursorOffset = insertText.length
      cursorEndOffset = insertText.length
    }
  } else {
    const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : ''
    if (isTemplate) {
      insertText = `${prefix}$$\n${latex}\n$$`
      cursorOffset = prefix.length + 3 + latex.indexOf('{}') >= 0
        ? prefix.length + 3
        : prefix.length + 3
      cursorEndOffset = prefix.length + 3 + latex.length
    } else {
      insertText = `${prefix}$$\n${latex}\n$$`
      cursorOffset = insertText.length
      cursorEndOffset = insertText.length
    }
  }

  const newValue = before + insertText + after
  onChange(newValue)

  requestAnimationFrame(() => {
    textarea.focus()
    if (isTemplate) {
      const firstPlaceholder = latex.indexOf('{}')
      if (firstPlaceholder >= 0) {
        const absOffset = selectionStart + cursorOffset + firstPlaceholder
        textarea.selectionStart = absOffset
        textarea.selectionEnd = absOffset + 2
      } else {
        textarea.selectionStart = selectionStart + cursorOffset
        textarea.selectionEnd = selectionStart + cursorEndOffset
      }
    } else {
      textarea.selectionStart = selectionStart + cursorOffset
      textarea.selectionEnd = selectionStart + cursorOffset
    }
  })
}

export function isCursorInFormula(textBeforeCursor: string): boolean {
  let dollarCount = 0
  for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
    if (textBeforeCursor[i] === '$' && (i === 0 || textBeforeCursor[i - 1] !== '\\')) {
      dollarCount++
    }
  }
  return dollarCount % 2 === 1
}
