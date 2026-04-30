'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import AppNav from '@/components/AppNav'
import { projectsApi } from '@/services/labApi'

export default function EditProjectPage() {
  const params = useParams()
  const id = params?.id
  const router = useRouter()
  const [form, setForm] = useState({ name: '', description: '', status: 'planned', priority: 1 })

  useEffect(() => {
    if (!id) return
    projectsApi.get(id).then((project) => setForm(project))
  }, [id])

  const save = async () => {
    await projectsApi.update(id, form)
    router.push(`/projects/${id}`)
  }

  return (
    <main className="ocean-page">
      <div className="ocean-overlay" />
      <AppNav />
      <div className="ocean-container max-w-5xl">
        <h1 className="page-title">Edit Project</h1>
        <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-end">
          <div className="wood-form w-full max-w-3xl flex-1 flex flex-col gap-3">
            <label className="wood-label">Project Name</label>
            <input className="wood-field" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label className="wood-label">Description</label>
            <textarea className="wood-field min-h-28" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="wood-label">Status</label>
            <select className="wood-field" value={form.status || 'planned'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="planned">planned</option>
              <option value="ongoing">ongoing</option>
              <option value="completed">completed</option>
            </select>
            <label className="wood-label">Priority</label>
            <input type="number" className="wood-field" value={form.priority || 1} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
            <button
              className="h-16 w-40 bg-contain bg-center bg-no-repeat text-xl font-black text-[#2c382f]"
              style={{ backgroundImage: "url('/new-item.png')" }}
              onClick={save}
            >
              Save
            </button>
          </div>
          <img
            src="/succes-sandy.png"
            alt="Sandy success"
            className="relative z-20 -mt-4 w-72 max-w-full self-end drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)] lg:-mb-2 lg:-ml-40"
          />
        </div>
      </div>
    </main>
  )
}
