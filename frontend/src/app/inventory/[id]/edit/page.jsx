'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import AppNav from '@/components/AppNav'
import { inventoryApi } from '@/services/labApi'

export default function EditInventoryPage() {
  const params = useParams()
  const id = params?.id
  const router = useRouter()
  const [form, setForm] = useState({ name: '', category: '', quantity: 0, unit: '', min_required: 0 })

  useEffect(() => {
    if (!id) return
    inventoryApi.get(id).then(setForm)
  }, [id])

  const save = async () => {
    await inventoryApi.update(id, {
      ...form,
      quantity: Number(form.quantity),
      min_required: Number(form.min_required),
    })
    router.push('/inventory')
  }

  return (
    <main className="ocean-page">
      <div className="ocean-overlay" />
      <AppNav />
      <div className="ocean-container max-w-5xl">
        <h1 className="page-title">Edit Inventory Item - {form.name || `#${id}`}</h1>
        <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-end">
          <div className="wood-form w-full max-w-3xl flex-1 flex flex-col gap-3">
            <label className="wood-label">Item Name</label>
            <input className="wood-field" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label className="wood-label">Category</label>
            <input className="wood-field" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <label className="wood-label">Quantity</label>
            <input type="number" className="wood-field" value={form.quantity || 0} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <label className="wood-label">Unit</label>
            <input className="wood-field" value={form.unit || ''} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <label className="wood-label">Min Required</label>
            <input type="number" className="wood-field" value={form.min_required || 0} onChange={(e) => setForm({ ...form, min_required: e.target.value })} />
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
