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
          <div
            className="mx-auto flex min-h-[460px] w-full max-w-[780px] flex-col justify-center bg-contain bg-center bg-no-repeat px-28 py-20 text-[#2f2419]"
            style={{ backgroundImage: "url('/detail-project.png')" }}
          >
            <p className="text-5xl font-black">{project.name}</p>
            <p className="mt-3 text-2xl text-[#53473b]">{project.description || 'No description'}</p>
            <p className="mt-5 text-3xl font-bold">Status: {project.status}</p>
            <p className="text-3xl font-bold">Priority: {project.priority}</p>
            <Link
              className="mt-7 inline-flex h-20 w-85 items-center justify-center bg-contain bg-center bg-no-repeat text-2xl font-black text-[#3f5b4b]"
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
