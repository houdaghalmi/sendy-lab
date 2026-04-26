'use client'
import { useState } from 'react'
import AgentChat from '../../components/AgentChat'

export default function Dashboard() {
  const [role, setRole] = useState('sandy')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', background: 'rgba(5,16,34,0.95)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ fontFamily: 'var(--font-fredoka)', fontSize: 22, color: 'var(--sand)' }}>
          🔬 Sandy's Treedome Lab
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {['sandy', 'squidward', 'spongebob'].map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid',
              background: role === r ? 'rgba(245,200,66,0.15)' : 'transparent',
              borderColor: role === r ? 'var(--sand)' : 'var(--border)',
              color: role === r ? 'var(--sand)' : '#7AB8D4'
            }}>
              {r === 'sandy' ? '🤠' : r === 'squidward' ? '🦑' : '🧽'}{' '}
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--grass)', fontWeight: 700 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--grass)', animation: 'pulse 2s ease-in-out infinite'
          }} />
          Agents Online
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AgentChat role={role} />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
      `}</style>
    </div>
  )
}