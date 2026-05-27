import React, { useState, useRef, useEffect, useCallback } from 'react'
import { FileNode } from '../../types/fileManager'
import { useFileManager } from './FileManagerContext'

interface CreateFileModalProps {
  isOpen: boolean
  defaultFolderId: string
  onConfirm: (fileName: string, folderId: string) => void
  onCancel: () => void
}

interface FolderItem {
  id: string
  name: string
  depth: number
}

const CreateFileModal: React.FC<CreateFileModalProps> = ({
  isOpen,
  defaultFolderId,
  onConfirm,
  onCancel
}) => {
  const { rootFolder } = useFileManager()
  const [fileName, setFileName] = useState('新文件.md')
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  const [selectedFolderName, setSelectedFolderName] = useState<string>('')
  const [inputFocused, setInputFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedFolderIdRef = useRef<string>('')
  const selectedFolderNameRef = useRef<string>('')
  const onConfirmRef = useRef(onConfirm)
  const onCancelRef = useRef(onCancel)
  const hasInitRef = useRef(false)

  useEffect(() => {
    onConfirmRef.current = onConfirm
    onCancelRef.current = onCancel
  }, [onConfirm, onCancel])

  const getFolderTree = useCallback((node: FileNode, depth: number = 0): FolderItem[] => {
    let items: FolderItem[] = []
    if (node.type === 'folder') {
      items.push({ id: node.id, name: node.name, depth })
      if (node.children) {
        for (const child of node.children) {
          if (child.type === 'folder') {
            items = [...items, ...getFolderTree(child, depth + 1)]
          }
        }
      }
    }
    return items
  }, [])

  const folders = getFolderTree(rootFolder)

  useEffect(() => {
    if (isOpen && !hasInitRef.current) {
      hasInitRef.current = true
      const initId = defaultFolderId || (folders.length > 0 ? folders[0].id : 'root')
      const initName = folders.find(f => f.id === initId)?.name || '根目录'
      setSelectedFolderId(initId)
      setSelectedFolderName(initName)
      selectedFolderIdRef.current = initId
      selectedFolderNameRef.current = initName
      setFileName('新文件.md')
      requestAnimationFrame(() => {
        setVisible(true)
        setTimeout(() => {
          inputRef.current?.focus()
          inputRef.current?.select()
        }, 200)
      })
    }
    if (!isOpen) {
      setVisible(false)
      hasInitRef.current = false
    }
  }, [isOpen])

  const handleFolderClick = useCallback((folderId: string, folderName: string) => {
    setSelectedFolderId(folderId)
    setSelectedFolderName(folderName)
    selectedFolderIdRef.current = folderId
    selectedFolderNameRef.current = folderName
  }, [])

  const handleConfirm = useCallback(() => {
    if (fileName.trim()) {
      const finalFolderId = selectedFolderIdRef.current
      onConfirmRef.current(fileName.trim(), finalFolderId)
      onCancelRef.current()
    }
  }, [fileName])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onCancelRef.current()
    }
  }, [handleConfirm])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: visible ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
        backdropFilter: 'blur(4px)',
        transition: 'background-color 0.3s ease',
      }}
      onClick={onCancelRef.current}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--sidebar-bg)',
          border: '1px solid var(--sidebar-border)',
          borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.1)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #a78bfa, #f472b6, #fbbf24)',
          borderRadius: '20px 20px 0 0',
        }} />

        <div style={{ padding: '24px 24px 0' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <h2 style={{
                fontSize: 16,
                fontWeight: 700,
                margin: 0,
                color: 'var(--app-text)',
                letterSpacing: '-0.01em',
              }}>
                创建新文件
              </h2>
              <p style={{
                fontSize: 12,
                margin: '2px 0 0',
                opacity: 0.4,
              }}>
                在指定文件夹中创建 Markdown 文档
              </p>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--app-text)',
              opacity: 0.6,
              marginBottom: 8,
              letterSpacing: '0.03em',
            }}>
              <div style={{
                width: 2,
                height: 10,
                borderRadius: 1,
                background: 'linear-gradient(180deg, #a78bfa, #f472b6)',
                flexShrink: 0,
              }} />
              文件名
            </label>
            <div style={{
              position: 'relative',
            }}>
              <input
                ref={inputRef}
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="请输入文件名..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 14,
                  fontFamily: "'Fira Code', 'Consolas', monospace",
                  border: inputFocused
                    ? '1px solid rgba(167,139,250,0.5)'
                    : '1px solid var(--sidebar-border)',
                  borderRadius: 10,
                  backgroundColor: inputFocused
                    ? 'rgba(167,139,250,0.04)'
                    : 'rgba(255,255,255,0.04)',
                  color: 'var(--app-text)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  boxShadow: inputFocused ? '0 0 0 3px rgba(167,139,250,0.1)' : 'none',
                }}
              />
              {fileName && !fileName.endsWith('.md') && (
                <span style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 11,
                  opacity: 0.3,
                  fontFamily: "'Fira Code', monospace",
                  pointerEvents: 'none',
                }}>
                  .md
                </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--app-text)',
              opacity: 0.6,
              marginBottom: 8,
              letterSpacing: '0.03em',
            }}>
              <div style={{
                width: 2,
                height: 10,
                borderRadius: 1,
                background: 'linear-gradient(180deg, #a78bfa, #f472b6)',
                flexShrink: 0,
              }} />
              目标文件夹
            </label>
            <div style={{
              border: '1px solid var(--sidebar-border)',
              borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.02)',
              overflow: 'hidden',
            }}>
              <div style={{
                maxHeight: 160,
                overflowY: 'auto',
                padding: 4,
              }}>
                {folders.length > 0 ? (
                  folders.map((folder) => {
                    const isSelected = selectedFolderId === folder.id
                    return (
                      <div
                        key={folder.id}
                        onClick={() => handleFolderClick(folder.id, folder.name)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 10px',
                          paddingLeft: `${12 + folder.depth * 18}px`,
                          cursor: 'pointer',
                          borderRadius: 8,
                          backgroundColor: isSelected
                            ? 'rgba(167,139,250,0.08)'
                            : 'transparent',
                          border: isSelected
                            ? '1px solid rgba(167,139,250,0.2)'
                            : '1px solid transparent',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                          marginBottom: 2,
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            left: `${4 + folder.depth * 18}px`,
                            top: 4,
                            bottom: 4,
                            width: 2,
                            borderRadius: 1,
                            background: 'linear-gradient(180deg, #a78bfa, #f472b6)',
                          }} />
                        )}
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: isSelected ? '#a78bfa' : 'var(--sidebar-text)', opacity: isSelected ? 1 : 0.5, transition: 'color 0.15s ease' }}>
                          <path d="M1.5 3C1.5 2.44772 1.94772 2 2.5 2H5.58579C5.851 2 6.10536 2.10536 6.29289 2.29289L7 3H11.5C12.0523 3 12.5 3.44772 12.5 4V11C12.5 11.5523 12.0523 12 11.5 12H2.5C1.94772 12 1.5 11.5523 1.5 11V3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                          <path d="M1.5 5.5H12.5" stroke="currentColor" strokeWidth="1.2"/>
                        </svg>
                        <span style={{
                          fontSize: 13,
                          color: 'var(--sidebar-text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: isSelected ? 500 : 400,
                        }}>
                          {folder.name}
                        </span>
                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={2.5} style={{ marginLeft: 'auto', flexShrink: 0 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div style={{
                    fontSize: 13,
                    textAlign: 'center',
                    padding: '16px 0',
                    opacity: 0.4,
                    color: 'var(--sidebar-text)',
                  }}>
                    没有可用的文件夹
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            backgroundColor: 'rgba(167,139,250,0.06)',
            border: '1px solid rgba(167,139,250,0.12)',
            borderRadius: 10,
            marginBottom: 20,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span style={{ fontSize: 12, color: 'var(--app-text)', opacity: 0.6 }}>
              将创建至
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa' }}>
              {selectedFolderName || '未选择'}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '0 24px 20px',
        }}>
          <button
            onClick={onCancelRef.current}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 500,
              border: '1px solid var(--sidebar-border)',
              borderRadius: 10,
              backgroundColor: 'transparent',
              color: 'var(--app-text)',
              opacity: 0.6,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8'
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 12px rgba(167,139,250,0.3)',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(167,139,250,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(167,139,250,0.3)'
            }}
          >
            创建文件
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateFileModal
