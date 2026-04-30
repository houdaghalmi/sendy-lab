'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import AppNav from '@/components/AppNav'
import { experimentsApi } from '@/services/labApi'

export default function ExperimentsByProjectPage() {
  const params = useParams()
  const projectId = params?.ProjectId
  const [experiments, setExperiments] = useState([])

  useEffect(() => {
    if (!projectId) return
    experimentsApi.listByProject(projectId).then(setExperiments).catch(() => setExperiments([]))
  }, [projectId])

  return (
    <main className="ocean-page">
      <div className="ocean-overlay" />
      <AppNav />
      <div className="ocean-container max-w-4xl">
        <h1 className="list-title">Experiments for Project {projectId}</h1>
        <div className="wood-list grid gap-2">
          {experiments.map((exp) => (
            <div key={exp.id} className="wood-item">
              <div>
                <p className="list-item-title">Experiment #{exp.id}</p>
                <p className="list-item-subtitle">{exp.result || 'No result'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
