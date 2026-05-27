import { useRef, useCallback, useEffect, useState, forwardRef, ForwardedRef } from 'react'

interface RichEditorProps {
  value: string
  onChange: (value: string) => void
}

const RichEditor = forwardRef(function RichEditor(
  { value, onChange }: RichEditorProps,
  ref: ForwardedRef<HTMLTextAreaElement>
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    syncEditorContent()
  }, [value])

  const syncEditorContent = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    editor.innerHTML = renderMarkdownWithImages(value)
  }, [value])

  const renderMarkdownWithImages = (text: string): string => {
    const parts: string[] = []
    let lastIndex = 0

    const imageRegex = /!\[([^\]]*)\]\((data:image\/[a-z+]+;base64,[^)]+)\)/g
    let match

    while ((match = imageRegex.exec(text)) !== null) {
      parts.push(escapeHtml(text.substring(lastIndex, match.index)))
      parts.push(`<span class="image-wrapper"><img src="${match[2]}" alt="${escapeHtml(match[1])}" class="inline-image" /></span>`)
      lastIndex = match.index + match[0].length
    }

    parts.push(escapeHtml(text.substring(lastIndex)))

    return parts.join('').replace(/\n/g, '<br>')
  }

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const getTextareaPosition = useCallback((clientX: number, clientY: number): number => {
    const textarea = textareaRef.current
    if (!textarea) return 0

    const rect = textarea.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    const lineHeight = 20
    const charWidth = 8.4

    const lines = value.substring(0, textarea.selectionStart).split('\n')

    const estimatedLine = Math.floor(y / lineHeight)
    const estimatedCol = Math.floor(x / charWidth)

    let totalChars = 0
    for (let i = 0; i < estimatedLine && i < lines.length; i++) {
      totalChars += lines[i].length + 1
    }
    totalChars += Math.min(estimatedCol, lines[estimatedLine]?.length || 0)

    return Math.max(0, Math.min(totalChars, value.length))
  }, [value])

  const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const position = getTextareaPosition(e.clientX, e.clientY)
    textarea.focus()
    textarea.setSelectionRange(position, position)
  }, [getTextareaPosition])

  const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    let imageFound = false

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        imageFound = true

        const file = item.getAsFile()
        if (file) {
          processImageFile(file)
        }
        break
      }
    }

    if (!imageFound) {
      const files = e.clipboardData.files
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.type.startsWith('image/')) {
          e.preventDefault()
          processImageFile(file)
          break
        }
      }
    }
  }, [])

  const processImageFile = useCallback((file: File) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const base64Data = e.target?.result as string
      if (base64Data) {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const altText = file.name.replace(/\.[^/.]+$/, '') || 'image'
        const markdownImage = `![${altText}](${base64Data})`

        const newValue = value.substring(0, start) + '\n' + markdownImage + '\n' + value.substring(end)
        onChange(newValue)

        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + markdownImage.length + 2, start + markdownImage.length + 2)
        }, 50)
      }
    }

    reader.readAsDataURL(file)
  }, [value, onChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        processImageFile(file)
        break
      }
    }
  }, [processImageFile])

  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(textareaRef.current)
      } else {
        ref.current = textareaRef.current
      }
    }
  }, [ref])

  return (
    <div
      className={`relative w-full h-full font-mono text-sm leading-relaxed overflow-auto ${
        isDragging ? 'ring-2 ring-blue-500 ring-inset bg-blue-500/10' : ''
      }`}
      onClick={handleEditorClick}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ backgroundColor: 'var(--editor-bg)', color: 'var(--editor-text)' }}
    >
      <div
        ref={editorRef}
        className="absolute inset-0 px-4 py-3 whitespace-pre-wrap break-all pointer-events-none"
        suppressContentEditableWarning={true}
      />

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaInput}
        className="absolute inset-0 w-full h-full px-4 py-3 resize-none outline-none bg-transparent caret-current"
        style={{ color: 'transparent' }}
        spellCheck={false}
      />
    </div>
  )
})

export default RichEditor
