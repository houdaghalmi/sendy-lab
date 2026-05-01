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
        className="wood-field border-[#67acd0] bg-[linear-gradient(180deg,rgba(255,255,255,0.68)_0%,rgba(236,249,255,0.92)_100%)] pr-9"
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
      <span className="pointer-events-none absolute right-3 top-3 text-xs font-black text-[#2f5f7e]">▼</span>
      {open && (
        <div className="absolute top-[calc(100%+6px)] z-50 max-h-64 w-full overflow-auto rounded-2xl border border-[#72bbdc] bg-[linear-gradient(180deg,#e8f7ff_0%,#d4edf9_100%)] p-1.5 shadow-[0_12px_24px_rgba(0,45,85,0.2)]">
          <button
            className="block w-full rounded-xl border border-transparent px-3 py-2 text-left text-sm font-black text-[#2f5f7e] transition hover:border-[#84c7e4] hover:bg-[#f4fbff]"
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
              className="block w-full rounded-xl border border-transparent px-3 py-2 text-left text-sm font-bold text-[#173a54] transition hover:border-[#84c7e4] hover:bg-[#f4fbff]"
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
          {!filteredOptions.length && (
            <p className="px-3 py-2 text-sm font-bold text-[#6b8ca1]">No matching options</p>
          )}
        </div>
      )}
    </div>
  )
}
