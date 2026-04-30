'use client'

import SearchableSelect from '@/components/SearchableSelect'

export default function ModalAddRequirments({ open, onClose, onSubmit, form, setForm, inventory = [] }) {
  const selectedInventory = inventory.find((item) => String(item.id) === String(form.inventory_id))

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="wood-form w-full max-w-lg">
        <h3 className="mb-3 text-2xl font-black text-[#3f2c17]">Add Requirement</h3>
        <div className="flex flex-col gap-2">
          <label className="wood-label">Inventory Item</label>
          <SearchableSelect
            options={inventory}
            value={form.inventory_id}
            onChange={(inventoryId) => setForm({ ...form, inventory_id: inventoryId })}
            searchPlaceholder="Search inventory..."
            selectPlaceholder="Select item"
            getOptionLabel={(item) => item.name}
            getOptionValue={(item) => item.id}
          />
          <p className="text-xs font-bold text-[#3f2c17]">Unit: {selectedInventory?.unit || '-'}</p>
          <label className="wood-label">Required Quantity</label>
          <input type="number" min="1" className="wood-field" placeholder="Required quantity" value={form.required_quantity} onChange={(e) => setForm({ ...form, required_quantity: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="inline-flex h-18 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-sm font-black text-[#3f3c38]" style={{ backgroundImage: "url('/cancel.png')" }} onClick={onClose}>Cancel</button>
          <button className="inline-flex h-18 w-24 items-center justify-center bg-contain bg-center bg-no-repeat text-xl font-black text-[#2c382f]" style={{ backgroundImage: "url('/new-item.png')" }} onClick={onSubmit}>Save</button>
        </div>
      </div>
    </div>
  )
}
