import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import Button from '@/components/Button'
import type { ButtonVariant } from '@/components/Button'
import { CloseIcon } from '@/lib/icons'

export type DialogModalProps = {
  open: boolean
  onClose: () => void
  /** Optional circular, bordered header icon. */
  icon?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Body content. */
  children?: React.ReactNode

  /** Custom footer. When omitted, the default Cancel + confirm actions render. */
  footer?: React.ReactNode
  hideFooter?: boolean

  /** Default footer actions (used only when `footer` is not provided). */
  confirmLabel?: string
  onConfirm?: () => void
  confirmVariant?: ButtonVariant
  isLoading?: boolean
  isDisabled?: boolean
  cancelLabel?: string
  onCancel?: () => void
  hideCancel?: boolean

  showClose?: boolean
  maxWidthClassName?: string
  bodyClassName?: string
  className?: string
}

export default function DialogModal({
  open,
  onClose,
  icon,
  title,
  subtitle,
  children,
  footer,
  hideFooter = false,
  confirmLabel = 'Apply Changes',
  onConfirm,
  confirmVariant = 'primary',
  isLoading = false,
  isDisabled = false,
  cancelLabel = 'Cancel',
  onCancel,
  hideCancel = false,
  showClose = true,
  maxWidthClassName = 'w-[480px] max-w-[calc(100vw-2rem)]',
  bodyClassName,
  className,
}: DialogModalProps) {
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
  const showDefaultFooter = !hideFooter && (footer != null || onConfirm != null || !hideCancel)

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
          'flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[24px] bg-[var(--color-paper,#ffffff)] border border-[var(--color-hairline,#e5e5e5)] shadow-2xl transition-all duration-200 ease-out',
          maxWidthClassName,
          className,
        )}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
        }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start gap-3.5 border-b border-[var(--color-hairline,#e5e5e5)] px-6 py-4.5">
          {icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-zinc-100 dark:bg-zinc-800/80 border border-[var(--color-hairline,#e5e5e5)] text-zinc-700 dark:text-zinc-200">
              <span className="flex size-4.5 items-center justify-center">{icon}</span>
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 className="text-[17px] font-semibold tracking-tight text-zinc-900 dark:text-white leading-snug">{title}</h2>
            {subtitle && <p className="text-paragraph-xs text-zinc-500 dark:text-zinc-400 leading-normal">{subtitle}</p>}
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

        {/* Body */}
        {children != null && (
          <div className={cn('overflow-y-auto px-6 py-4 text-paragraph-sm text-zinc-700 dark:text-zinc-300', bodyClassName)}>{children}</div>
        )}

        {/* Footer */}
        {showDefaultFooter &&
          (footer != null ? (
            <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] px-6 py-3.5">
              {footer}
            </div>
          ) : (
            <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] px-6 py-3.5">
              {!hideCancel && (
                <Button size="small" mode="stroke" variant="neutral" onClick={onCancel ?? onClose}>
                  {cancelLabel}
                </Button>
              )}
              {onConfirm && (
                <Button size="small" mode="filled" disabled={isDisabled} variant={confirmVariant} isLoading={isLoading} onClick={onConfirm}>
                  {confirmLabel}
                </Button>
              )}
            </div>
          ))}
      </div>
    </div>,
    target,
  )
}
