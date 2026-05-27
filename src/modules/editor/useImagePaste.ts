import { RefObject, useCallback, useState } from 'react'
import { createPlaceholderUrl, storeBase64Image } from '../shared/imageStore'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml']

interface LargeImageConfirm {
  file: File
  onConfirm: () => void
}

interface UseImagePasteOptions {
  value: string
  textareaRef: RefObject<HTMLTextAreaElement>
  scrollContainerRef: RefObject<HTMLDivElement>
  onChange: (value: string) => void
  pushUndo: (newValue: string, groupKey?: string) => void
  setError: (message: string | null) => void
  setSuccess: (message: string | null) => void
  enabled?: boolean
}

export function useImagePaste({
  value,
  textareaRef,
  scrollContainerRef,
  onChange,
  pushUndo,
  setError,
  setSuccess,
  enabled = true,
}: UseImagePasteOptions) {
  const [isDragging, setIsDragging] = useState(false)
  const [largeImageConfirm, setLargeImageConfirm] = useState<LargeImageConfirm | null>(null)

  const clearErrorLater = useCallback(() => {
    setTimeout(() => setError(null), 5000)
  }, [setError])

  const clearSuccessLater = useCallback(() => {
    setTimeout(() => setSuccess(null), 3000)
  }, [setSuccess])

  const insertImageAtCursor = useCallback((imageUrl: string, altText: string) => {
    const textarea = textareaRef.current
    const scrollContainer = scrollContainerRef.current
    if (!textarea) {
      return
    }

    const savedScrollTop = scrollContainer ? scrollContainer.scrollTop : 0
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    let displayUrl: string
    if (imageUrl.startsWith('data:')) {
      const imageId = storeBase64Image(imageUrl)
      displayUrl = createPlaceholderUrl(imageId)
    } else {
      displayUrl = imageUrl
    }

    const markdownImage = `![${altText}](${displayUrl})`
    const newValue = value.substring(0, start) + markdownImage + value.substring(end)

    try {
      pushUndo(newValue, 'insert-image')
      onChange(newValue)

      const restoreScrollPosition = () => {
        if (textareaRef.current && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedScrollTop
          textareaRef.current.focus()
          const newCursorPos = start + markdownImage.length
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }

      setTimeout(restoreScrollPosition, 50)
      setTimeout(restoreScrollPosition, 100)
    } catch (err) {
      setError(`插入图片时发生错误: ${err instanceof Error ? err.message : '未知错误'}`)
      clearErrorLater()
    }
  }, [clearErrorLater, onChange, pushUndo, scrollContainerRef, setError, textareaRef, value])

  const processImageFile = useCallback((file: File) => {
    if (!enabled) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(`不支持的图片格式: ${file.type}。仅支持 JPG、PNG、GIF、WebP、BMP、SVG 格式。`)
      clearErrorLater()
      return
    }

    const isLargeFile = file.size > MAX_IMAGE_SIZE

    const doInsert = () => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const base64Data = e.target?.result as string
        if (base64Data) {
          const altText = file.name.replace(/\.[^/.]+$/, '') || 'image'
          insertImageAtCursor(base64Data, altText)
          setSuccess(`图片 "${file.name}" 插入成功！`)
          clearSuccessLater()
        }
      }

      reader.onerror = () => {
        setError(`图片读取失败: ${reader.error?.message || '未知错误'}`)
        clearErrorLater()
      }

      reader.readAsDataURL(file)
    }

    if (isLargeFile) {
      setLargeImageConfirm({ file, onConfirm: doInsert })
      return
    }

    doInsert()
  }, [clearErrorLater, clearSuccessLater, enabled, insertImageAtCursor, setError, setSuccess])

  const handleImageFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!enabled) return
    const file = event.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
    event.target.value = ''
  }, [enabled, processImageFile])

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!enabled) return
    const items = event.clipboardData.items
    let imageFound = false

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      if (item.type.startsWith('image/')) {
        event.preventDefault()
        imageFound = true

        const file = item.getAsFile()
        if (file) {
          processImageFile(file)
        }
        break
      }
    }

    if (!imageFound) {
      const files = event.clipboardData.files
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.type.startsWith('image/')) {
          event.preventDefault()
          processImageFile(file)
          break
        }
      }
    }
  }, [enabled, processImageFile])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (!enabled) return
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }, [enabled])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    if (!enabled) return
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }, [enabled])

  const handleDrop = useCallback((event: React.DragEvent) => {
    if (!enabled) return
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    const files = event.dataTransfer.files

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        processImageFile(file)
        break
      }
    }
  }, [enabled, processImageFile])

  return {
    isDragging,
    largeImageConfirm,
    setLargeImageConfirm,
    handleImageFileChange,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
