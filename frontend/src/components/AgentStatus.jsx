'use client'

const agents = [
  { key: 'planner',   label: 'Planner',   desc: 'Routing tasks',  color: '#F5C842' },
  { key: 'research',  label: 'Research',  desc: 'Web search',     color: '#52B788' },
  { key: 'inventory', label: 'Inventory', desc: 'Stock tracking', color: '#90E0EF' },
  { key: 'database',  label: 'Database',  desc: 'CRUD ready',     color: '#E76F51' },
]

export default function AgentStatus({ activeAgents = [] }) {
  return (
    <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {agents.map(a => {
        const isActive = activeAgents.includes(a.key)
        return (
          <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: isActive ? a.color : 'rgba(122,184,212,0.3)',
              animation: isActive ? 'pulse 1.2s ease-in-out infinite' : 'none',
              transition: 'background .3s',
            }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#E8F4FD' : '#7AB8D4' }}>{a.label}</div>
              <div style={{ fontSize: 10, color: '#7AB8D4' }}>{a.desc}</div>
            </div>
          </div>
        )
      })}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}