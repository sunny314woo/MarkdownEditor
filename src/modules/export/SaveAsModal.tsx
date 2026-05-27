import { useState, useCallback, useEffect, useRef } from 'react'
import {
  generateMarkdownBlob,
  generateHtmlBlob,
  generatePdf,
  downloadBlob,
  isFileSystemAccessSupported,
  FORMAT_EXTENSIONS,
} from './exportUtils'

interface SaveAsModalProps {
  isOpen: boolean
  onClose: () => void
  content: string
  defaultFileName: string
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

const FORMAT_OPTIONS = [
  { value: 'md', label: 'Markdown (.md)' },
  { value: 'html', label: 'HTML (.html)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
]

const MIME_TYPES: Record<string, string> = {
  md: 'text/markdown',
  html: 'text/html',
  pdf: 'application/pdf',
}

type SaveLocationState =
  | { type: 'none' }
  | { type: 'file'; handle: FileSystemFileHandle; name: string }
  | { type: 'directory'; handle: FileSystemDirectoryHandle; name: string }

type FilePickerWindow = Window & {
  showSaveFilePicker: (options?: ShowSaveFilePickerOptions) => Promise<FileSystemFileHandle>
  showDirectoryPicker: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
}

function getErrorInfo(err: unknown): { name: string; message: string } {
  if (err instanceof Error) {
    return { name: err.name, message: err.message || '未知错误' }
  }
  return { name: '', message: '未知错误' }
}

export default function SaveAsModal({
  isOpen,
  onClose,
  content,
  defaultFileName,
  onSuccess,
  onError,
}: SaveAsModalProps) {
  const [fileName, setFileName] = useState(defaultFileName)
  const [format, setFormat] = useState('md')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveLocation, setSaveLocation] = useState<SaveLocationState>({ type: 'none' })
  const [isSelectingLocation, setIsSelectingLocation] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const fsAccessSupported = isFileSystemAccessSupported()

  useEffect(() => {
    if (isOpen) {
      setFileName(defaultFileName)
      setFormat('md')
      setError(null)
      setIsSaving(false)
      setSaveLocation({ type: 'none' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, defaultFileName])

  const fullFileName = `${fileName.replace(/\.(md|html|pdf)$/i, '')}${FORMAT_EXTENSIONS[format]}`

  const locationDisplayText = (() => {
    if (!fsAccessSupported) return '浏览器默认下载位置'
    switch (saveLocation.type) {
      case 'file':
        return saveLocation.name
      case 'directory':
        return `${saveLocation.name}/`
      default:
        return '未选择，将使用浏览器默认下载'
    }
  })()

  const handleSelectFileLocation = useCallback(async () => {
    if (!fsAccessSupported) return

    setIsSelectingLocation(true)
    try {
      const handle = await (window as unknown as FilePickerWindow).showSaveFilePicker({
        suggestedName: fullFileName,
        types: [{
          description: FORMAT_OPTIONS.find(f => f.value === format)?.label || 'File',
          accept: { [MIME_TYPES[format]]: [FORMAT_EXTENSIONS[format]] },
        }],
      })

      setSaveLocation({ type: 'file', handle, name: handle.name })
      const pickedName = handle.name
      const ext = FORMAT_EXTENSIONS[format]
      if (pickedName.endsWith(ext)) {
        setFileName(pickedName.slice(0, -ext.length))
      }
      setError(null)
    } catch (err) {
      const { name, message } = getErrorInfo(err)
      if (name !== 'AbortError') {
        setError(`选择位置失败: ${message}`)
      }
    } finally {
      setIsSelectingLocation(false)
    }
  }, [fsAccessSupported, fullFileName, format])

  const handleSelectDirectory = useCallback(async () => {
    if (!fsAccessSupported) return

    setIsSelectingLocation(true)
    try {
      const dirHandle = await (window as unknown as FilePickerWindow).showDirectoryPicker({ mode: 'readwrite' })
      setSaveLocation({ type: 'directory', handle: dirHandle, name: dirHandle.name })
      setError(null)
    } catch (err) {
      const { name, message } = getErrorInfo(err)
      if (name !== 'AbortError') {
        setError(`选择文件夹失败: ${message}`)
      }
    } finally {
      setIsSelectingLocation(false)
    }
  }, [fsAccessSupported])

  const handleSave = useCallback(async () => {
    if (!fileName.trim()) {
      setError('请输入文件名')
      return
    }

    setIsSaving(true)
    setError(null)

    const cleanFileName = fileName.replace(/\.(md|html|pdf)$/i, '')
    const fullOutputName = `${cleanFileName}${FORMAT_EXTENSIONS[format]}`

    try {
      if (saveLocation.type === 'file') {
        if (format === 'pdf') {
          const previewElement = document.querySelector('.markdown-preview') as HTMLElement
          if (!previewElement) throw new Error('Preview element not found')
          await generatePdf(previewElement, fullOutputName)
        } else {
          let blob: Blob
          if (format === 'md') {
            blob = generateMarkdownBlob(content)
          } else {
            blob = await generateHtmlBlob(content)
          }
          const writable = await saveLocation.handle.createWritable()
          await writable.write(blob)
          await writable.close()
        }
        onSuccess(`文件已保存为 ${saveLocation.name}`)
        onClose()
      } else if (saveLocation.type === 'directory') {
        const fileHandle = await saveLocation.handle.getFileHandle(fullOutputName, { create: true })

        if (format === 'pdf') {
          const previewElement = document.querySelector('.markdown-preview') as HTMLElement
          if (!previewElement) throw new Error('Preview element not found')
          await generatePdf(previewElement, fullOutputName)
        } else {
          let blob: Blob
          if (format === 'md') {
            blob = generateMarkdownBlob(content)
          } else {
            blob = await generateHtmlBlob(content)
          }
          const writable = await fileHandle.createWritable()
          await writable.write(blob)
          await writable.close()
        }
        onSuccess(`文件已保存到 ${saveLocation.name}/${fullOutputName}`)
        onClose()
      } else {
        if (format === 'pdf') {
          const previewElement = document.querySelector('.markdown-preview') as HTMLElement
          if (!previewElement) throw new Error('Preview element not found')
          await generatePdf(previewElement, fullOutputName)
        } else {
          let blob: Blob
          if (format === 'md') {
            blob = generateMarkdownBlob(content)
          } else {
            blob = await generateHtmlBlob(content)
          }
          downloadBlob(blob, fullOutputName)
        }
        onSuccess(`文件已下载为 ${fullOutputName}`)
        onClose()
      }
    } catch (err) {
      const { name, message: msg } = getErrorInfo(err)
      if (name === 'AbortError') {
        setIsSaving(false)
        return
      }
      setError(`保存失败: ${msg}`)
      onError(`保存失败: ${msg}`)
    } finally {
      setIsSaving(false)
    }
  }, [fileName, format, content, saveLocation, onSuccess, onError, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }, [onClose, handleSave])

  if (!isOpen) return null

  return (
    <div
      className="save-as-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={handleKeyDown}
    >
      <div className="save-as-modal" role="dialog" aria-modal="true" aria-label="另存为">
        <div className="save-as-header">
          <h3 className="save-as-title">另存为</h3>
          <button
            onClick={onClose}
            className="save-as-close-btn"
            aria-label="关闭"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="save-as-body">
          <div className="save-as-field">
            <label className="save-as-label" htmlFor="save-filename">
              文件名
            </label>
            <input
              ref={inputRef}
              id="save-filename"
              type="text"
              value={fileName}
              onChange={(e) => { setFileName(e.target.value); setError(null) }}
              className="save-as-input"
              placeholder="输入文件名"
              autoComplete="off"
            />
          </div>

          <div className="save-as-field">
            <label className="save-as-label" htmlFor="save-format">
              保存格式
            </label>
            <select
              id="save-format"
              value={format}
              onChange={(e) => {
                setFormat(e.target.value)
                setSaveLocation({ type: 'none' })
              }}
              className="save-as-select"
            >
              {FORMAT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {fsAccessSupported && (
            <div className="save-as-field">
              <label className="save-as-label">
                保存位置
              </label>
              <div className="save-as-location-row">
                <div className="save-as-location-display" title={locationDisplayText}>
                  {saveLocation.type === 'directory' && (
                    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--link-color)', opacity: 0.7 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  )}
                  {saveLocation.type === 'file' && (
                    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--link-color)', opacity: 0.7 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  <span className={`save-as-location-text ${saveLocation.type === 'none' ? 'save-as-location-placeholder' : ''}`}>
                    {locationDisplayText}
                  </span>
                </div>
                <div className="save-as-location-actions">
                  <button
                    onClick={handleSelectFileLocation}
                    className="save-as-location-btn"
                    disabled={isSelectingLocation || isSaving}
                    title="选择完整的文件保存路径"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>选择文件</span>
                  </button>
                  <button
                    onClick={handleSelectDirectory}
                    className="save-as-location-btn"
                    disabled={isSelectingLocation || isSaving}
                    title="选择一个文件夹，在其中创建文件"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span>选择文件夹</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="save-as-preview-name">
            <span className="save-as-preview-label">将保存为：</span>
            <span className="save-as-preview-value">{fullFileName}</span>
          </div>

          {!fsAccessSupported && (
            <div className="save-as-compat-hint">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>当前浏览器不支持选择保存位置，将自动下载到默认位置</span>
            </div>
          )}

          {error && (
            <div className="save-as-error">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="save-as-footer">
          <button
            onClick={onClose}
            className="save-as-btn save-as-btn-cancel"
            disabled={isSaving}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="save-as-btn save-as-btn-confirm"
            disabled={isSaving || !fileName.trim()}
          >
            {isSaving ? (
              <span className="save-as-saving">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                保存中...
              </span>
            ) : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
