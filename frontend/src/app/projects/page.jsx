'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AppNav from '@/components/AppNav'
import ModalAddProject from '@/components/ModalAddProject'
import { projectsApi } from '@/services/labApi'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [projectForm, setProjectForm] = useState({ name: '', description: '', priority: 1 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  const load = async () => {
    try {
      setProjects(await projectsApi.list())
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const addProject = async () => {
    if (!projectForm.name.trim()) return
    await projectsApi.create({
      name: projectForm.name.trim(),
      description: projectForm.description,
      status: 'ongoing',
      priority: Number(projectForm.priority) || 1,
    })
    setProjectForm({ name: '', description: '', priority: 1 })
    setShowCreateModal(false)
    load()
  }

  const deleteProject = async (id) => {
    if(confirm("Are you sure you want to scrap this experiment?")) {
      await projectsApi.remove(id)
      load()
    }
  }

  const totalPages = Math.max(1, Math.ceil(projects.length / pageSize))
  const paginatedProjects = projects.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <main className="ocean-page">
      <div className="ocean-overlay" />
      <AppNav />
      <div className="ocean-container max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="list-title mb-0">Project Log</h1>
          <button
            className="h-24 w-44 bg-contain bg-center bg-no-repeat text-xl font-black text-[#2c382f]"
            style={{ backgroundImage: "url('/new-item.png')" }}
            onClick={() => setShowCreateModal(true)}
          >
            New Project
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl bg-[#E76F51]/20 px-4 py-3 text-sm font-bold text-[#ffd9d1]">{error}</div>}

        <div className="wood-list grid gap-2">
          {paginatedProjects.map((project) => (
            <div key={project.id} className="wood-item">
              <div className="flex flex-1 items-center gap-3">
                <span
                  className="inline-flex h-18 w-28 items-center justify-center bg-contain bg-center bg-no-repeat text-xs font-black uppercase text-[#293137]"
                  style={{ backgroundImage: `url('/${project.status}.png')` }}
                >
                  {project.status}
                </span>
                <div>
                  <p className="list-item-title">{project.name}</p>
                  <span className="list-item-subtitle">Priority Level: {project.priority}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Link href={`/projects/${project.id}`} className="inline-flex h-10 w-16 items-center justify-center bg-contain bg-center bg-no-repeat text-xs font-black text-[#5a4e1f]" style={{ backgroundImage: "url('/detail.png')" }}>Detail</Link>
                <Link href={`/projects/${project.id}/edit`} className="inline-flex h-10 w-12 items-center justify-center bg-contain bg-center bg-no-repeat text-xs font-black text-[#394049]" style={{ backgroundImage: "url('/edit.png')" }}></Link>
                <button onClick={() => deleteProject(project.id)} className="inline-flex h-14 w-16 items-center justify-center bg-contain bg-center bg-no-repeat text-xs font-black text-[#611f1f]" style={{ backgroundImage: "url('/delete.png')" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between text-sm font-bold text-[#2f2419]">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              className="inline-flex h-20 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-sm font-black text-[#3f3c38] disabled:opacity-80"
              style={{ backgroundImage: "url('/next-previous.png')" }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="inline-flex h-20 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-sm font-black text-[#3f3c38] disabled:opacity-80"
              style={{ backgroundImage: "url('/next-previous.png')" }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ModalAddProject open={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={addProject} form={projectForm} setForm={setProjectForm} />
    </main>
  )
}