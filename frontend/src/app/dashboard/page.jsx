'use client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AppNav from '@/components/AppNav'
import KarenChatSlider from '@/components/KarenChatSlider'
import { experimentsApi, inventoryApi, notificationsApi, projectsApi } from '@/services/labApi'

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [inventory, setInventory] = useState([])
  const [experiments, setExperiments] = useState([])
  const [allRequirements, setAllRequirements] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activityPage, setActivityPage] = useState(1)
  const ACTIVITY_PER_PAGE = 4

  const load = useCallback(async () => {
    try {
      const [projectList, inventoryList, experimentList] = await Promise.all([
        projectsApi.list(),
        inventoryApi.list(),
        experimentsApi.list(),
      ])
      setProjects(projectList)
      setInventory(inventoryList)
      setExperiments(experimentList)

      const requirementsByProject = await Promise.all(
        projectList.map((project) => projectsApi.listRequirements(project.id).catch(() => []))
      )
      setAllRequirements(requirementsByProject.flat())
      setNotifications(await notificationsApi.list())
    } catch {
      setProjects([])
      setInventory([])
      setExperiments([])
      setAllRequirements([])
      setNotifications([])
    }
  }, [])

  useEffect(() => {
    load()
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, 5000)
    return () => clearInterval(intervalId)
  }, [load])

  const recentActivity = useMemo(
    () => notifications.slice(0, 50).map((notification) => ({
      text: notification.message,
      date: notification.created_at ? new Date(notification.created_at).getTime() : 0,
      fallback: Number(notification.id) || 0,
      level: notification.level || 'info',
    })),
    [notifications]
  )

  useEffect(() => {
    setActivityPage(1)
  }, [recentActivity.length])

  const totalActivityPages = Math.max(1, Math.ceil(recentActivity.length / ACTIVITY_PER_PAGE))
  const paginatedRecentActivity = recentActivity.slice(
    (activityPage - 1) * ACTIVITY_PER_PAGE,
    activityPage * ACTIVITY_PER_PAGE
  )

  return (
    <main className="ocean-page">
      <div className="ocean-overlay" />
      <AppNav />

      <div className="ocean-container">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="page-title mb-1">Dashboard</h1>
            <p className="text-sm text-[#e2f5ff]">Overview of your lab activity and inventory progress.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="wood-item h-auto flex-col items-start gap-1 py-4"><p className="text-sm font-bold text-[#0f4d74]">Total Projects</p><p className="text-3xl font-black text-[#153852]">{projects.length}</p></div>
          <div className="wood-item h-auto flex-col items-start gap-1 py-4"><p className="text-sm font-bold text-[#0f4d74]">Total Inventory Items</p><p className="text-3xl font-black text-[#153852]">{inventory.length}</p></div>
          <div className="wood-item h-auto flex-col items-start gap-1 py-4"><p className="text-sm font-bold text-[#0f4d74]">Total Experiments</p><p className="text-3xl font-black text-[#153852]">{experiments.length}</p></div>
          <div className="wood-item h-auto flex-col items-start gap-1 py-4"><p className="text-sm font-bold text-[#0f4d74]">Total Requirements</p><p className="text-3xl font-black text-[#153852]">{allRequirements.length}</p></div>
        </div>

        <div className="mt-5">
          <section className="wood-list min-h-[320px]">
            <h2 className="list-item-title text-3xl">Recent Activity</h2>
            <div className="mt-3 space-y-2">
              {paginatedRecentActivity.length ? paginatedRecentActivity.map((activity, index) => (
                <div key={`${activity.text}-${activity.fallback}-${index}`} className="rounded-xl border border-[#79c0df] bg-[#d8f0fc]/90 px-4 py-3">
                  <p className="text-base font-bold text-[#153852]">{activity.text}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-wide text-[#2f5f7e]">
                      {activity.date ? new Date(activity.date).toLocaleString() : 'Date unavailable'}
                    </p>
                    <span className="rounded-full bg-[#b8e0f4] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#225777]">
                      {activity.level}
                    </span>
                  </div>
                </div>
              )) : <p className="text-sm font-bold text-[#3f6e89]">No activity yet.</p>}
            </div>
            {recentActivity.length > ACTIVITY_PER_PAGE && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  className="rounded-full border border-[#6fb8d7] bg-[#d1ecfb] px-4 py-1.5 text-xs font-black text-[#214f6d] disabled:opacity-50"
                  disabled={activityPage === 1}
                  onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <p className="text-xs font-black text-[#2f5f7e]">Page {activityPage} of {totalActivityPages}</p>
                <button
                  className="rounded-full border border-[#6fb8d7] bg-[#d1ecfb] px-4 py-1.5 text-xs font-black text-[#214f6d] disabled:opacity-50"
                  disabled={activityPage === totalActivityPages}
                  onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/projects" className="wood-form transition hover:border-[#f5c842]">
            <p className="text-lg font-black text-[#153852]">Projects</p>
            <p className="mt-1 text-sm font-bold text-[#2f5f7e]">Manage project records and requirements.</p>
          </Link>
          <Link href="/inventory" className="wood-form transition hover:border-[#f5c842]">
            <p className="text-lg font-black text-[#153852]">Inventory</p>
            <p className="mt-1 text-sm font-bold text-[#2f5f7e]">Track items, units, and minimum stock.</p>
          </Link>
          <Link href="/experiments" className="wood-form transition hover:border-[#f5c842]">
            <p className="text-lg font-black text-[#153852]">Experiments</p>
            <p className="mt-1 text-sm font-bold text-[#2f5f7e]">View and update experiment outcomes.</p>
          </Link>
          <Link href="/chat" className="wood-form transition hover:border-[#f5c842]">
            <p className="text-lg font-black text-[#153852]">Chat Assistant</p>
            <p className="mt-1 text-sm font-bold text-[#2f5f7e]">Ask the agent about inventory and feasibility.</p>
          </Link>
        </div>
      </div>
      <KarenChatSlider />
    </main>
  )
}
