import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import Button from '@/components/Button'
import Checkbox from '@/components/Checkbox'
import type { ButtonVariant } from '@/components/Button'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AlertCircleIcon,
  Alert02Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  AiMagicIcon,
} from '@hugeicons/core-free-icons'

export type AlertModalStatus =
  | 'feature'
  | 'information'
  | 'success'
  | 'warning'
  | 'error'

export type AlertModalProps = {
  open: boolean
  onClose: () => void
  status?: AlertModalStatus
  /** Override the default status icon. */
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode

  /** Primary/confirm action. */
  confirmLabel?: string
  onConfirm?: () => void
  confirmVariant?: ButtonVariant
  isLoading?: boolean

  /** Secondary/cancel action. Hidden when `hideCancel`. */
  cancelLabel?: string
  onCancel?: () => void
  hideCancel?: boolean

  /** Situational "Don't show it again" checkbox. */
  showDontShowAgain?: boolean
  dontShowAgain?: boolean
  onDontShowAgainChange?: (checked: boolean) => void
  dontShowAgainLabel?: string

  className?: string
}



// static class maps (no dynamic class names → visible to Tailwind / @source)
// Tints come from the state tokens, never raw hex: they must flip with theme.
const badge: Record<AlertModalStatus, { bg: string; icon: string }> = {
  feature: { bg: 'bg-feature-base/10', icon: 'text-primary-base' },
  information: { bg: 'bg-information-weak dark:bg-information-soft/30', icon: 'text-primary-base' },
  success: { bg: 'bg-success-weak dark:bg-success-soft/20', icon: 'text-success-base' },
  warning: { bg: 'bg-warning-weak dark:bg-warning-soft/20', icon: 'text-warning-base' },
  error: { bg: 'bg-error-weak dark:bg-error-soft/20', icon: 'text-error-base' },
}

const statusIcon: Record<AlertModalStatus, React.ReactNode> = {
  feature: <HugeiconsIcon icon={AiMagicIcon} className="size-5" />,
  information: <HugeiconsIcon icon={InformationCircleIcon} className="size-5" />,
  success: <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5" />,
  warning: <HugeiconsIcon icon={Alert02Icon} className="size-5" />,
  error: <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />,
}

export default function AlertModal({
  open,
  onClose,
  status = 'feature',
  icon,
  title,
  description,
  confirmLabel = 'Continue',
  onConfirm,
  confirmVariant,
  isLoading = false,
  cancelLabel = 'Cancel',
  onCancel,
  hideCancel = false,
  showDontShowAgain = false,
  dontShowAgain = false,
  onDontShowAgainChange,
  dontShowAgainLabel = "Don't show it again",
  className,
}: AlertModalProps) {
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

  const p = badge[status]
  const resolvedConfirmVariant: ButtonVariant =
    confirmVariant ?? (status === 'error' ? 'error' : 'primary')
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
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'flex w-[440px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[24px] bg-[var(--color-paper,#ffffff)] border border-[var(--color-hairline,#e5e5e5)] shadow-2xl transition-all duration-200 ease-out',
          className,
        )}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3.5 p-6 pb-5 text-center">
          <div className={cn('flex items-center justify-center rounded-[16px] p-3.5', p.bg)}>
            <span className={cn('flex size-6 items-center justify-center', p.icon)}>
              {icon ?? statusIcon[status]}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-[17px] font-semibold tracking-tight text-zinc-900 dark:text-white">{title}</h2>
            {description && (
              <p className="text-paragraph-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-normal">{description}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] px-6 py-3.5">
          {showDontShowAgain ? (
            <Checkbox
              label={dontShowAgainLabel}
              checked={dontShowAgain}
              onChange={(e) => onDontShowAgainChange?.(e.target.checked)}
              wrapperClassName="shrink-0"
            />
          ) : <div />}
          <div className="flex items-center justify-end gap-2.5">
            {!hideCancel && (
              <Button size="small" mode="stroke" variant="neutral" onClick={onCancel ?? onClose}>
                {cancelLabel}
              </Button>
            )}
            <Button size="small" mode="filled" variant={resolvedConfirmVariant} isLoading={isLoading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    target,
  )
}
