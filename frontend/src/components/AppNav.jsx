'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { notificationsApi } from '@/services/labApi'

const links = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/chat', label: 'Chat' },
  { href: '/projects', label: 'Projects' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/experiments', label: 'Experiments' },
]

export default function AppNav() {
  const pathname = usePathname()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    notificationsApi.list().then(setNotifications).catch(() => setNotifications([]))
  }, [pathname])

  const unreadCount = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications])

  const onMarkRead = async (id) => {
    await notificationsApi.markRead(id)
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)))
  }

  return (
    <nav className="relative z-20 flex w-full items-center gap-3 border-b border-[#5bc3e6]/50 bg-[linear-gradient(180deg,rgba(24,114,181,0.92)_0%,rgba(13,76,134,0.92)_100%)] px-5 py-2 backdrop-blur">
      <div className="hidden min-w-36 sm:block">
        <span className="text-lg font-black tracking-wide text-[#f5c842]" style={{ textShadow: '0 2px 0 #7d5b1d, 0 4px 10px rgba(0, 0, 0, 0.35)' }}>
          Sandy Lab
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center gap-2">
        {links.map((link) => {
          const active = link.href === '/' ? pathname === '/' : pathname?.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full border px-4 py-1.5 text-sm font-extrabold transition ${
                active
                  ? 'border-[#f5c842] bg-[#F5C842] text-[#0A1628] shadow-[0_2px_0_#7d5b1d]'
                  : 'border-[#b6edff66] bg-[#1b4f7a]/80 text-[#e8f8ff] hover:bg-[#25679b]'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
      <button onClick={() => setOpen((prev) => !prev)} className="ml-auto flex items-center gap-1 rounded-full border border-[#b6edff66] bg-[#1b4f7a]/85 px-3 py-1 text-xs font-bold text-[#e8f8ff]">
        <Bell size={14} />
        <span>{unreadCount}</span>
      </button>
      {open && (
        <div className="absolute right-5 top-12 z-40 max-h-72 w-96 overflow-auto rounded-xl border border-[#74cdec] bg-[#123e67] p-3 shadow-xl">
          <p className="mb-2 text-sm font-bold text-[#F5C842]">Notifications</p>
          <div className="space-y-2">
            {notifications.length ? notifications.map((item) => (
              <button key={item.id} onClick={() => onMarkRead(item.id)} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${item.is_read ? 'bg-[#0f2f4f] text-[#9ad6ee]' : 'bg-[#1a5a8a] text-[#eff9ff]'}`}>
                {item.message}
              </button>
            )) : <p className="text-xs text-[#8ab8ca]">No notifications yet.</p>}
          </div>
        </div>
      )}
    </nav>
  )
}

