import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { CloseIcon } from '@/lib/icons'

export type ModalProps = {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  /** Max width utility class, e.g. 'max-w-md'. */
  maxWidthClassName?: string
  showClose?: boolean
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidthClassName = 'max-w-lg',
  showClose = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [render, setRender] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (open) {
      setRender(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!mounted || !render) return null

  const target = document.getElementById('portal-root') ?? document.body

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200"
      style={{ backgroundColor: visible ? 'var(--backdrop)' : 'transparent' }}
      onClick={onClose}
      onTransitionEnd={() => {
        if (!open) setRender(false)
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-[24px] bg-[var(--color-paper,#ffffff)] border border-[var(--color-hairline,#e5e5e5)] shadow-2xl transition-all duration-200 ease-out',
          maxWidthClassName,
        )}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
        }}
      >
        {(title || showClose) && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-hairline,#e5e5e5)] px-6 py-4.5">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {title && <h2 className="text-[17px] font-semibold tracking-tight text-zinc-900 dark:text-white leading-snug">{title}</h2>}
              {description && <p className="text-paragraph-xs text-zinc-500 dark:text-zinc-400 leading-normal">{description}</p>}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 -mt-0.5 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <CloseIcon className="size-4" />
              </button>
            )}
          </div>
        )}
        {children && <div className="overflow-y-auto px-6 py-5 text-paragraph-sm text-zinc-700 dark:text-zinc-300">{children}</div>}
        {footer && <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] px-6 py-3.5">{footer}</div>}
      </div>
    </div>,
    target,
  )
}
