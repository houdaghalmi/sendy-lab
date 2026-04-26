'use client'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'

import {
  createAgentResponse,
  createAgentTask,
  getAgentTask,
  listAgentTasks,
  removeAgentTask,
  updateAgentTask,
} from '@/services/agentApi'


function truncateTask(task) {
  if (!task) return '(empty task)'
  return task.length > 40 ? `${task.slice(0, 40)}...` : task
}


function toDateLabel(date) {
  const now = new Date()
  const target = new Date(date)
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const diffDays = Math.floor((startToday - startTarget) / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return target.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}


function formatTime(date) {
  return new Date(date).toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  })
}


function groupByDate(tasks) {
  const groups = {}
  tasks.forEach(task => {
    const key = toDateLabel(task.created_at)
    if (!groups[key]) groups[key] = []
    groups[key].push(task)
  })
  return groups
}


function buildSessionTitle(messages) {
  const firstUser = messages.find(m => m.role === 'user' && m.content?.trim())
  if (!firstUser) return 'Untitled chat'
  const text = firstUser.content.trim()
  return text.length > 120 ? `${text.slice(0, 120)}...` : text
}


function encodeSession(messages) {
  return JSON.stringify(
    {
      version: 1,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      })),
    },
    null,
    0,
  )
}


function decodeSession(discussion) {
  try {
    const parsed = JSON.parse(discussion.result)
    if (Array.isArray(parsed?.messages) && parsed.messages.length > 0) {
      return parsed.messages.map((m, i) => ({
        id: `task-${discussion.id}-${i}`,
        role: m.role === 'user' ? 'user' : 'agent',
        content: m.content || '',
        created_at: m.created_at || discussion.created_at,
      }))
    }
  } catch {
    // fall back
  }
  return [
    {
      id: `task-${discussion.id}-user`,
      role: 'user',
      content: discussion.task,
      created_at: discussion.created_at,
    },
    {
      id: `task-${discussion.id}-agent`,
      role: 'agent',
      content: discussion.result,
      created_at: discussion.created_at,
    },
  ]
}


