'use client'
import { useState } from 'react'
import AgentChat from '../../components/AgentChat'

export default function Dashboard() {
  const [role, setRole] = useState('sandy')

  const roles = [
    { id: 'sandy',    emoji: '🤠', label: 'Sandy' },
    { id: 'squidward', emoji: '🦑', label: 'Squidward' },
    { id: 'spongebob', emoji: '🧽', label: 'SpongeBob' },
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      backgroundImage: "url('/background.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center bottom',
      fontFamily: "'Fredoka One', 'Nunito', cursive",
      position: 'relative',
    }}>

      {/* Underwater overlay tint */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,60,120,0.18) 0%, rgba(0,120,180,0.08) 100%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── TOP BAR ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 24px',
        background: 'rgba(0,40,90,0.72)',
        backdropFilter: 'blur(12px)',
        borderBottom: '2px solid rgba(144,220,255,0.18)',
        boxShadow: '0 2px 24px rgba(0,80,180,0.18)',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/Sandy.png" alt="Sandy"
            style={{ width: 40, height: 40, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(245,200,66,0.4))' }} />
          <div>
            <div style={{
              fontSize: 20, fontWeight: 900, letterSpacing: '0.03em',
              color: '#F5C842',
              textShadow: '0 1px 8px rgba(245,200,66,0.4)',
              lineHeight: 1.1,
            }}>
              Sandy AI
            </div>
            <div style={{ fontSize: 10, color: 'rgba(144,220,255,0.7)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Treedome Lab
            </div>
          </div>
        </div>

        {/* Role switcher */}
        <div style={{
          display: 'flex', gap: 6,
          background: 'rgba(0,20,50,0.5)',
          borderRadius: 40, padding: '4px 6px',
          border: '1px solid rgba(144,220,255,0.15)',
        }}>
          {roles.map(r => (
            <button key={r.id} onClick={() => setRole(r.id)} style={{
              padding: '5px 16px', borderRadius: 30, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              fontFamily: 'inherit',
              background: role === r.id
                ? 'linear-gradient(135deg, #F5C842 0%, #F0A500 100%)'
                : 'transparent',
              color: role === r.id ? '#1a1200' : 'rgba(144,220,255,0.75)',
              boxShadow: role === r.id ? '0 2px 12px rgba(245,200,66,0.35)' : 'none',
            }}>
              {r.emoji} {r.label}
            </button>
          ))}
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(82,183,136,0.12)',
            border: '1px solid rgba(82,183,136,0.3)',
            borderRadius: 20, padding: '4px 12px',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#52B788',
              boxShadow: '0 0 6px #52B788',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 11, color: '#52B788', fontWeight: 700, letterSpacing: '0.05em' }}>
              Agents Online
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{
        flex: 1, display: 'flex', overflow: 'hidden',
        position: 'relative', zIndex: 5,
      }}>

        {/* Sandy character sidebar */}
        <div style={{
          width: 200, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          paddingBottom: 0,
          position: 'relative',
        }}>
          <img
            src="/Sandy.png"
            alt="Sandy Cheeks"
            style={{
              width: '190px',
              objectFit: 'contain',
              objectPosition: 'bottom',
              filter: 'drop-shadow(0 8px 32px rgba(0,80,180,0.5))',
              animation: 'sandyFloat 4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Chat panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px 16px 8px',
          overflow: 'hidden',
        }}>
          {/* Bamboo-framed chat window */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(230,245,255,0.92)',
            borderRadius: 24,
            border: '4px solid #C8901A',
            boxShadow: `
              0 0 0 6px rgba(200,144,26,0.3),
              0 8px 40px rgba(0,60,160,0.35),
              inset 0 1px 0 rgba(255,255,255,0.8)
            `,
            overflow: 'hidden',
            position: 'relative',
          }}>

            {/* Bamboo corner accents */}
            {[{top:0,left:0}, {top:0,right:0}, {bottom:0,left:0}, {bottom:0,right:0}].map((pos, i) => (
              <div key={i} style={{
                position: 'absolute', width: 18, height: 18, zIndex: 20,
                background: '#C8901A', borderRadius: 4,
                ...pos,
              }} />
            ))}

            {/* Chat header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 20px',
              background: 'linear-gradient(90deg, #1A6FB5 0%, #1D8ACF 100%)',
              borderBottom: '2px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 18, fontWeight: 900, color: '#fff',
                  letterSpacing: '0.04em',
                  textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}>
                  SANDY AI 🌸
                </span>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: 20, padding: '3px 14px',
                fontSize: 11, fontWeight: 800, color: '#fff',
                letterSpacing: '0.1em',
              }}>
                CHATBOT
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['🔊', '❓'].map((ico, i) => (
                  <div key={i} style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1.5px solid rgba(255,255,255,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, cursor: 'pointer',
                  }}>{ico}</div>
                ))}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: '#E84040',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, cursor: 'pointer', color: '#fff', fontWeight: 900,
                }}>✕</div>
              </div>
            </div>

            {/* Chat messages area */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <AgentChat role={role} theme="light" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes sandyFloat {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
