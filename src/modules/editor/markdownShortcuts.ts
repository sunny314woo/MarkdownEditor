export function wrapText(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  wrapper: string
): { newText: string; newCursorStart: number; newCursorEnd: number } {
  const before = text.substring(0, selectionStart)
  const selected = text.substring(selectionStart, selectionEnd)
  const after = text.substring(selectionEnd)

  const wrapped = `${wrapper}${selected}${wrapper}`
  const newText = before + wrapped + after

  const newCursorStart = selectionStart + wrapper.length
  const newCursorEnd = selectionEnd + wrapper.length

  return { newText, newCursorStart, newCursorEnd }
}

export function wrapSelection(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  wrapper: string
): { newText: string; newCursorStart: number; newCursorEnd: number } {
  const before = text.substring(0, selectionStart)
  const selected = text.substring(selectionStart, selectionEnd)
  const after = text.substring(selectionEnd)

  const wrapped = `${wrapper}${selected}${wrapper}`
  const newText = before + wrapped + after

  const newCursorStart = selectionStart + wrapper.length
  const newCursorEnd = selectionEnd + wrapper.length

  return { newText, newCursorStart, newCursorEnd }
}

export function insertAtCursor(
  text: string,
  cursorPos: number,
  insertText: string
): { newText: string; newCursorStart: number; newCursorEnd: number } {
  const before = text.substring(0, cursorPos)
  const after = text.substring(cursorPos)

  const newText = before + insertText + after
  const newCursorStart = cursorPos + Math.floor(insertText.length / 2)
  const newCursorEnd = newCursorStart

  return { newText, newCursorStart, newCursorEnd }
}

export function formatBold(
  text: string,
  selectionStart: number,
  selectionEnd: number
): { newText: string; newCursorStart: number; newCursorEnd: number } {
  if (selectionStart !== selectionEnd) {
    return wrapSelection(text, selectionStart, selectionEnd, '**')
  } else {
    return insertAtCursor(text, selectionStart, '****')
  }
}

export function formatItalic(
  text: string,
  selectionStart: number,
  selectionEnd: number
): { newText: string; newCursorStart: number; newCursorEnd: number } {
  if (selectionStart !== selectionEnd) {
    return wrapSelection(text, selectionStart, selectionEnd, '*')
  } else {
    return insertAtCursor(text, selectionStart, '**')
  }
}

export function formatCodeBlock(
  text: string,
  selectionStart: number,
  selectionEnd: number
): { newText: string; newCursorStart: number; newCursorEnd: number } {
  const lines = text.split('\n')
  let charCount = 0
  let startLineIndex = -1
  let endLineIndex = -1

  for (let i = 0; i < lines.length; i++) {
    const lineStart = charCount
    const lineEnd = charCount + lines[i].length

    if (startLineIndex === -1 && lineStart <= selectionStart && lineEnd >= selectionStart) {
      startLineIndex = i
    }
    if (lineStart <= selectionEnd && lineEnd >= selectionEnd) {
      endLineIndex = i
      break
    }

    charCount += lines[i].length + 1
  }

  if (startLineIndex === -1) startLineIndex = 0
  if (endLineIndex === -1 || endLineIndex < startLineIndex) endLineIndex = startLineIndex

  if (selectionStart === selectionEnd) {
    charCount = 0
    for (let i = 0; i < startLineIndex; i++) {
      charCount += lines[i].length + 1
    }

    const targetLineStart = charCount
    const targetLineEnd = charCount + lines[startLineIndex].length

    if (selectionStart >= targetLineStart && selectionStart <= targetLineEnd) {
      const lineContent = lines[startLineIndex]
      const hasCodeBlockMarkers = lineContent.trim() === '```'

      if (hasCodeBlockMarkers) {
        lines[startLineIndex] = ''
        return {
          newText: lines.join('\n').replace(/\n+/g, '\n').replace(/\n$/, ''),
          newCursorStart: targetLineStart,
          newCursorEnd: targetLineStart
        }
      } else {
        lines[startLineIndex] = '```\n' + lineContent + '\n```'
        const newText = lines.join('\n')
        return {
          newText,
          newCursorStart: targetLineStart + 4,
          newCursorEnd: targetLineEnd + 4
        }
      }
    }
  }

  let lineStart = 0
  for (let i = 0; i < startLineIndex; i++) {
    lineStart += lines[i].length + 1
  }
  const selectedLineStartChar = lineStart

  lineStart = 0
  for (let i = 0; i < endLineIndex; i++) {
    lineStart += lines[i].length + 1
  }
  const selectedLineEndForEnd = lineStart + lines[endLineIndex].length

  const before = text.substring(0, selectedLineStartChar)
  const selectedLines = text.substring(selectedLineStartChar, selectedLineEndForEnd)
  const after = text.substring(selectedLineEndForEnd)

  const trimmedSelected = selectedLines.trim()
  const hasCodeBlockMarkers = trimmedSelected.startsWith('```') && trimmedSelected.endsWith('```')

  let newText: string
  let newCursorStart: number
  let newCursorEnd: number

  if (hasCodeBlockMarkers) {
    const codeLines = selectedLines.trim().slice(4, -4)
    newText = text.substring(0, selectedLineStartChar) + codeLines + after
    newCursorStart = selectionStart
    newCursorEnd = selectionEnd
  } else {
    newText = before + '```\n' + selectedLines + '\n```' + after
    newCursorStart = selectedLineStartChar + 4
    newCursorEnd = selectedLineEndForEnd + 4
  }

  return { newText, newCursorStart, newCursorEnd }
}

