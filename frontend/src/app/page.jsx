'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/*
  Transition phases:
  0  — idle          (scene visible, zoomed out, ambient bubbles)
  1  — diving        (camera slowly zooms toward the door over ~2.5s)
  2  — fading        (dark overlay fades in over 0.6s after zoom)
  navigate → /dashboard
*/

export default function IntroPage() {
  const [phase, setPhase] = useState(0)   /* 0 | 1 | 2 */
  const [hint,  setHint]  = useState(false)
  const router = useRouter()

  const handleDoorClick = () => {
    if (phase !== 0) return

    /* Phase 1 — dive toward door */
    setPhase(1)

    /* Phase 2 — after dive completes, fade to black */
    setTimeout(() => setPhase(2), 2400)

    /* Navigate once black covers the screen */
    setTimeout(() => router.push('/dashboard'), 3100)
  }

  /* Ambient bubble particles */
  const bubbles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size:   6 + Math.random() * 14,
    left:   Math.random() * 100,
    delay:  Math.random() * 5,
    dur:    5 + Math.random() * 6,
  }))

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#020c1a',
        cursor: phase === 0 ? 'default' : 'none',
      }}
    >
      {/* ── Keyframes injected once ─────────────────────────────── */}
      <style>{`
        @keyframes bubble-rise {
          0%   { transform: translateY(0) scale(1);   opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-110vh) scale(1.15); opacity: 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; box-shadow: 0 0 20px 6px rgba(56,212,234,0.35); }
          50%       { opacity: 0.9; box-shadow: 0 0 40px 16px rgba(56,212,234,0.6); }
        }
        @keyframes hint-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(-8px); }
        }
        @keyframes text-float {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) translateY(0); }
          50%       { opacity: 1;   transform: translateX(-50%) translateY(-5px); }
        }

        /* --- THE DIVE ---
           Transform origin sits at the door: ~50% horizontal, ~67% vertical
           (adjust if your image proportions differ) */
        .scene-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          transform-origin: 50% 74%;
          transition:
            transform 2.5s cubic-bezier(0.25, 0.1, 0.2, 1),
            filter     2.5s ease;
          will-change: transform, filter;
          user-select: none;
          pointer-events: none;
        }
        .scene-img.idle   { transform: scale(1);    filter: brightness(0.88) saturate(1.1); }
        .scene-img.diving { transform: scale(5.5);  filter: brightness(0.5)  saturate(0.7) blur(1px); }

        /* Dark overlay fade */
        .dark-cover {
          position: fixed;
          inset: 0;
          background: #020c1a;
          z-index: 40;
          pointer-events: none;
          transition: opacity 0.8s ease;
        }
        .dark-cover.hidden  { opacity: 0; }
        .dark-cover.visible { opacity: 1; }
      `}</style>

      {/* ── Treedome scene ─────────────────────────────────────── */}
      {/* Outer wrapper gives the "pushed back" look via slight zoom-out + border */}
      <div style={{
        position: 'absolute',
        inset: 0,
        /* Subtle dark vignette so edges frame the scene */
        boxShadow: 'inset 0 0 140px 40px rgba(2,12,26,0.85)',
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      <img
        src="/images/treedome.jpg"
        alt="Sandy's Treedome"
        className={`scene-img ${phase >= 1 ? 'diving' : 'idle'}`}
        style={{
          /* Start slightly zoomed OUT so there's ocean scenery breathing room */
          transform: phase >= 1
            ? 'scale(5.5)'
            : 'scale(0.92)',  /* <-- this is the "pushed back" effect */
          zIndex: 1,
        }}
      />

      {/* ── Ambient bubble particles ────────────────────────────── */}
      {phase === 0 && bubbles.map(b => (
        <div
          key={b.id}
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: `${b.left}%`,
            width:  b.size,
            height: b.size,
            borderRadius: '50%',
            border: '1.5px solid rgba(144,224,239,0.4)',
            background: 'rgba(144,224,239,0.06)',
            animation: `bubble-rise ${b.dur}s ${b.delay}s ease-in infinite`,
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* ── Title label ─────────────────────────────────────────── */}
      {phase === 0 && (
        <div style={{
          position: 'absolute',
          top: '7%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 10,
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(22px, 4vw, 42px)',
            fontWeight: 700,
            color: '#e8f4fd',
            textShadow: '0 2px 30px rgba(0,0,0,0.9), 0 0 60px rgba(23,184,207,0.4)',
            letterSpacing: '0.06em',
            lineHeight: 1.2,
          }}>
            Sandy's Treedome Lab
          </div>
          <div style={{
            marginTop: 8,
            fontSize: 'clamp(11px, 1.5vw, 15px)',
            color: 'rgba(144,224,239,0.7)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 500,
          }}>
            AI-Powered Lab Management System
          </div>
        </div>
      )}

      {/* ── Clickable door hotspot ──────────────────────────────── */}
      {phase === 0 && (
        <button
          onClick={handleDoorClick}
          onMouseEnter={() => setHint(true)}
          onMouseLeave={() => setHint(false)}
          aria-label="Enter Sandy's Lab"
          style={{
            position: 'absolute',
            /* Door center sits at ~50% horizontal, ~68-88% vertical in this image */
            left: '50%',
            top: '68%',
            transform: 'translateX(-50%)',
            width:  'clamp(90px, 10vw, 140px)',
            height: 'clamp(100px, 15vw, 190px)',
            borderRadius: '50% 50% 4px 4px',
            background: hint
              ? 'rgba(56,212,234,0.12)'
              : 'transparent',
            border: hint
              ? '2px solid rgba(56,212,234,0.55)'
              : '2px solid transparent',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background 0.3s, border-color 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Glow ring around door */}
          {hint && (
            <div style={{
              position: 'absolute',
              inset: -6,
              borderRadius: '50% 50% 6px 6px',
              animation: 'glow-pulse 1.4s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
          )}
        </button>
      )}

      {/* ── "Click the door" floating hint ─────────────────────── */}
      {phase === 0 && (
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          pointerEvents: 'none',
          animation: 'hint-bounce 2.5s ease-in-out infinite',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'rgba(144,224,239,0.85)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            textShadow: '0 2px 12px rgba(0,0,0,0.9)',
            fontFamily: 'system-ui, sans-serif',
          }}>
            Click the door to enter
          </div>
          {/* Arrow */}
          <div style={{
            marginTop: 6,
            fontSize: 16,
            color: 'rgba(56,212,234,0.7)',
            lineHeight: 1,
          }}>
            ↑
          </div>
        </div>
      )}

      {/* ── Black fade-to-dark cover ────────────────────────────── */}
      <div className={`dark-cover ${phase >= 2 ? 'visible' : 'hidden'}`} />
    </div>
  )
}