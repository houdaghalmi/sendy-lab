'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import AppNav from '@/components/AppNav'
import KarenChatSlider from '@/components/KarenChatSlider'
import ModalAddExpriments from '@/components/ModalAddExpriments'
import { experimentsApi, projectsApi } from '@/services/labApi'

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState([])
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({ project_id: '', result: '', notes: '', success: false })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState('')
  const pageSize = 6

  const load = useCallback(async () => {
    try {
      const [experimentList, projectList] = await Promise.all([
        experimentsApi.list(),
        projectsApi.list(),
      ])
      setExperiments(experimentList)
      setProjects(projectList)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    load()
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, 5000)
    return () => clearInterval(intervalId)
  }, [load])

  const add = async () => {
    if (!form.project_id) return
    await experimentsApi.create({
      project_id: form.project_id ? Number(form.project_id) : null,
      result: form.result,
      notes: form.notes,
      success: !!form.success,
    })
    setForm({ project_id: '', result: '', notes: '', success: false })
    setShowCreateModal(false)
    load()
  }

  const remove = async (id) => {
    await experimentsApi.remove(id)
    load()
  }

  const totalPages = Math.max(1, Math.ceil(experiments.length / pageSize))
  const paginatedExperiments = experiments.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const projectNameById = projects.reduce((acc, project) => {
    acc[String(project.id)] = project.name
    return acc
  }, {})

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <main className="ocean-page">
      <div className="ocean-overlay" />
      <AppNav />
      <div className="ocean-container max-w-5xl">
        <div className="mb-4">
          <h1 className="list-title list-title-centered mb-0">Experiments</h1>
        </div>
        {error && <div className="mb-4 rounded-xl bg-[#E76F51]/20 px-4 py-3 text-sm font-bold text-[#ffd9d1]">{error}</div>}
        <div className="relative">
          <button
            className="list-create-corner w-48 text-sm"
            style={{ backgroundImage: "url('/new-item.png')" }}
            onClick={() => setShowCreateModal(true)}
          >
            New Experiment
          </button>
          <div className="wood-list grid gap-2">
          {paginatedExperiments.map((exp) => (
            <div key={exp.id} className="wood-item">
              <div>
                <p className="list-item-title">Experiment #{exp.id}</p>
                <p className="list-item-subtitle">
                  {(projectNameById[String(exp.project_id)] || 'Unknown Project')} #{exp.project_id ?? '-'} | success: {String(exp.success)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Link className="inline-flex h-10 w-12 items-center justify-center bg-contain bg-center bg-no-repeat text-xs font-black text-[#394049]" style={{ backgroundImage: "url('/edit.png')" }} href={`/experiments/${exp.project_id ?? 0}/${exp.id}/edit`}></Link>
                <button className="inline-flex h-14 w-16 items-center justify-center bg-contain bg-center bg-no-repeat text-xs font-black text-[#611f1f]" style={{ backgroundImage: "url('/delete.png')" }} onClick={() => remove(exp.id)}>Delete</button>
              </div>
            </div>
          ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-sm font-bold text-[#2f2419]">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button className="inline-flex h-20 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-sm font-black text-[#3f3c38] disabled:opacity-80" style={{ backgroundImage: "url('/next-previous.png')" }} disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Previous</button>
            <button className="inline-flex h-20 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-sm font-black text-[#3f3c38] disabled:opacity-80" style={{ backgroundImage: "url('/next-previous.png')" }} disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        </div>
      </div>

      <ModalAddExpriments open={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={add} form={form} setForm={setForm} projects={projects} />
      <KarenChatSlider />
    </main>
  )
}
