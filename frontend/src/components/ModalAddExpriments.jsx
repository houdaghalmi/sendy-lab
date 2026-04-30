'use client'

import SearchableSelect from '@/components/SearchableSelect'

export default function ModalAddExpriments({ open, onClose, onSubmit, form, setForm, projects = [] }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="wood-form w-full max-w-lg">
        <h3 className="mb-3 text-2xl font-black text-[#3f2c17]">Add Experiment</h3>
        <div className="flex flex-col gap-2">
          <label className="wood-label">Project</label>
          <SearchableSelect
            options={projects}
            value={form.project_id}
            onChange={(projectId) => setForm({ ...form, project_id: projectId })}
            searchPlaceholder="Search project..."
            selectPlaceholder="Select project"
            getOptionLabel={(project) => `${project.name} #${project.id}`}
            getOptionValue={(project) => project.id}
          />
          <label className="wood-label">Result</label>
          <input className="wood-field" placeholder="Result" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} />
          <label className="wood-label">Notes</label>
          <textarea className="wood-field min-h-24" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <label className="wood-label">Success</label>
          <label className="text-sm font-bold text-[#3f2c17]"><input type="checkbox" checked={!!form.success} onChange={(e) => setForm({ ...form, success: e.target.checked })} /> Success</label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="inline-flex h-18 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-sm font-black text-[#3f3c38]" style={{ backgroundImage: "url('/cancel.png')" }} onClick={onClose}>Cancel</button>
          <button className="inline-flex h-18 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-xl font-black text-[#2c382f]" style={{ backgroundImage: "url('/new-item.png')" }} onClick={onSubmit}>Save</button>
        </div>
      </div>
    </div>
  )
}
