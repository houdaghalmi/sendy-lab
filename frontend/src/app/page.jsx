'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function IntroPage() {
  const [phase, setPhase] = useState(0)
  const [hint, setHint] = useState(false)
  const router = useRouter()

  const handleDoorClick = () => {
    if (phase !== 0) return
    setPhase(1)
    setTimeout(() => setPhase(2), 2400)
    setTimeout(() => router.push('/dashboard'), 3100)
  }

  const bubbles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      size: 6 + Math.random() * 14,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      dur: 5 + Math.random() * 6,
    }))
  ).current

  return (
    <div className="intro-root">
      <style>{`
        .intro-root {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #020c1a;
          margin: 0;
          padding: 0;
        }

        .scene-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          /* Transform origin centered on the door area */
          transform-origin: 50% 74%;
          will-change: transform, filter;
          user-select: none;
          pointer-events: none;
          
          /* FIX: Changed scale from 0.92 to 1 to fill full width */
          transform: scale(1);
          
          filter: brightness(0.88) saturate(1.1);
          transition: transform 2.5s cubic-bezier(0.25, 0.1, 0.2, 1),
                      filter 2.5s ease;
        }

        .scene-img.phase-1,
        .scene-img.phase-2 {
          /* Zoom into the door */
          transform: scale(6);
          filter: brightness(0.5) saturate(0.7) blur(1px);
        }

        .vignette {
          position: absolute;
          inset: 0;
          box-shadow: inset 0 0 140px 40px rgba(2,12,26,0.85);
          z-index: 2;
          pointer-events: none;
        }

        .bubbles-texture {
          position: absolute;
          inset: 0;
          background: url('/bubbles-bg.png') center/cover no-repeat;
          opacity: 0.18;
          z-index: 3;
          pointer-events: none;
          animation: texture-drift 20s ease-in-out infinite alternate;
        }

        @keyframes texture-drift {
          0%   { transform: scale(1)    translateY(0); }
          100% { transform: scale(1.06) translateY(-2%); }
        }

        @keyframes bubble-rise {
          0%   { transform: translateY(0) scale(1);    opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-110vh) scale(1.15); opacity: 0; }
        }

        .bubble {
          position: absolute;
          bottom: -30px;
          border-radius: 50%;
          border: 1.5px solid rgba(144,224,239,0.4);
          background: rgba(144,224,239,0.06);
          animation: bubble-rise var(--dur) var(--delay) ease-in infinite;
          z-index: 4;
          pointer-events: none;
        }

        .door-btn {
          position: absolute;
          left: 50%;
          top: 74%;
          transform: translateX(-50%);
          /* Larger hit area, placed lower on the door */
          width: clamp(130px, 16vw, 220px);
          height: clamp(150px, 21vw, 280px);
          border-radius: 50% 50% 4px 4px;
          background: transparent;
          border: 2px solid transparent;
          cursor: pointer;
          z-index: 10;
          transition: background 0.3s, border-color 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .door-btn.hinted {
          background: rgba(56,212,234,0.1);
          border-color: rgba(56,212,234,0.3);
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; box-shadow: 0 0 20px 6px rgba(56,212,234,0.35); }
          50%       { opacity: 0.9; box-shadow: 0 0 40px 16px rgba(56,212,234,0.6); }
        }

        .glow-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50% 50% 6px 6px;
          animation: glow-pulse 1.4s ease-in-out infinite;
          pointer-events: none;
        }

        .title-wrap {
          position: absolute;
          top: 7%;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          z-index: 10;
          pointer-events: none;
        }

        .title-main {
          font-family: var(--font-fredoka), Georgia, serif;
          font-size: clamp(24px, 5vw, 48px);
          font-weight: 900;
          color: #f5c842;
          text-shadow: 0 2px 0 #7d5b1d, 0 4px 10px rgba(0, 0, 0, 0.35);
          letter-spacing: 0.02em;
        }

        .title-sub {
          margin-top: 8px;
          font-size: clamp(12px, 1.6vw, 16px);
          color: rgba(144,224,239,0.8);
          letter-spacing: 0.25em;
          text-transform: uppercase;
          font-family: var(--font-nunito), sans-serif;
        }

        .hint-label {
          position: absolute;
          bottom: 8%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          pointer-events: none;
          animation: hint-bounce 2.5s ease-in-out infinite;
        }

        @keyframes hint-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(-10px); }
        }

        .hint-text {
          font-size: 14px;
          font-weight: 600;
          color: rgba(144,224,239,0.9);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-shadow: 0 2px 10px rgba(0,0,0,1);
          font-family: var(--font-nunito), sans-serif;
        }

        .hint-arrow {
          margin-top: 4px;
          font-size: 20px;
          color: #38d4ea;
        }

        .dark-cover {
          position: fixed;
          inset: 0;
          background: #020c1a;
          z-index: 40;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.8s ease;
        }

        .dark-cover.visible {
          opacity: 1;
        }
      `}</style>

      <img
        src="/treedome.jpg"
        alt="Sandy's Treedome"
        className={`scene-img ${phase >= 1 ? 'phase-1' : ''}`}
      />

      <div className="vignette" />

      {phase === 0 && <div className="bubbles-texture" />}

      {phase === 0 && bubbles.map(b => (
        <div
          key={b.id}
          className="bubble"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            '--dur': `${b.dur}s`,
            '--delay': `${b.delay}s`,
          }}
        />
      ))}

      {phase === 0 && (
        <div className="title-wrap">
          <div className="title-main">Sandy's Treedome Lab</div>
          <div className="title-sub">AI-Powered Lab Management System</div>
        </div>
      )}

      {phase === 0 && (
        <button
          className={`door-btn ${hint ? 'hinted' : ''}`}
          onClick={handleDoorClick}
          onMouseEnter={() => setHint(true)}
          onMouseLeave={() => setHint(false)}
          aria-label="Enter Sandy's Lab"
        >
          {hint && <div className="glow-ring" />}
        </button>
      )}

      {phase === 0 && (
        <div className="hint-label">
          <div className="hint-text">Click the door to enter</div>
          <div className="hint-arrow">↑</div>
        </div>
      )}

      <div className={`dark-cover ${phase >= 2 ? 'visible' : ''}`} />
    </div>
  )
}