export function formatInlineMath(
  text: string,
  selectionStart: number,
  selectionEnd: number
): { newText: string; newCursorStart: number; newCursorEnd: number } {
  if (selectionStart !== selectionEnd) {
    const before = text.substring(0, selectionStart)
    const selected = text.substring(selectionStart, selectionEnd)
    const after = text.substring(selectionEnd)
    const newText = before + '$' + selected + '$' + after
    return {
      newText,
      newCursorStart: selectionStart + 1,
      newCursorEnd: selectionEnd + 1,
    }
  } else {
    const before = text.substring(0, selectionStart)
    const after = text.substring(selectionEnd)
    const newText = before + '$$' + after
    return {
      newText,
      newCursorStart: selectionStart + 1,
      newCursorEnd: selectionEnd + 1,
    }
  }
}

export function formatBlockMath(
  text: string,
  selectionStart: number,
  selectionEnd: number
): { newText: string; newCursorStart: number; newCursorEnd: number } {
  if (selectionStart !== selectionEnd) {
    const before = text.substring(0, selectionStart)
    const selected = text.substring(selectionStart, selectionEnd)
    const after = text.substring(selectionEnd)
    const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : ''
    const newText = before + prefix + '$$' + selected + '$$\n' + after
    const offset = prefix.length
    return {
      newText,
      newCursorStart: selectionStart + offset + 2,
      newCursorEnd: selectionEnd + offset + 2,
    }
  } else {
    const before = text.substring(0, selectionStart)
    const after = text.substring(selectionEnd)
    const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : ''
    const newText = before + prefix + '$$\n\n$$\n' + after
    const offset = prefix.length
    return {
      newText,
      newCursorStart: selectionStart + offset + 3,
      newCursorEnd: selectionEnd + offset + 3,
    }
  }
}

export function applyFormatAndUpdateCursor(
  textarea: HTMLTextAreaElement,
  formatter: (text: string, selectionStart: number, selectionEnd: number) => {
    newText: string
    newCursorStart: number
    newCursorEnd: number
  }
): void {
  const { selectionStart, selectionEnd, value } = textarea
  const result = formatter(value, selectionStart, selectionEnd)

  textarea.value = result.newText
  textarea.selectionStart = result.newCursorStart
  textarea.selectionEnd = result.newCursorEnd

  textarea.dispatchEvent(new Event('input', { bubbles: true }))
}
