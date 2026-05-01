'use client'

export default function ModalAddInventory({ open, onClose, onSubmit, form, setForm }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="krusty-modal w-full max-w-lg">
        <h3 className="krusty-modal-title">Add Inventory Item</h3>
        <div className="flex flex-col gap-2">
          <label className="wood-label">Item Name</label>
          <input className="wood-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="wood-label">Category</label>
          <input className="wood-field" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <label className="wood-label">Quantity</label>
          <input type="number" className="wood-field" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <label className="wood-label">Unit</label>
          <input className="wood-field" placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <label className="wood-label">Min Required</label>
          <input type="number" className="wood-field" placeholder="Min required" value={form.min_required} onChange={(e) => setForm({ ...form, min_required: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="inline-flex h-18 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-sm font-black text-[#3f3c38]" style={{ backgroundImage: "url('/cancel.png')" }} onClick={onClose}>Cancel</button>
          <button className="inline-flex h-18 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-xl font-black text-[#2c382f]" style={{ backgroundImage: "url('/new-item.png')" }} onClick={onSubmit}>Save</button>
        </div>
      </div>
    </div>
  )
}
