import { useMemo, useState, useCallback, useEffect } from 'react'
import { parseMarkdownHeadings, OutlineItem } from './outlineUtils'

interface OutlineProps {
  content: string
  onHeadingClick?: (headingId: string) => void
  activeHeadingId?: string | null
}

function Outline({ content, onHeadingClick, activeHeadingId }: OutlineProps) {
  const [activeId, setActiveId] = useState<string | null>(activeHeadingId || null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    if (activeHeadingId !== undefined) {
      setActiveId(activeHeadingId)
    }
  }, [activeHeadingId])

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const outline = useMemo(() => parseMarkdownHeadings(content), [content])

  const headingCount = useMemo(() => {
    let count = 0
    const countAll = (items: OutlineItem[]) => {
      for (const item of items) {
        count++
        if (item.children) countAll(item.children)
      }
    }
    countAll(outline)
    return count
  }, [outline])

  const maxDepth = useMemo(() => {
    let max = 0
    const findMax = (items: OutlineItem[], depth: number) => {
      for (const item of items) {
        if (depth > max) max = depth
        if (item.children) findMax(item.children, depth + 1)
      }
    }
    findMax(outline, 1)
    return max
  }, [outline])

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setCollapsedIds(new Set())
  }, [])

  const collapseAll = useCallback(() => {
    const allParentIds = new Set<string>()
    const collectParents = (items: OutlineItem[]) => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          allParentIds.add(item.id)
          collectParents(item.children)
        }
      }
    }
    collectParents(outline)
    setCollapsedIds(allParentIds)
  }, [outline])

  const handleClick = useCallback((id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setActiveId(id)

    if (onHeadingClick) {
      onHeadingClick(id)
    }
  }, [onHeadingClick])

  const hasChildren = (item: OutlineItem): boolean => {
    return !!item.children && item.children.length > 0
  }

  const isCollapsed = (id: string): boolean => {
    return collapsedIds.has(id)
  }

  const getLevelColor = (level: number): string => {
    const colors = [
      'var(--button-primary)',
      '#a78bfa',
      '#f472b6',
      '#34d399',
      '#fbbf24',
      '#fb923c',
    ]
    return colors[(level - 1) % colors.length]
  }

  const getLevelDotSize = (level: number): number => {
    return Math.max(4, 8 - level)
  }

  const renderOutlineItem = (item: OutlineItem, depth: number = 0) => {
    const hasKids = hasChildren(item)
    const collapsed = isCollapsed(item.id)
    const isActive = activeId === item.id
    const isHovered = hoveredId === item.id
    const levelColor = getLevelColor(item.level)
    const dotSize = getLevelDotSize(item.level)

    return (
      <div key={item.id}>
        <div
          className="flex items-center"
          style={{ position: 'relative' }}
        >
          {depth > 0 && (
            <div style={{
              position: 'absolute',
              left: 12 + (depth - 1) * 20,
              top: 0,
              bottom: 0,
              width: '1px',
              backgroundColor: 'var(--sidebar-border)',
              opacity: 0.5,
            }} />
          )}

          {hasKids && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleCollapse(item.id)
              }}
              style={{
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--sidebar-text)',
                opacity: 0.4,
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                borderRadius: 4,
                transition: 'all 0.15s ease',
                marginLeft: depth * 20,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8'
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.4'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              aria-label={collapsed ? '展开' : '折叠'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  width: 12,
                  height: 12,
                  transition: 'transform 0.2s ease',
                  transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
          {!hasKids && <div style={{ width: 22, flexShrink: 0, marginLeft: depth * 20 }} />}

          <button
            onClick={(e) => handleClick(item.id, e)}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              flex: 1,
              textAlign: 'left',
              padding: '5px 8px 5px 6px',
              fontSize: item.level <= 2 ? 13 : 12,
              fontWeight: isActive ? 600 : (item.level <= 2 ? 500 : 400),
              fontFamily: "'Inter', -apple-system, sans-serif",
              transition: 'all 0.15s ease',
              color: isActive ? levelColor : 'var(--sidebar-text)',
              backgroundColor: isActive
                ? `rgba(59, 130, 246, 0.08)`
                : isHovered
                  ? 'rgba(59, 130, 246, 0.04)'
                  : 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 6,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              outline: 'none',
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 2,
                height: 14,
                borderRadius: 1,
                background: `linear-gradient(to bottom, ${levelColor}, ${getLevelColor(item.level + 1)})`,
              }} />
            )}

            <div style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: isActive ? levelColor : 'transparent',
              border: isActive ? 'none' : `1.5px solid ${isHovered ? levelColor : 'var(--sidebar-border)'}`,
              transition: 'all 0.15s ease',
              opacity: isActive ? 1 : (isHovered ? 0.8 : 0.5),
            }} />

            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              paddingLeft: isActive ? 4 : 0,
            }}>
              {item.text}
            </span>

            {hasKids && item.children && (
              <span style={{
                fontSize: 10,
                opacity: 0.3,
                flexShrink: 0,
                marginLeft: 'auto',
                fontFamily: "'Inter', -apple-system, sans-serif",
              }}>
                {item.children.length}
              </span>
            )}
          </button>
        </div>

        {hasKids && !collapsed && (
          <div>
            {item.children!.map((child) => renderOutlineItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const getParentIds = useCallback((items: OutlineItem[]): Set<string> => {
    const allParentIds = new Set<string>()
    const collectParents = (items: OutlineItem[]) => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          allParentIds.add(item.id)
          collectParents(item.children)
        }
      }
    }
    collectParents(items)
    return allParentIds
  }, [])

  const hasCollapsibleItems = useMemo(() => {
    const check = (items: OutlineItem[]): boolean => {
      for (const item of items) {
        if (item.children && item.children.length > 0) return true
        if (item.children && check(item.children)) return true
      }
      return false
    }
    return check(outline)
  }, [outline])

  const isAllExpanded = useMemo(() => {
    if (!hasCollapsibleItems) return false
    return collapsedIds.size === 0
  }, [hasCollapsibleItems, collapsedIds.size])

  const isAllCollapsed = useMemo(() => {
    if (!hasCollapsibleItems) return false
    const parentIds = getParentIds(outline)
    return collapsedIds.size === parentIds.size
  }, [hasCollapsibleItems, getParentIds, outline, collapsedIds.size])

  const smartToggle = useCallback(() => {
    if (!hasCollapsibleItems) return
    if (isAllCollapsed || !isAllExpanded) {
      expandAll()
    } else {
      collapseAll()
    }
  }, [hasCollapsibleItems, isAllCollapsed, isAllExpanded, expandAll, collapseAll])

  return (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        position: 'relative',
      }}
    >
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 1,
        background: 'linear-gradient(to bottom, var(--button-primary), #a78bfa, transparent)',
        opacity: 0.3,
        pointerEvents: 'none',
      }} />

      <div style={{ padding: '12px 16px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 3,
              height: 16,
              borderRadius: 2,
              background: 'linear-gradient(to bottom, var(--button-primary), #a78bfa)',
            }} />
            <span style={{
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: '0.03em',
              color: 'var(--sidebar-text)',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}>
              大纲
            </span>
            {headingCount > 0 && (
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--button-primary)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                padding: '1px 6px',
                borderRadius: 10,
                fontFamily: "'Inter', -apple-system, sans-serif",
              }}>
                {headingCount}
              </span>
            )}
          </div>
          {hasCollapsibleItems && (
            <button
              onClick={smartToggle}
              style={{
                color: 'var(--sidebar-text)',
                padding: '4px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                backgroundColor: 'transparent',
                border: '1px solid var(--sidebar-border)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 10,
                fontWeight: 500,
                fontFamily: "'Inter', -apple-system, sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.06)'
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'var(--sidebar-border)'
              }}
              title={isAllCollapsed || !isAllExpanded ? '全部展开' : '全部折叠'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  width: 12,
                  height: 12,
                  transition: 'transform 0.2s ease',
                  transform: isAllCollapsed || !isAllExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isAllCollapsed || !isAllExpanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
                )}
              </svg>
              <span>{isAllCollapsed || !isAllExpanded ? '展开' : '折叠'}</span>
            </button>
          )}
        </div>

        {headingCount > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: 0.4,
          }}>
            {Array.from({ length: Math.min(maxDepth, 6) }, (_, i) => (
              <div key={i} style={{
                width: 4 + (6 - i),
                height: 4 + (6 - i),
                borderRadius: '50%',
                backgroundColor: getLevelColor(i + 1),
                opacity: 0.6,
              }} />
            ))}
            <span style={{
              fontSize: 10,
              color: 'var(--sidebar-text)',
              marginLeft: 4,
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}>
              {maxDepth} 层
            </span>
          </div>
        )}

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'linear-gradient(to right, var(--button-primary), #a78bfa, transparent)',
        }} />
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 8px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: 'linear-gradient(to bottom, var(--sidebar-bg), transparent)',
          pointerEvents: 'none',
          zIndex: 2,
        }} />

        {outline.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--sidebar-text)',
            opacity: 0.4,
            gap: 8,
          }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: 32, height: 32, opacity: 0.4 }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span style={{ fontSize: 12, fontFamily: "'Inter', -apple-system, sans-serif" }}>无标题</span>
            <span style={{ fontSize: 10, opacity: 0.6, fontFamily: "'Inter', -apple-system, sans-serif" }}>使用 # 添加标题</span>
          </div>
        ) : (
          outline.map((item) => renderOutlineItem(item, 0))
        )}
      </div>
    </div>
  )
}

export default Outline
