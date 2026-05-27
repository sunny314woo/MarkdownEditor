import { RefObject, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  cancelScrollAnimation,
  getRelativeScrollPosition,
  recordSyncComplete,
  recordSyncStart,
  setRelativeScrollPosition,
  throttle,
} from './scrollSync'

interface UseScrollSyncResult {
  handleEditorScroll: (scrollTop: number, editorElement: HTMLElement) => void
  handlePreviewScroll: (scrollTop: number, previewElement: HTMLElement) => void
  cancelAnimation: () => void
}

export function useScrollSync(
  editorRef: RefObject<HTMLElement>,
  previewRef: RefObject<HTMLElement>
): UseScrollSyncResult {
  const isSyncingRef = useRef(false)
  const lastSyncSourceRef = useRef<'editor' | 'preview' | null>(null)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const throttledEditorScroll = useMemo(() => {
    return throttle((_: number, editorElement: HTMLElement) => {
      if (isSyncingRef.current) return
      if (lastSyncSourceRef.current === 'preview') return

      recordSyncStart()
      lastSyncSourceRef.current = 'editor'
      isSyncingRef.current = true

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)

      const relativePosition = getRelativeScrollPosition(editorElement)

      if (previewRef.current) {
        setRelativeScrollPosition(previewRef.current, relativePosition, false)
      }

      syncTimeoutRef.current = setTimeout(() => {
        isSyncingRef.current = false
        recordSyncComplete()
      }, 50)
    }, 8)
  }, [previewRef])

  const handleEditorScroll = useCallback((scrollTop: number, editorElement: HTMLElement) => {
    throttledEditorScroll(scrollTop, editorElement)
  }, [throttledEditorScroll])

  const throttledPreviewScroll = useMemo(() => {
    return throttle((_: number, previewElement: HTMLElement) => {
      if (isSyncingRef.current) return
      if (lastSyncSourceRef.current === 'editor') return

      recordSyncStart()
      lastSyncSourceRef.current = 'preview'
      isSyncingRef.current = true

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)

      const relativePosition = getRelativeScrollPosition(previewElement)

      if (editorRef.current) {
        setRelativeScrollPosition(editorRef.current, relativePosition, false)
      }

      syncTimeoutRef.current = setTimeout(() => {
        isSyncingRef.current = false
        recordSyncComplete()
      }, 50)
    }, 8)
  }, [editorRef])

  const handlePreviewScroll = useCallback((scrollTop: number, previewElement: HTMLElement) => {
    throttledPreviewScroll(scrollTop, previewElement)
  }, [throttledPreviewScroll])

  const cancelAnimation = useCallback(() => {
    cancelScrollAnimation()
  }, [])

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
      cancelScrollAnimation()
    }
  }, [])

  return { handleEditorScroll, handlePreviewScroll, cancelAnimation }
}
