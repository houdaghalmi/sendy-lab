'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  searchPlaceholder = 'Search...',
  selectPlaceholder = 'Select option',
  getOptionLabel = (option) => option?.label ?? '',
  getOptionValue = (option) => option?.value,
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return options
    return options.filter((option) => getOptionLabel(option).toLowerCase().includes(query))
  }, [getOptionLabel, options, search])

  useEffect(() => {
    if (value === undefined || value === null || value === '') return
    const selected = options.find((option) => String(getOptionValue(option)) === String(value))
    if (selected) setSearch(getOptionLabel(selected))
  }, [getOptionLabel, getOptionValue, options, value])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  return (
    <div ref={rootRef} className="relative flex flex-col gap-2">
      <input
        className="wood-field"
        placeholder={searchPlaceholder}
        value={search}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value)
          setOpen(true)
          if (!e.target.value.trim()) onChange('')
        }}
      />
      {open && (
        <div className="absolute top-[calc(100%+4px)] z-50 max-h-56 w-full overflow-auto rounded-xl border border-[#6e512f] bg-[#ead9bc] p-1 shadow-lg">
          <button
            className="block w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-[#4e402f] hover:bg-[#d7c4a0]"
            onClick={() => {
              onChange('')
              setSearch('')
              setOpen(false)
            }}
          >
            {selectPlaceholder}
          </button>
          {filteredOptions.map((option) => (
            <button
              key={String(getOptionValue(option))}
              className="block w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-[#3f2c17] hover:bg-[#d7c4a0]"
              onClick={() => {
                const nextValue = String(getOptionValue(option))
                onChange(nextValue)
                setSearch(getOptionLabel(option))
                setOpen(false)
              }}
            >
              {getOptionLabel(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
