'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AppNav from '@/components/AppNav'
import { experimentsApi, inventoryApi, projectsApi } from '@/services/labApi'

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [inventory, setInventory] = useState([])
  const [experiments, setExperiments] = useState([])
  const [allRequirements, setAllRequirements] = useState([])

  useEffect(() => {
    const load = async () => {
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
    }
    load().catch(() => {
      setProjects([])
      setInventory([])
      setExperiments([])
      setAllRequirements([])
    })
  }, [])

  const recentActivity = useMemo(() => {
    const projectEvents = projects.slice(-3).map((project) => `Project created/updated: ${project.name}`)
    const inventoryEvents = inventory.slice(-3).map((item) => `Inventory updated: ${item.name} (${item.quantity} ${item.unit})`)
    const experimentEvents = experiments.slice(-3).map((exp) => `Experiment #${exp.id} recorded`)
    return [...experimentEvents, ...projectEvents, ...inventoryEvents].slice(0, 6)
  }, [experiments, inventory, projects])

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
          <Link href="/chat" className="rounded-full border border-[#f5c842] bg-[#F5C842] px-4 py-2 text-sm font-black text-[#1f2b33] shadow-[0_2px_0_#7d5b1d] transition hover:brightness-95">Open Chat</Link>
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
              {recentActivity.length ? recentActivity.map((activity, index) => (
                <p key={`${activity}-${index}`} className="rounded-xl border border-[#79c0df] bg-[#d8f0fc]/90 px-4 py-3 text-base font-bold text-[#153852]">{activity}</p>
              )) : <p className="text-sm font-bold text-[#3f6e89]">No activity yet.</p>}
            </div>
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
    </main>
  )
}
