import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { CheckIcon, ChevronDownIcon, SearchIcon } from '@/lib/icons'

export type SelectOption = {
  label: string
  value: string
  icon?: React.ReactNode
  disabled?: boolean
}

export type SelectProps = {
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  hint?: string
  error?: string
  size?: 'medium' | 'small'
  disabled?: boolean
  /** Show a search field inside the dropdown to filter options by label. */
  isSearchable?: boolean
  /** Placeholder for the search field (when `isSearchable`). */
  searchPlaceholder?: string
  className?: string
}

type Coords = {
  left: number
  width: number
  top?: number
  bottom?: number
  maxHeight: number
}

const DROPDOWN_MAX = 264

export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  label,
  hint,
  error,
  size = 'medium',
  disabled = false,
  isSearchable = false,
  searchPlaceholder = 'Search…',
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<Coords | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const hasError = Boolean(error)
  const selected = options.find((o) => o.value === value)

  const filteredOptions = useMemo(() => {
    if (!isSearchable || !query.trim()) return options
    const q = query.trim().toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  }, [isSearchable, query, options])

  useEffect(() => setMounted(true), [])

  const computePosition = () => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const gap = 4
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUp = spaceBelow < DROPDOWN_MAX && spaceAbove > spaceBelow
    if (openUp) {
      setCoords({
        left: rect.left,
        width: rect.width,
        bottom: window.innerHeight - rect.top + gap,
        maxHeight: Math.min(DROPDOWN_MAX, spaceAbove - gap - 8),
      })
    } else {
      setCoords({
        left: rect.left,
        width: rect.width,
        top: rect.bottom + gap,
        maxHeight: Math.min(DROPDOWN_MAX, spaceBelow - gap - 8),
      })
    }
  }

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  // Position + reposition on scroll/resize, close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    computePosition()
    if (isSearchable) requestAnimationFrame(() => searchRef.current?.focus())

    const reposition = () => computePosition()
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || dropdownRef.current?.contains(t)) return
      close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()

    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isSearchable])

  const dropdown =
    open && mounted && coords
      ? createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              left: coords.left,
              width: coords.width,
              top: coords.top,
              bottom: coords.bottom,
              zIndex: 1000,
            }}
            className="flex flex-col overflow-hidden rounded-[18px] bg-[var(--color-paper,#ffffff)] border border-[var(--color-hairline,#e5e5e5)] shadow-xl"
          >
            {isSearchable && (
              <div className="flex items-center gap-2 border-b border-[var(--color-hairline,#e5e5e5)] px-3">
                <SearchIcon className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full min-w-0 bg-transparent text-paragraph-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>
            )}
            <ul role="listbox" className="overflow-auto p-1.5 scrollbar" style={{ maxHeight: coords.maxHeight }}>
              {filteredOptions.length === 0 ? (
                <li className="px-2.5 py-4 text-center text-paragraph-sm text-zinc-400 dark:text-zinc-500">
                  No results
                </li>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value
                  return (
                    <li key={opt.value}>
                      <button
                        type="button"
                        disabled={opt.disabled}
                        onClick={() => {
                          onChange?.(opt.value)
                          close()
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-paragraph-sm text-zinc-800 dark:text-zinc-200 transition-colors',
                          'hover:bg-[var(--color-surface-alt,#fafafa)] hover:text-zinc-900 dark:hover:text-white disabled:pointer-events-none disabled:text-zinc-400',
                          isSelected && 'bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-900 dark:text-white',
                        )}
                      >
                        {opt.icon && <span className="flex size-5 shrink-0 items-center justify-center">{opt.icon}</span>}
                        <span className="flex-1 truncate">{opt.label}</span>
                        {isSelected && <CheckIcon className="size-4 shrink-0 text-zinc-900 dark:text-white" />}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body,
        )
      : null

  return (
    <div className={cn('flex w-full flex-col gap-1', className)}>
      {label && (
        <label htmlFor={id} className="text-label-sm font-medium text-zinc-900 dark:text-white">
          {label}
        </label>
      )}
      <button
        id={id}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-[18px] bg-[var(--color-paper,#ffffff)] text-left border border-[var(--color-hairline,#e5e5e5)] transition-all',
          size === 'medium' ? 'h-10 px-3.5' : 'h-9 px-3',
          !disabled && !hasError && 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ink,#0a0a0a)]',
          open && !hasError && 'ring-1 ring-[var(--color-ink,#0a0a0a)]',
          hasError && 'border-error-base ring-1 ring-error-base',
          disabled && 'pointer-events-none bg-[var(--color-surface-alt,#fafafa)] text-zinc-400',
        )}
      >
        <span className={cn('flex min-w-0 items-center gap-2 text-paragraph-sm', selected ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500')}>
          {selected?.icon && <span className="flex size-5 shrink-0 items-center justify-center">{selected.icon}</span>}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDownIcon className={cn('size-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform', open && 'rotate-180')} />
      </button>

      {dropdown}

      {(hint || error) && (
        <p className={cn('text-paragraph-xs', hasError ? 'text-error-base' : 'text-text-sub-600')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
