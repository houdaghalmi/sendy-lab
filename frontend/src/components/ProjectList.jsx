'use client'
import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

const phaseColor = {
  planned:   '#F5C842',
  ongoing:   '#52B788',
  completed: '#90E0EF',
}

export default function ProjectList() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetch(`${API}/api/projects/`)
      .then(r => r.json())
      .then(setProjects)
      .catch(() => {})
  }, [])

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {projects.map(p => {
        const color = phaseColor[p.status] || '#888'
        return (
          <div key={p.id} style={{
            background: 'rgba(10,30,60,0.65)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
            transition: 'border-color .2s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 8,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                background: `${color}20`, border: `1px solid ${color}40`, color,
              }}>
                {p.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 11, color: '#7AB8D4', fontWeight: 600 }}>
                Priority {p.priority ?? 1}
              </div>
              <div style={{ fontSize: 11, color: '#90E0EF', fontWeight: 700, textTransform: 'uppercase' }}>
                {(p.status || 'planned')}
              </div>
            </div>
            {p.description && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#B8D7E6', lineHeight: 1.45 }}>
                {p.description}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}