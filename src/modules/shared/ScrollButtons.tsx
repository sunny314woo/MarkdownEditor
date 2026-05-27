import React, { useState, useEffect } from 'react'

interface ScrollButtonsProps {
  scrollContainerRef: React.RefObject<HTMLElement | null>
}

const ScrollButtons: React.FC<ScrollButtonsProps> = ({ scrollContainerRef }) => {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      setShowScrollTop(scrollTop > 100)
      setShowScrollBottom(scrollTop + clientHeight < scrollHeight - 100)
    }

    handleScroll()
    container.addEventListener('scroll', handleScroll, { passive: true })
    const resizeObserver = new ResizeObserver(handleScroll)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [scrollContainerRef])

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToBottom = () => {
    const container = scrollContainerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }

  const hasButtons = showScrollTop || showScrollBottom

  return (
    <div
      className="scroll-buttons-container"
      style={{ opacity: hasButtons ? 1 : 0, pointerEvents: hasButtons ? 'auto' : 'none' }}
    >
      <button
        className="scroll-btn scroll-btn-up"
        onClick={scrollToTop}
        aria-label="滚动到顶部"
        style={{ opacity: showScrollTop ? 1 : 0, pointerEvents: showScrollTop ? 'auto' : 'none' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 4L3 9h10L8 4z" fill="currentColor" />
        </svg>
      </button>
      <button
        className="scroll-btn scroll-btn-down"
        onClick={scrollToBottom}
        aria-label="滚动到底部"
        style={{ opacity: showScrollBottom ? 1 : 0, pointerEvents: showScrollBottom ? 'auto' : 'none' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 12L3 7h10L8 12z" fill="currentColor" />
        </svg>
      </button>
    </div>
  )
}

export default ScrollButtons
