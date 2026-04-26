'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleHelp, Volume2, X } from 'lucide-react'
import AgentChat from '../../components/AgentChat'

export default function Dashboard() {
  const [role] = useState('sandy')
  const router = useRouter()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#57C1EB', // Fallback color
      backgroundImage: "url('/background.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center bottom',
      fontFamily: "'Fredoka One', 'Nunito', cursive",
      position: 'relative',
    }}>

      {/* Underwater overlay tint */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,60,120,0.1) 0%, rgba(0,120,180,0.05) 100%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── MAIN LAYOUT ── */}
      <div style={{
        flex: 1, display: 'flex', overflow: 'hidden',
        position: 'relative', zIndex: 5,
        padding: '24px 36px 30px',
        alignItems: 'stretch'
      }}>

        {/* Character beside chat like prototype */}
        <div style={{
          position: 'absolute',
          left: '-80px',
          bottom: '-14px',
          width: 'clamp(520px, 23vw, 340px)',
          zIndex: 8,
          pointerEvents: 'none',
        }}>
          <img
            src="/sandy2.png"
            alt="Sandy Cheeks"
            style={{
              width: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.2))',
              animation: 'sandyFloat 4s ease-in-out infinite',
            }}
          />
        </div>

        {/* BAMBOO CHAT WINDOW */}
        <div style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFF8E7', // Sandy beige background
          borderRadius: 35,
          border: '10px solid #D4A745', // Bamboo-like border
          boxShadow: `
            0 15px 50px rgba(0,40,100,0.3),
            inset 0 0 15px rgba(0,0,0,0.05)
          `,
          overflow: 'hidden',
          position: 'relative',
          marginLeft: 'clamp(140px, 13vw, 210px)',
        }}>

          {/* Chat Header matching Image Style */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px',
            background: 'linear-gradient(180deg, #3A96D8 0%, #1D78B9 100%)',
            borderBottom: '4px solid #D4A745',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontSize: 24, fontWeight: 900, color: '#fff',
                letterSpacing: '0.02em',
                textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
              }}>
                SANDY LAB
              </span>
              <div style={{
                background: '#E0F2FF',
                borderRadius: 20, padding: '4px 18px',
                fontSize: 14, fontWeight: 900, color: '#1D78B9',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}>
                CHATBOT
              </div>
            </div>

            {/* Window Controls */}
            <div style={{ display: 'flex', gap: 10 }}>
               
              <button
                type="button"
                title="Back to home"
                onClick={() => router.push('/')}
                style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(180deg, #F86565 0%, #D63030 100%)',
                border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', fontWeight: 900,
                boxShadow: '0 4px 0 rgba(0,0,0,0.15)',
              }}
              >
                <X size={18} strokeWidth={2.8} />
              </button>
            </div>
          </div>

          {/* Chat messages area */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
             <AgentChat role={role} />
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;700;900&display=swap');
        button { font-family: inherit; }
        @keyframes sandyFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
      `}</style>
    </div>
  )
}
