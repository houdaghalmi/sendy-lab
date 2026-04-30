'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import AppNav from '@/components/AppNav'
import { experimentsApi, projectsApi } from '@/services/labApi'

export default function EditExperimentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id
  const [form, setForm] = useState({ project_id: null, result: '', notes: '', success: false })
  const [projectName, setProjectName] = useState('')

  useEffect(() => {
    if (!id) return
    experimentsApi.get(id).then(async (exp) => {
      setForm(exp)
      if (!exp.project_id) {
        setProjectName('No Project')
        return
      }
      try {
        const project = await projectsApi.get(exp.project_id)
        setProjectName(project.name)
      } catch {
        setProjectName(`Project #${exp.project_id}`)
      }
    })
  }, [id])

  const save = async () => {
    await experimentsApi.update(id, {
      result: form.result,
      notes: form.notes,
      success: !!form.success,
    })
    router.push('/experiments')
  }

  return (
    <main className="ocean-page">
      <div className="ocean-overlay" />
      <AppNav />
      <div className="ocean-container max-w-5xl">
        <h1 className="page-title">Edit Experiment - {projectName || 'Loading...'}</h1>
        <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-end">
          <div className="wood-form w-full max-w-3xl flex-1 flex flex-col gap-3">
            <p className="wood-label">Project: {projectName || 'N/A'}</p>
            <label className="wood-label">Result</label>
            <input className="wood-field" value={form.result || ''} onChange={(e) => setForm({ ...form, result: e.target.value })} />
            <label className="wood-label">Notes</label>
            <textarea className="wood-field min-h-28" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <label className="wood-label">Success</label>
            <label className="text-sm font-bold text-[#3f2c17]"><input type="checkbox" checked={!!form.success} onChange={(e) => setForm({ ...form, success: e.target.checked })} /> Success</label>
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
