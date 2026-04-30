'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import AppNav from '@/components/AppNav'
import { inventoryApi, projectsApi } from '@/services/labApi'

export default function EditRequirementPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id
  const requirementId = params?.reqId
  const [inventory, setInventory] = useState([])
  const [project, setProject] = useState(null)
  const [form, setForm] = useState({ inventory_id: '', required_quantity: 1 })
  const [itemName, setItemName] = useState('')

  useEffect(() => {
    if (!projectId || !requirementId) return
    Promise.all([
      projectsApi.getRequirement(projectId, requirementId),
      inventoryApi.list(),
      projectsApi.get(projectId),
    ]).then(([req, inv, projectData]) => {
      setForm({ inventory_id: req.inventory_id, required_quantity: req.required_quantity })
      setInventory(inv)
      setProject(projectData)
      const selectedItem = inv.find((item) => String(item.id) === String(req.inventory_id))
      setItemName(selectedItem?.name || '')
    })
  }, [projectId, requirementId])

  const save = async () => {
    await projectsApi.updateRequirement(projectId, requirementId, {
      inventory_id: Number(form.inventory_id),
      required_quantity: Number(form.required_quantity),
    })
    router.push(`/projects/${projectId}/requirements`)
  }

  return (
    <main className="ocean-page">
      <div className="ocean-overlay" />
      <AppNav />
      <div className="ocean-container max-w-5xl">
        <h1 className="page-title">Edit Requirement - {project?.name || `#${projectId}`}</h1>
        <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-end">
          <div className="wood-form w-full max-w-3xl flex-1 flex flex-col gap-3">
            <label className="wood-label">Inventory Item</label>
            <div className="wood-field font-bold">{itemName || 'Loading item...'}</div>
            <p className="text-xs font-bold text-[#3f2c17]">
              Unit: {inventory.find((item) => String(item.id) === String(form.inventory_id))?.unit || '-'}
            </p>
            <label className="wood-label">Required Quantity</label>
            <input type="number" min="1" className="wood-field" value={form.required_quantity} onChange={(e) => setForm({ ...form, required_quantity: e.target.value })} />
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
