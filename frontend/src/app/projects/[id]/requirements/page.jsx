'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import AppNav from '@/components/AppNav'
import ModalAddRequirments from '@/components/ModalAddRequirments'
import { inventoryApi, projectsApi } from '@/services/labApi'

export default function RequirementsPage() {
  const params = useParams()
  const id = params?.id
  const [requirements, setRequirements] = useState([])
  const [inventory, setInventory] = useState([])
  const [project, setProject] = useState(null)
  const [form, setForm] = useState({ inventory_id: '', required_quantity: 1 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  const load = async () => {
    const [reqs, inv] = await Promise.all([projectsApi.listRequirements(id), inventoryApi.list()])
    setRequirements(reqs)
    setInventory(inv)
  }

  useEffect(() => {
    if (!id) return
    projectsApi.get(id).then(setProject).catch(() => setProject(null))
    load()
  }, [id])

  const add = async () => {
    if (!form.inventory_id) return
    await projectsApi.addRequirement(id, {
      inventory_id: Number(form.inventory_id),
      required_quantity: Number(form.required_quantity),
    })
    setForm({ inventory_id: '', required_quantity: 1 })
    setShowCreateModal(false)
    load()
  }

  const removeReq = async (reqId) => {
    await projectsApi.deleteRequirement(id, reqId)
    load()
  }

  const totalPages = Math.max(1, Math.ceil(requirements.length / pageSize))
  const paginatedRequirements = requirements.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const linkedInventoryIds = new Set(requirements.map((req) => String(req.inventory_id)))
  const availableInventory = inventory.filter((item) => !linkedInventoryIds.has(String(item.id)))

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <main className="ocean-page">
      <div className="ocean-overlay" />
      <AppNav />
      <div className="ocean-container max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="list-title mb-0">Project Requirements - {project?.name || `#${id}`}</h1>
          <button
            className="h-24 w-52 bg-contain bg-center bg-no-repeat text-sm font-black text-[#2c382f]"
            style={{ backgroundImage: "url('/new-item.png')" }}
            onClick={() => setShowCreateModal(true)}
          >
            New Requirement
          </button>
        </div>

        <div className="wood-list grid gap-2">
          {paginatedRequirements.map((req) => (
            <div key={req.id} className="wood-item">
              <div>
                <p className="list-item-title">{req.item_name}</p>
                <p className="list-item-subtitle">Required {req.required_quantity} {req.unit} | Available {req.available_quantity} {req.unit}</p>
              </div>
              <div className="flex items-center gap-1">
                <Link className="inline-flex h-10 w-12 items-center justify-center bg-contain bg-center bg-no-repeat text-xs font-black text-[#394049]" style={{ backgroundImage: "url('/edit.png')" }} href={`/projects/${id}/requirements/${req.id}/edit`}></Link>
                <button className="inline-flex h-14 w-16 items-center justify-center bg-contain bg-center bg-no-repeat text-xs font-black text-[#611f1f]" style={{ backgroundImage: "url('/delete.png')" }} onClick={() => removeReq(req.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between text-sm font-bold text-[#2f2419]">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button className="inline-flex h-20 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-sm font-black text-[#3f3c38] disabled:opacity-80" style={{ backgroundImage: "url('/next-previous.png')" }} disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Previous</button>
            <button className="inline-flex h-20 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-sm font-black text-[#3f3c38] disabled:opacity-80" style={{ backgroundImage: "url('/next-previous.png')" }} disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        </div>
      </div>

      <ModalAddRequirments
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={add}
        form={form}
        setForm={setForm}
        inventory={availableInventory}
      />
    </main>
  )
}
