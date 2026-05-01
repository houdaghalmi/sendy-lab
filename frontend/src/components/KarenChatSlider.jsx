'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

import AgentChat from '@/components/AgentChat'

export default function KarenChatSlider() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border-2 border-[#74cdec] bg-[#0f3f68]/95 px-3 py-2 text-[#e8f8ff] shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition hover:brightness-110"
      >
        <img src="/karen.png" alt="Karen chat icon" className="h-12 w-12 object-contain" />
        <span className="text-xs font-black uppercase tracking-wide">{open ? 'Close Chat' : 'Open Chat'}</span>
        <MessageCircle size={16} />
      </button>

      {open && (
        <section className="fixed bottom-20 right-4 z-50 h-[520px] w-[min(92vw,390px)] overflow-hidden rounded-2xl border-2 border-[#74cdec] bg-[#e9f7ff] shadow-[0_14px_34px_rgba(0,0,0,0.35)]">
          <div className="flex h-12 items-center justify-between border-b border-[#74cdec] bg-gradient-to-b from-[#1f7fc3] to-[#155d94] px-4">
            <div className="flex items-center gap-2">
              <img src="/karen.png" alt="Karen assistant" className="h-8 w-8 object-contain" />
              <p className="text-sm font-black tracking-wide text-[#f5c842]">KAREN CHAT ASSISTANT</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-[#0c3f69] text-white"
              aria-label="Close chat panel"
            >
              <X size={16} />
            </button>
          </div>
          <div className="karen-mini h-[calc(100%-3rem)] overflow-hidden">
            <AgentChat role="sandy" assistantName="Karen" />
          </div>
        </section>
      )}
      <style>{`
        .karen-mini .agent-chat-shell {
          grid-template-columns: 1fr !important;
          height: 100% !important;
        }

        .karen-mini .history-sidebar {
          display: none !important;
        }

        .karen-mini .chat-messages {
          padding: 12px !important;
        }

        .karen-mini .bubble {
          max-width: 90% !important;
        }
      `}</style>
    </>
  )
}
