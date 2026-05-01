'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import AppNav from '@/components/AppNav'
import { projectsApi } from '@/services/labApi'

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params?.id
  const [project, setProject] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    projectsApi.get(id).then(setProject).catch((e) => setError(e.message))
  }, [id])

  return (
    <main className="ocean-page">
      <div className="ocean-overlay" />
      <AppNav />
      <div className="ocean-container max-w-4xl">
        <h1 className="page-title">Project Detail - {project?.name || `#${id}`}</h1>
        {error && <p className="text-[#E76F51]">{error}</p>}
        {project && (
          <div className="detail-ocean-card mx-auto w-full max-w-[820px] text-[#173a54]">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`project-status-badge ${project.status}`}
              >
                {project.status}
              </span>
              <p className="list-item-title text-4xl">{project.name}</p>
            </div>

            <p className="mt-5 rounded-2xl border border-[#79c0df] bg-[#e3f4fd] px-4 py-4 text-xl font-bold text-[#2f5f7e]">
              {project.description || 'No description'}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="wood-item h-auto flex-col items-start gap-1 py-4">
                <p className="text-sm font-black uppercase tracking-wide text-[#0f4d74]">Status</p>
                <p className="text-2xl font-black text-[#153852]">{project.status}</p>
              </div>
              <div className="wood-item h-auto flex-col items-start gap-1 py-4">
                <p className="text-sm font-black uppercase tracking-wide text-[#0f4d74]">Priority</p>
                <p className="text-2xl font-black text-[#153852]">{project.priority}</p>
              </div>
            </div>

            <Link
              className="mt-8 inline-flex h-20 w-full max-w-[420px] items-center justify-center bg-contain bg-center bg-no-repeat text-2xl font-black text-[#3f5b4b]"
              style={{ backgroundImage: "url('/show-requirments.png')" }}
              href={`/projects/${id}/requirements`}
            >
              Show Project Requirements
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
