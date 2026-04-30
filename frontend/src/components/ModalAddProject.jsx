'use client'

export default function ModalAddProject({ open, onClose, onSubmit, form, setForm }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="wood-form w-full max-w-lg">
        <h3 className="mb-3 text-2xl font-black text-[#3f2c17]">Add Project</h3>
        <div className="flex flex-col gap-2">
          <label className="wood-label">Project Name</label>
          <input className="wood-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="wood-label">Description</label>
          <textarea className="wood-field min-h-24" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="wood-label">Priority</label>
          <input type="number" min="1" className="wood-field" placeholder="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="inline-flex h-18 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-sm font-black text-[#3f3c38]" style={{ backgroundImage: "url('/cancel.png')" }} onClick={onClose}>Cancel</button>
          <button className="inline-flex h-18 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-xl font-black text-[#2c382f]" style={{ backgroundImage: "url('/new-item.png')" }} onClick={onSubmit}>Save</button>
        </div>
      </div>
    </div>
  )
}
