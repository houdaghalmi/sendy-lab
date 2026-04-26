'use client'
import { useState, useEffect, useRef } from 'react'

const agentColors = {
  planner:     '#F5C842',
  research:    '#52B788',
  inventory:   '#90E0EF',
  database:    '#E76F51',
  synthesizer: '#AFA9EC',
}

const agentLabels = {
  planner:     '🧠 Planner Agent',
  research:    '🌐 Research Agent',
  inventory:   '📦 Inventory Agent',
  database:    '🗄️ DB Agent',
  synthesizer: '✨ Final Response',
}

const SHOW_AGENT_TRACE = process.env.NEXT_PUBLIC_SHOW_AGENT_TRACE === 'true'

export default function AgentChat({ role }) {
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      agent: 'planner',
      content: "Howdy! I'm Sandy's Planner Agent. Ask me anything about the lab, research, or inventory!",
    },
  ])
  const [input, setInput] = useState('')
  const [activeAgents, setActiveAgents] = useState([])
  const wsRef = useRef(null)
  const bottomRef = useRef(null)
  const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

  useEffect(() => {
    const ws = new WebSocket(
      `${wsBaseUrl}/ws/chat`
    )
    wsRef.current = ws

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'agent_update') {
        const { agent, data: output } = data
        setActiveAgents(prev => [...new Set([...prev, agent])])

        if (SHOW_AGENT_TRACE && output.research_result) {
          setMessages(prev => [...prev, {
            role: 'agent', agent: 'research',
            content: output.research_result,
            tools: ['web_search()'],
          }])
        }
        if (SHOW_AGENT_TRACE && output.inventory_result) {
          setMessages(prev => [...prev, {
            role: 'agent', agent: 'inventory',
            content: output.inventory_result,
            tools: ['db.query("inventory")'],
          }])
        }
        if (SHOW_AGENT_TRACE && output.db_result) {
          setMessages(prev => [...prev, {
            role: 'agent', agent: 'database',
            content: output.db_result,
            tools: ['db.query("projects")'],
          }])
        }
        if (output.final_response) {
          setMessages(prev => [...prev, {
            role: 'agent', agent: 'synthesizer',
            content: output.final_response,
          }])
          setActiveAgents([])
        }
      }

      if (data.type === 'done') {
        setActiveAgents([])
      }
    }

    ws.onerror = () => {
      setMessages(prev => [...prev, {
        role: 'agent', agent: 'planner',
        content: `⚠️ Could not connect to backend at ${wsBaseUrl}. Make sure FastAPI is running and the frontend env URL is correct.`,
      }])
    }

    return () => ws.close()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    setMessages(prev => [...prev, { role: 'user', content: input }])
    wsRef.current.send(JSON.stringify({ message: input, role }))
    setInput('')
    setActiveAgents(['planner'])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Active agents bar */}
      {activeAgents.length > 0 && (
        <div style={{
          padding: '8px 16px', display: 'flex', gap: 8, flexWrap: 'wrap',
          borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)'
        }}>
          {activeAgents.map(a => (
            <span key={a} style={{
              padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: `${agentColors[a] || '#888'}20`,
              border: `1px solid ${agentColors[a] || '#888'}50`,
              color: agentColors[a] || '#888',
              animation: 'agentPulse 1.5s ease-in-out infinite',
            }}>
              {agentLabels[a] || a} ●
            </span>
          ))}
        </div>
      )}

      {/* Messages list */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          const color = agentColors[msg.agent] || '#888'
          return (
            <div key={i} style={{
              display: 'flex',
              flexDirection: isUser ? 'row-reverse' : 'row',
              gap: 8,
            }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: isUser ? 'rgba(144,224,239,0.15)' : `${color}20`,
                border: `1px solid ${isUser ? 'rgba(144,224,239,0.3)' : `${color}40`}`,
                color: isUser ? '#90E0EF' : color,
              }}>
                {isUser ? 'You' : (msg.agent?.[0] || 'A').toUpperCase()}
              </div>

              {/* Bubble */}
              <div style={{ maxWidth: '78%' }}>
                {!isUser && (
                  <div style={{
                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.07em', color, marginBottom: 4,
                  }}>
                    {agentLabels[msg.agent] || msg.agent}
                  </div>
                )}

                {msg.tools && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                    {msg.tools.map((t, ti) => (
                      <span key={ti} style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 10,
                        fontFamily: 'monospace',
                        background: 'rgba(82,183,136,0.12)',
                        border: '1px solid rgba(82,183,136,0.3)',
                        color: '#52B788',
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{
                  padding: '10px 14px', fontSize: 13, lineHeight: 1.55,
                  background: isUser ? 'rgba(144,224,239,0.1)' : 'rgba(10,30,60,0.7)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  borderTopLeftRadius: isUser ? 12 : 3,
                  borderTopRightRadius: isUser ? 3 : 12,
                }}>
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}

        {/* Thinking dots */}
        {activeAgents.length > 0 && (
          <div style={{ display: 'flex', gap: 4, paddingLeft: 40 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%', background: '#7AB8D4',
                animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8, background: 'rgba(5,16,34,0.85)',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask Sandy's agent network anything..."
          style={{
            flex: 1, background: 'rgba(144,224,239,0.06)',
            border: '1px solid var(--border)', borderRadius: 10,
            padding: '8px 14px', color: '#E8F4FD', fontSize: 13,
            fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button onClick={sendMessage} style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--sand)', border: 'none',
          cursor: 'pointer', fontSize: 16, fontWeight: 700, color: '#1a1200',
        }}>
          ▲
        </button>
      </div>

      <style>{`
        @keyframes blink      { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
        @keyframes agentPulse { 0%,100%{opacity:1}      50%{opacity:.6} }
      `}</style>
    </div>
  )
}