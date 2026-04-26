'use client'
import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export default function InventoryGrid() {
  const [items, setItems] = useState([])

  useEffect(() => {
    fetch(`${API}/api/inventory/`)
      .then(r => r.json())
      .then(setItems)
      .catch(() => {})
  }, [])

  const statusColor = { ok: '#52B788', low: '#F5C842', critical: '#E76F51' }

  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {items.map(item => {
        const minRequired = item.min_required ?? 0
        const status = item.quantity >= minRequired ? 'ok' : 'low'
        const color = statusColor[status] || '#888'
        const pct = minRequired > 0 ? Math.min(100, (item.quantity / (minRequired * 2)) * 100) : 100
        return (
          <div key={item.id} style={{
            background: 'rgba(10,30,60,0.65)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 12px',
            borderLeft: `3px solid ${color}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{item.name}</div>
            <div style={{ fontSize: 10, color: '#7AB8D4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {item.category}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-fredoka)', fontSize: 22 }}>{item.quantity}</span>
                <span style={{ fontSize: 10, color: '#7AB8D4', marginLeft: 3 }}>{item.unit}</span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 8,
                background: `${color}20`, border: `1px solid ${color}40`, color,
              }}>
                {status.toUpperCase()}
              </span>
            </div>
            <div style={{ marginTop: 6, fontSize: 10, color: '#7AB8D4', fontWeight: 600 }}>
              Minimum required: {minRequired}
            </div>
            <div style={{ height: 3, background: 'rgba(144,224,239,0.1)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .4s ease' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}