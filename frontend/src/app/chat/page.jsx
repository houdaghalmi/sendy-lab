'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import AgentChat from '../../components/AgentChat'
import AppNav from '@/components/AppNav'

export default function ChatPage() {
  const [role] = useState('sandy')
  const router = useRouter()

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#57C1EB] bg-[url('/background.png')] bg-cover bg-bottom">
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#003c781a] to-[#0078b40d]" />
      <div className="relative z-20">
        <AppNav />
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden px-5 pb-6 pt-5">
        <div className="pointer-events-none absolute bottom-0 left-[-80px] z-10 hidden w-[320px] lg:block">
          <img
            src="/sandy2.png"
            alt="Sandy Cheeks"
            className="w-full animate-[sandyFloat_4s_ease-in-out_infinite] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.2)]"
          />
        </div>

        <div className="ml-0 flex h-full flex-1 flex-col overflow-hidden rounded-[35px] border-[10px] border-[#D4A745] bg-[#FFF8E7] shadow-[0_15px_50px_rgba(0,40,100,0.3)] lg:ml-[180px]">
          <div className="flex items-center justify-between border-b-4 border-[#D4A745] bg-gradient-to-b from-[#3A96D8] to-[#1D78B9] px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black tracking-wide text-white [text-shadow:2px_2px_0_rgba(0,0,0,0.2)]">SANDY LAB</span>
              <div className="rounded-full bg-[#E0F2FF] px-4 py-1 text-sm font-black text-[#1D78B9]">CHATBOT</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" title="Back to home" onClick={() => router.push('/')} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-b from-[#F86565] to-[#D63030] text-white shadow-[0_4px_0_rgba(0,0,0,0.15)]">
                <X size={18} strokeWidth={2.8} />
              </button>
            </div>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <AgentChat role={role} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sandyFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
      `}</style>
    </div>
  )
}
