import React, { useState, useEffect, useRef, useCallback } from 'react'

interface WelcomePageProps {
  onCreateFile: () => void
  onOpenBlogStudio: () => void
  onToggleSidebar: () => void
  onToggleTheme: () => void
  sidebarVisible: boolean
  isDark: boolean
}

const WelcomePage: React.FC<WelcomePageProps> = ({
  onCreateFile,
  onOpenBlogStudio,
  onToggleSidebar,
  onToggleTheme,
  sidebarVisible,
  isDark,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [typedTitle, setTypedTitle] = useState('')
  const [typedSub, setTypedSub] = useState('')
  const [showCards, setShowCards] = useState(false)
  const [cardHover, setCardHover] = useState<number | null>(null)
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 })
  const titleFull = 'Markdown Editor'
  const subFull = '重新定义你的写作体验，让每一行文字都成为艺术'

  useEffect(() => {
    let i = 0
    let subTimer: ReturnType<typeof setInterval> | undefined
    let cardsTimer: ReturnType<typeof setTimeout> | undefined
    const timer = setInterval(() => {
      if (i <= titleFull.length) {
        setTypedTitle(titleFull.slice(0, i))
        i++
      } else {
        clearInterval(timer)
        let j = 0
        subTimer = setInterval(() => {
          if (j <= subFull.length) {
            setTypedSub(subFull.slice(0, j))
            j++
          } else {
            if (subTimer) clearInterval(subTimer)
            cardsTimer = setTimeout(() => setShowCards(true), 200)
          }
        }, 40)
      }
    }, 80)
    return () => {
      clearInterval(timer)
      if (subTimer) clearInterval(subTimer)
      if (cardsTimer) clearTimeout(cardsTimer)
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    })
  }, [])

  const handleCardMouseMove = useCallback((e: React.MouseEvent, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setCardTilt({ x: y * -15, y: x * 15 })
    setCardHover(index)
  }, [])

  const handleCardMouseLeave = useCallback(() => {
    setCardHover(null)
    setCardTilt({ x: 0, y: 0 })
  }, [])

  const cards = [
    {
      title: '创建新文件',
      description: '开启全新的创作旅程',
      onClick: onCreateFile,
      color: '#f59e0b',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      title: '博客工作室',
      description: '设计属于你的个人博客',
      onClick: onOpenBlogStudio,
      color: '#a78bfa',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
    },
    {
      title: sidebarVisible ? '隐藏文件列表' : '显示文件列表',
      description: sidebarVisible ? '收起侧边栏' : '展开文件列表开始创作',
      onClick: onToggleSidebar,
      color: '#34d399',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      title: isDark ? '浅色模式' : '深色模式',
      description: isDark ? '切换到明亮的世界' : '沉浸在深色中',
      onClick: onToggleTheme,
      color: '#f472b6',
      icon: isDark ? (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
    },
  ]

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? '#0f0f14' : '#faf8f5',
        color: isDark ? '#e4e4e7' : '#3c2415',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)',
          left: `${mousePos.x * 100 - 30}%`,
          top: `${mousePos.y * 100 - 30}%`,
          transition: 'left 0.3s ease-out, top 0.3s ease-out',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(244,114,182,0.08) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(244,114,182,0.1) 0%, transparent 70%)',
          left: `${mousePos.x * 100 - 20}%`,
          top: `${mousePos.y * 100 - 20}%`,
          transition: 'left 0.5s ease-out, top 0.5s ease-out',
          filter: 'blur(80px)',
        }} />
      </div>

      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)',
          top: '-10%',
          right: '-5%',
          animation: 'welcomeFloat1 20s ease-in-out infinite',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)',
          bottom: '-5%',
          left: '-5%',
          animation: 'welcomeFloat2 25s ease-in-out infinite',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(244,114,182,0.05) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)',
          top: '40%',
          left: '30%',
          animation: 'welcomeFloat3 18s ease-in-out infinite',
          filter: 'blur(60px)',
        }} />
      </div>

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '200px',
        background: isDark
          ? 'linear-gradient(to top, rgba(15,15,20,0.6), transparent)'
          : 'linear-gradient(to top, rgba(250,248,245,0.6), transparent)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: '800px',
        padding: '0 24px',
      }}>
        <div style={{
          fontSize: '11px',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          opacity: 0.4,
          marginBottom: '24px',
          fontWeight: 500,
        }}>
          创新 · 创意 · 艺术
        </div>

        <h1 key={isDark ? 'dark' : 'light'} style={{
          fontSize: 'clamp(40px, 7vw, 72px)',
          fontWeight: 800,
          lineHeight: 1.1,
          margin: 0,
          background: isDark
            ? 'linear-gradient(135deg, #fbbf24, #a78bfa, #f472b6, #fbbf24)'
            : 'linear-gradient(135deg, #d97706, #a78bfa, #f472b6, #d97706)',
          backgroundSize: '300% 300%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent',
          animation: 'welcomeGradientShift 6s ease infinite',
          letterSpacing: '-1px',
          minHeight: '1.2em',
        }}>
          {typedTitle}
          <span style={{
            display: 'inline-block',
            width: '3px',
            height: '0.85em',
            backgroundColor: isDark ? '#a78bfa' : '#d97706',
            marginLeft: '2px',
            verticalAlign: 'text-bottom',
            animation: typedTitle.length < titleFull.length ? 'welcomeBlink 0.6s step-end infinite' : 'none',
            opacity: typedTitle.length < titleFull.length ? 1 : 0,
          }} />
        </h1>

        <p style={{
          fontSize: 'clamp(14px, 2vw, 18px)',
          opacity: 0.5,
          lineHeight: 1.6,
          margin: '20px 0 0',
          maxWidth: '500px',
          minHeight: '1.6em',
        }}>
          {typedSub}
          {typedSub.length < subFull.length && typedTitle.length >= titleFull.length && (
            <span style={{
              display: 'inline-block',
              width: '2px',
              height: '1em',
              backgroundColor: isDark ? '#a78bfa' : '#d97706',
              marginLeft: '1px',
              verticalAlign: 'text-bottom',
              animation: 'welcomeBlink 0.6s step-end infinite',
            }} />
          )}
        </p>
      </div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        gap: '16px',
        marginTop: '48px',
        padding: '0 24px',
        maxWidth: '100%',
        overflowX: 'auto',
        opacity: showCards ? 1 : 0,
        transform: showCards ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            onMouseMove={(e) => handleCardMouseMove(e, index)}
            onMouseLeave={handleCardMouseLeave}
            style={{
              minWidth: '180px',
              maxWidth: '200px',
              padding: '24px',
              borderRadius: '16px',
              background: isDark
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(255,255,255,0.7)',
              border: cardHover === index
                ? `1px solid ${card.color}40`
                : isDark
                  ? '1px solid rgba(255,255,255,0.06)'
                  : '1px solid rgba(0,0,0,0.06)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              cursor: 'pointer',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              transform: cardHover === index
                ? `perspective(600px) rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg) scale(1.04)`
                : 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)',
              boxShadow: cardHover === index
                ? `0 8px 32px ${card.color}15, 0 0 0 1px ${card.color}20`
                : isDark
                  ? '0 2px 8px rgba(0,0,0,0.2)'
                  : '0 2px 8px rgba(0,0,0,0.04)',
              position: 'relative',
              overflow: 'hidden',
              animation: `welcomeCardIn 0.5s ease ${index * 0.1}s both`,
            }}
          >
            {cardHover === index && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(105deg, transparent 40%, ${card.color}08 45%, ${card.color}12 50%, ${card.color}08 55%, transparent 60%)`,
                pointerEvents: 'none',
                animation: 'welcomeGloss 0.6s ease forwards',
              }} />
            )}
            <div style={{
              color: cardHover === index ? card.color : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'),
              marginBottom: '14px',
              transition: 'color 0.3s ease',
            }}>
              {card.icon}
            </div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              margin: '0 0 6px 0',
              color: isDark ? '#e4e4e7' : '#3c2415',
            }}>
              {card.title}
            </h3>
            <p style={{
              fontSize: '12px',
              margin: 0,
              opacity: 0.45,
              lineHeight: 1.5,
            }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 1,
        opacity: showCards ? 0.3 : 0,
        transition: 'opacity 0.5s ease',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
        }}>
          <span>选择一个功能开始</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'welcomeBounce 2s ease-in-out infinite' }}>
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes welcomeBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes welcomeGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes welcomeFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 20px) scale(1.05); }
          66% { transform: translate(20px, -10px) scale(0.95); }
        }
        @keyframes welcomeFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.08); }
          66% { transform: translate(-15px, 15px) scale(0.92); }
        }
        @keyframes welcomeFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 20px) scale(1.1); }
        }
        @keyframes welcomeCardIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes welcomeGloss {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        @keyframes welcomeBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  )
}

export default WelcomePage
