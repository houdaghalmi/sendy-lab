'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import AppNav from '@/components/AppNav'
import KarenChatSlider from '@/components/KarenChatSlider'
import ModalAddInventory from '@/components/ModalAddInventory'
import { inventoryApi } from '@/services/labApi'

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: '', category: 'General', quantity: 0, unit: 'units', min_required: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  const load = async () => setItems(await inventoryApi.list())
  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    if (!form.name.trim()) return
    await inventoryApi.create({ ...form, name: form.name.trim(), quantity: Number(form.quantity), min_required: Number(form.min_required) })
    setForm({ name: '', category: 'General', quantity: 0, unit: 'units', min_required: 0 })
    setShowCreateModal(false)
    load()
  }

  const remove = async (id) => {
    await inventoryApi.remove(id)
    load()
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <main className="ocean-page">
      <div className="ocean-overlay" />
      <AppNav />
      <div className="ocean-container max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="list-title mb-0">Inventory</h1>
          <button
            className="h-20 w-44 bg-contain bg-center bg-no-repeat text-xl font-black text-[#2c382f]"
            style={{ backgroundImage: "url('/new-item.png')" }}
            onClick={() => setShowCreateModal(true)}
          >
            New Item
          </button>
        </div>

        <div className="wood-list grid gap-2">
          {paginatedItems.map((item) => (
            <div key={item.id} className="wood-item">
              <div>
                <p className="list-item-title">{item.name}</p>
                <p className="list-item-subtitle">{item.quantity} {item.unit} | min {item.min_required}</p>
              </div>
              <div className="flex items-center gap-1">
                <Link href={`/inventory/${item.id}/edit`} className="inline-flex h-10 w-12 items-center justify-center bg-contain bg-center bg-no-repeat text-xs font-black text-[#394049]" style={{ backgroundImage: "url('/edit.png')" }}></Link>
                <button className="inline-flex h-14 w-16 items-center justify-center bg-contain bg-center bg-no-repeat text-xs font-black text-[#611f1f]" style={{ backgroundImage: "url('/delete.png')" }} onClick={() => remove(item.id)}>Delete</button>
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

      <ModalAddInventory open={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={add} form={form} setForm={setForm} />
      <KarenChatSlider />
    </main>
  )
}