export default function AgentChat({ role }) {
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')

  const [messages, setMessages] = useState([])
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [chatError, setChatError] = useState('')

  const [sliderValue, setSliderValue] = useState(100)
  const [isScrollable, setIsScrollable] = useState(false)

  const bottomRef = useRef(null)
  const chatMessagesRef = useRef(null)
  const isSliderDragging = useRef(false)

  const groupedHistory = useMemo(() => groupByDate(history), [history])

  useEffect(() => { fetchHistory() }, [])

  useEffect(() => {
    if (!isSliderDragging.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const syncSlider = useCallback(() => {
    const el = chatMessagesRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const maxScroll = scrollHeight - clientHeight
    setIsScrollable(maxScroll > 10)
    if (maxScroll <= 0) { setSliderValue(100); return }
    setSliderValue(Math.round((scrollTop / maxScroll) * 100))
  }, [])

  useEffect(() => {
    const el = chatMessagesRef.current
    if (!el) return
    const t = setTimeout(() => {
      const { scrollHeight, clientHeight } = el
      setIsScrollable(scrollHeight - clientHeight > 10)
    }, 100)
    return () => clearTimeout(t)
  }, [messages])

  const handleSliderChange = (e) => {
    const el = chatMessagesRef.current
    if (!el) return
    const val = Number(e.target.value)
    setSliderValue(val)
    el.scrollTop = (val / 100) * (el.scrollHeight - el.clientHeight)
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const tasks = await listAgentTasks()
      setHistory(tasks)
    } catch (error) {
      setHistoryError(error.message || 'Failed to load chat history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleNewChat = async () => {
    if (isSending) return
    setChatError('')
    setMessages([])
    setSelectedTaskId(null)
    setActiveSessionId(null)
    setSliderValue(100)
    await fetchHistory()
  }

  const handleSelectDiscussion = async (taskId) => {
    setChatError('')
    try {
      const discussion = await getAgentTask(taskId)
      setSelectedTaskId(discussion.id)
      setActiveSessionId(discussion.id)
      setMessages(decodeSession(discussion))
    } catch (error) {
      setChatError(error.message || 'Failed to load this discussion')
    }
  }

  const handleDeleteDiscussion = async (event, taskId) => {
    event.stopPropagation()
    try {
      await removeAgentTask(taskId)
      setHistory(prev => prev.filter(item => item.id !== taskId))
      if (selectedTaskId === taskId) {
        setMessages([])
        setSelectedTaskId(null)
        setActiveSessionId(null)
      }
    } catch (error) {
      setChatError(error.message || 'Failed to delete discussion')
    }
  }

  const handleSend = async () => {
    const userInput = input.trim()
    if (!userInput || isSending) return

    const previousMessages = messages
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      created_at: new Date().toISOString(),
    }
    const pendingMessages = [...previousMessages, userMessage]

    setInput('')
    setChatError('')
    setIsSending(true)
    setSelectedTaskId(null)
    setMessages(pendingMessages)

    try {
      const response = await createAgentResponse({ message: userInput, role })
      const finalMessages = [
        ...pendingMessages,
        {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: response.result,
          created_at: new Date().toISOString(),
        },
      ]
      setMessages(finalMessages)

      const payload = {
        task: buildSessionTitle(finalMessages),
        result: encodeSession(finalMessages),
        status: 'completed',
      }

      if (activeSessionId) {
        await updateAgentTask(activeSessionId, payload)
        setSelectedTaskId(activeSessionId)
      } else {
        const saved = await createAgentTask(payload)
        setActiveSessionId(saved.id)
        setSelectedTaskId(saved.id)
      }
      await fetchHistory()
    } catch (error) {
      setMessages(previousMessages)
      setChatError(error.message || 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="agent-chat-shell">
      <aside className="history-sidebar">
        <div className="history-header">
          <button className="new-chat-btn" onClick={handleNewChat}>
            <span>🆕</span>
            <span>New Chat</span>
          </button>
          <button className="icon-btn" onClick={fetchHistory} title="Refresh history">🔄</button>
        </div>

        {historyLoading && <div className="history-state">Loading history...</div>}
        {!historyLoading && historyError && <div className="history-error">{historyError}</div>}
        {!historyLoading && !historyError && history.length === 0 && (
          <div className="history-state">No saved discussions yet.</div>
        )}

        <div className="history-list">
          {Object.entries(groupedHistory).map(([label, tasks]) => (
            <div key={label} className="history-group">
              <div className="history-group-label">{label}</div>
              {tasks.map(task => (
                <button
                  key={task.id}
                  className={`history-item ${selectedTaskId === task.id ? 'selected' : ''}`}
                  onClick={() => handleSelectDiscussion(task.id)}
                >
                  <div className="history-item-main">
                    <div className="history-item-title">🕓 {truncateTask(task.task)}</div>
                    <div className="history-item-date">{formatTime(task.created_at)}</div>
                  </div>
                  <span
                    className="history-delete"
                    role="button"
                    title="Delete discussion"
                    onClick={(event) => handleDeleteDiscussion(event, task.id)}
                  >
                    🗑️
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      <section className="chat-panel">
        {/* messages area + slider side-by-side, inside the panel */}
        <div className="chat-body">

          {/* messages scroll container */}
          <div
            className="chat-messages"
            ref={chatMessagesRef}
            onScroll={syncSlider}
          >
            {messages.length === 0 && (
              <div className="empty-chat">
                Start a new chat and your discussion will be saved in history.
              </div>
            )}

            {messages.map(message => {
              const isUser = message.role === 'user'
              return (
                <div key={message.id} className={`chat-row ${isUser ? 'user' : 'agent'}`}>
                  <div className={`bubble ${isUser ? 'user' : 'agent'}`}>
                    {message.content}
                  </div>
                </div>
              )
            })}

            {isSending && (
              <div className="chat-row agent">
                <div className="bubble agent">Thinking...</div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* vertical scroll rail — only visible when content overflows */}
          <div className={`scroll-rail ${isScrollable ? 'visible' : ''}`}>
            <button
              className="rail-btn"
              onClick={() => chatMessagesRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              title="Top"
            >▲</button>

            <div className="rail-slider-wrap">
              <input
                type="range"
                className="rail-slider"
                min="0"
                max="100"
                step="1"
                value={sliderValue}
                onChange={handleSliderChange}
                onMouseDown={() => { isSliderDragging.current = true }}
                onMouseUp={() => { isSliderDragging.current = false }}
                onTouchStart={() => { isSliderDragging.current = true }}
                onTouchEnd={() => { isSliderDragging.current = false }}
              />
            </div>

            <button
              className="rail-btn"
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
              title="Bottom"
            >▼</button>
          </div>
        </div>

        {chatError && <div className="chat-error">{chatError}</div>}

        <div className="chat-input-row">
          <input
            value={input}
            onChange={event => setInput(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && handleSend()}
            placeholder="Ask the agent..."
            disabled={isSending}
          />
          <button onClick={handleSend} disabled={isSending || !input.trim()}>
            {isSending ? '...' : 'Send'}
          </button>
        </div>
      </section>

      <style>{`
        .agent-chat-shell {
          height: 100%;
          display: grid;
          grid-template-columns: 300px 1fr;
          overflow: hidden;
          background: rgba(239, 248, 255, 0.65);
        }

        /* ── Sidebar ── */
        .history-sidebar {
          border-right: 1px solid rgba(26, 111, 181, 0.2);
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.82);
          min-width: 0;
        }

        .history-header {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-bottom: 1px solid rgba(26, 111, 181, 0.18);
        }

        .new-chat-btn {
          flex: 1;
          border: none;
          border-radius: 10px;
          padding: 9px 10px;
          font-weight: 800;
          color: #fff;
          background: linear-gradient(135deg, #1a6fb5 0%, #1579cb 100%);
          cursor: pointer;
          display: flex;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
        }

        .icon-btn {
          width: 40px;
          border: 1px solid rgba(26, 111, 181, 0.3);
          border-radius: 10px;
          background: rgba(26, 111, 181, 0.08);
          cursor: pointer;
          font-size: 14px;
        }

        .history-state,
        .history-error {
          margin: 12px;
          padding: 10px;
          border-radius: 10px;
          font-size: 12px;
        }

        .history-state {
          background: rgba(26, 111, 181, 0.08);
          color: #124f85;
        }

        .history-error {
          background: rgba(231, 111, 81, 0.14);
          color: #7d2c17;
        }

        .history-list {
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .history-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .history-group-label {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(18, 79, 133, 0.75);
          padding-left: 4px;
        }

        .history-item {
          width: 100%;
          border: 1px solid rgba(26, 111, 181, 0.18);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.88);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          padding: 8px;
          text-align: left;
          cursor: pointer;
        }

        .history-item.selected {
          border-color: #1a6fb5;
          box-shadow: 0 0 0 2px rgba(26, 111, 181, 0.16);
        }

        .history-item-main { min-width: 0; }

        .history-item-title {
          font-size: 12px;
          font-weight: 700;
          color: #0e3f68;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .history-item-date {
          font-size: 11px;
          color: rgba(14, 63, 104, 0.7);
          margin-top: 4px;
        }

        .history-delete {
          font-size: 14px;
          padding: 3px;
          line-height: 1;
        }

        /* ── Chat panel ── */
        .chat-panel {
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }

        /* chat-body holds messages + rail side by side */
        .chat-body {
          flex: 1;
          display: flex;
          flex-direction: row;
          min-height: 0;
          overflow: hidden;
        }

        /* messages area — hides native scrollbar */
        .chat-messages {
          flex: 1;
          overflow-y: scroll;
          padding: 18px 14px 18px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scrollbar-width: none;
        }
        .chat-messages::-webkit-scrollbar { display: none; }

        .empty-chat {
          margin: auto;
          color: rgba(11, 50, 85, 0.65);
          font-size: 13px;
          font-weight: 700;
          text-align: center;
        }

        .chat-row { display: flex; }
        .chat-row.user { justify-content: flex-end; }
        .chat-row.agent { justify-content: flex-start; }

        .bubble {
          max-width: min(78%, 700px);
          border-radius: 16px;
          padding: 10px 14px;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        .bubble.user {
          background: linear-gradient(135deg, #1a6fb5 0%, #1579cb 100%);
          color: #fff;
          border-top-right-radius: 6px;
        }
        .bubble.agent {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(18, 79, 133, 0.2);
          color: #0f3f68;
          border-top-left-radius: 6px;
        }

        /* ── Scroll rail — sits inside chat-body ── */
        .scroll-rail {
          width: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px 0;
          gap: 4px;
          background: rgba(220, 238, 252, 0.7);
          border-left: 1px solid rgba(26, 111, 181, 0.15);
          transition: width 0.2s ease;
          flex-shrink: 0;
        }
        .scroll-rail.visible {
          width: 32px;
        }

        .rail-btn {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          border: 1px solid rgba(26, 111, 181, 0.35);
          border-radius: 6px;
          background: rgba(26, 111, 181, 0.12);
          color: #1a6fb5;
          font-size: 9px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          line-height: 1;
          transition: background 0.15s;
        }
        .rail-btn:hover {
          background: rgba(26, 111, 181, 0.25);
        }

        .rail-slider-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 0;
          overflow: hidden;
        }

        /* Vertical range slider via transform trick — works in all browsers */
        .rail-slider {
          appearance: none;
          -webkit-appearance: none;
          writing-mode: vertical-lr;
          direction: rtl;
          width: 6px;
          height: 100%;
          background: rgba(26, 111, 181, 0.18);
          border-radius: 4px;
          outline: none;
          cursor: pointer;
        }
        .rail-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #1a6fb5;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(26, 111, 181, 0.4);
        }
        .rail-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #1a6fb5;
          cursor: pointer;
          border: 2px solid #fff;
        }

        /* ── Bottom bar ── */
        .chat-error {
          margin: 0 18px 10px;
          background: rgba(231, 111, 81, 0.14);
          border: 1px solid rgba(231, 111, 81, 0.28);
          color: #7d2c17;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 12px;
          font-weight: 700;
        }

        .chat-input-row {
          border-top: 1px solid rgba(18, 79, 133, 0.2);
          padding: 12px;
          display: flex;
          gap: 10px;
          background: rgba(227, 241, 251, 0.84);
          flex-shrink: 0;
        }

        .chat-input-row input {
          flex: 1;
          border: 1px solid rgba(18, 79, 133, 0.3);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          outline: none;
          color: #0f3f68;
        }

        .chat-input-row button {
          min-width: 92px;
          border: none;
          border-radius: 10px;
          background: #1a6fb5;
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .chat-input-row button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 960px) {
          .agent-chat-shell {
            grid-template-columns: 1fr;
          }
          .history-sidebar {
            max-height: 34%;
            border-right: none;
            border-bottom: 1px solid rgba(26, 111, 181, 0.2);
          }
        }
      `}</style>
    </div>
  )
}