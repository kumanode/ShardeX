import { cn } from '@/lib/cn'

export type SegmentItem = {
  label: string
  value: string
  icon?: React.ReactNode
  disabled?: boolean
}

export type SegmentControlProps = {
  items: SegmentItem[]
  value: string
  onChange?: (value: string) => void
  size?: 'medium' | 'small'
  className?: string
}

export default function SegmentControl({
  items,
  value,
  onChange,
  size = 'medium',
  className,
}: SegmentControlProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex w-full items-center gap-1 rounded-lg bg-bg-soft-200 p-1 ring-1 ring-inset ring-stroke-soft-200',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={item.disabled}
            onClick={() => onChange?.(item.value)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md text-label-xs outline-none transition-all disabled:opacity-50',
              'focus-visible:shadow-[var(--ring-primary-focus)]',
              size === 'medium' ? 'h-8 px-3' : 'h-7 px-2.5',
              active
                ? 'bg-bg-white-0 text-text-strong-950 font-semibold shadow-xs ring-1 ring-inset ring-stroke-soft-200'
                : 'text-text-sub-600 hover:text-text-strong-950',
            )}
          >
            {item.icon && <span className="flex size-5 items-center justify-center">{item.icon}</span>}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
