import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react'
import { FileHistoryManager, UndoRedoState } from '../editor/UndoRedoManager'

interface UndoRedoContextType {
  pushHistory: (fileId: string, content: string, cursorStart: number, cursorEnd: number, groupKey?: string) => void
  undo: (fileId: string) => { content: string; cursorStart: number; cursorEnd: number } | null
  redo: (fileId: string) => { content: string; cursorStart: number; cursorEnd: number } | null
  getState: (fileId: string) => UndoRedoState
  initHistory: (fileId: string, content: string, cursorStart?: number, cursorEnd?: number) => void
  removeFileHistory: (fileId: string) => void
  subscribeState: (listener: () => void) => () => void
}

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(undefined)

export const UndoRedoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const fileHistoryRef = useRef(new FileHistoryManager())
  const [, forceRender] = useState(0)

  useEffect(() => {
    const unsub = fileHistoryRef.current.subscribe(() => {
      forceRender(n => n + 1)
    })
    return unsub
  }, [])

  const pushHistory = useCallback(
    (fileId: string, content: string, cursorStart: number, cursorEnd: number, groupKey?: string) => {
      const manager = fileHistoryRef.current.getManager(fileId)
      manager.push(content, cursorStart, cursorEnd, groupKey)
    },
    []
  )

  const undo = useCallback(
    (fileId: string) => {
      const manager = fileHistoryRef.current.getManager(fileId)
      return manager.undo()
    },
    []
  )

  const redo = useCallback(
    (fileId: string) => {
      const manager = fileHistoryRef.current.getManager(fileId)
      return manager.redo()
    },
    []
  )

  const getState = useCallback(
    (fileId: string): UndoRedoState => {
      const manager = fileHistoryRef.current.getManager(fileId)
      return manager.getState()
    },
    []
  )

  const initHistory = useCallback(
    (fileId: string, content: string, cursorStart: number = 0, cursorEnd: number = 0) => {
      const manager = fileHistoryRef.current.getManager(fileId)
      const currentContent = manager.getCurrentContent()
      if (currentContent === null) {
        manager.initialize(content, cursorStart, cursorEnd)
      }
    },
    []
  )

  const removeFileHistory = useCallback(
    (fileId: string) => {
      fileHistoryRef.current.removeManager(fileId)
    },
    []
  )

  const subscribeState = useCallback(
    (listener: () => void) => {
      return fileHistoryRef.current.subscribe(listener)
    },
    []
  )

  const contextValue: UndoRedoContextType = {
    pushHistory,
    undo,
    redo,
    getState,
    initHistory,
    removeFileHistory,
    subscribeState,
  }

  return (
    <UndoRedoContext.Provider value={contextValue}>
      {children}
    </UndoRedoContext.Provider>
  )
}

export function useUndoRedo(): UndoRedoContextType {
  const context = useContext(UndoRedoContext)
  if (!context) {
    throw new Error('useUndoRedo must be used within an UndoRedoProvider')
  }
  return context
}
