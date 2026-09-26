import { forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { SpinnerIcon } from '@/lib/icons'

export type ButtonVariant =
  | 'primary'
  | 'neutral'
  | 'error'
  /** Blue: the primary call to action when ink would not stand out. */
  | 'accent'
  | 'info'
  /** Green: confirms / commits. */
  | 'success'
  /** Green, reserved for launching a profile. */
  | 'launch'
  /** Red: stops a running profile. */
  | 'stop'
export type ButtonMode = 'filled' | 'stroke' | 'lighter' | 'ghost'
export type ButtonSize = 'medium' | 'small' | 'xsmall' | '2xsmall'

export type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  variant?: ButtonVariant
  mode?: ButtonMode
  size?: ButtonSize
  fullRadius?: boolean
  onlyIcon?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

const sizes: Record<ButtonSize, { base: string; radius: string; onlyIcon: string }> = {
  medium: { base: 'h-10 gap-2 px-4 font-medium text-[14px]', radius: 'rounded-[18px]', onlyIcon: 'w-10 px-0' },
  small: { base: 'h-9 gap-1.5 px-3.5 font-medium text-[13px]', radius: 'rounded-[18px]', onlyIcon: 'w-9 px-0' },
  xsmall: { base: 'h-[34px] gap-1.5 px-3 font-medium text-[12.5px]', radius: 'rounded-[18px]', onlyIcon: 'w-[34px] px-0' },
  '2xsmall': { base: 'h-[32px] gap-1 px-2.5 font-medium text-[11.5px]', radius: 'rounded-[18px]', onlyIcon: 'w-[32px] px-0' },
}

// The coloured families map to class names declared in the host's stylesheet
// (src/app/styles/accents.css). An arbitrary value such as
// `bg-[var(--color-accent)]` cannot be used here: the token only exists in the
// host's CSS, and Tailwind's scan of this built file produces no rule for it.
const looks: Record<ButtonMode, Record<ButtonVariant, string>> = {
  filled: {
    primary: 'bg-[var(--color-ink,#0a0a0a)] text-[var(--color-paper,#ffffff)] hover:opacity-90 shadow-none',
    neutral: 'bg-[var(--btn-neutral-bg)] text-[var(--btn-neutral-fg)] hover:opacity-90 shadow-none',
    error: 'bg-[var(--color-ember,#e7000b)] text-white hover:bg-red-700 shadow-none',
    accent: 'btn-accent',
    info: 'btn-info',
    success: 'btn-success',
    launch: 'btn-launch',
    stop: 'btn-stop',
  },
  stroke: {
    primary: 'bg-transparent text-[var(--color-ink,#0a0a0a)] ring-1 ring-inset ring-[var(--color-hairline,#e5e5e5)] hover:bg-[var(--color-canvas,#f5f5f5)]',
    neutral: 'bg-transparent text-[var(--color-ink,#0a0a0a)] ring-1 ring-inset ring-[var(--color-hairline,#e5e5e5)] hover:bg-[var(--color-canvas,#f5f5f5)]',
    error: 'bg-transparent text-[var(--color-ember,#e7000b)] ring-1 ring-inset ring-[var(--color-ember,#e7000b)] hover:bg-red-50',
    accent: 'btn-accent-soft',
    info: 'btn-info-soft',
    success: 'btn-success-soft',
    launch: 'btn-success-soft',
    stop: 'btn-stop-soft',
  },
  lighter: {
    primary: 'bg-[var(--color-canvas,#f5f5f5)] text-[var(--color-ink,#0a0a0a)] hover:bg-[var(--color-hairline,#e5e5e5)]',
    neutral: 'bg-[var(--color-canvas,#f5f5f5)] text-[var(--color-ink,#0a0a0a)] hover:bg-[var(--color-hairline,#e5e5e5)]',
    error: 'bg-[#ffebec] text-[var(--color-ember,#e7000b)] hover:bg-[#ffc0c5]',
    accent: 'btn-accent-soft',
    info: 'btn-info-soft',
    success: 'btn-success-soft',
    launch: 'btn-success-soft',
    stop: 'btn-stop-soft',
  },
  ghost: {
    primary: 'bg-[var(--color-canvas,#f5f5f5)] text-[var(--color-ink,#0a0a0a)] hover:bg-[var(--color-hairline,#e5e5e5)]',
    neutral: 'bg-[var(--color-canvas,#f5f5f5)] text-[var(--color-ink,#0a0a0a)] hover:bg-[var(--color-hairline,#e5e5e5)]',
    error: 'bg-transparent text-[var(--color-ember,#e7000b)] hover:bg-red-50',
    accent: 'btn-accent-soft',
    info: 'btn-info-soft',
    success: 'btn-success-soft',
    launch: 'btn-success-soft',
    stop: 'btn-stop-soft',
  },
}

const focusRing: Record<ButtonVariant, string> = {
  primary: 'focus-visible:shadow-[var(--ring-primary-focus)]',
  neutral: 'focus-visible:shadow-[var(--ring-neutral-focus)]',
  error: 'focus-visible:shadow-[var(--ring-error-focus)]',
  accent: 'focus-visible:shadow-[0_0_0_3px_var(--color-accent-ring,rgba(0,107,255,.35))]',
  info: 'focus-visible:shadow-[0_0_0_3px_var(--color-accent-ring,rgba(0,107,255,.35))]',
  success: 'focus-visible:shadow-[0_0_0_3px_var(--color-accent-ring,rgba(0,107,255,.35))]',
  launch: 'focus-visible:shadow-[0_0_0_3px_var(--color-accent-ring,rgba(0,107,255,.35))]',
  stop: 'focus-visible:shadow-[0_0_0_3px_var(--color-accent-ring,rgba(0,107,255,.35))]',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    mode = 'filled',
    size = 'medium',
    fullRadius = false,
    onlyIcon = false,
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    className,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const s = sizes[size]
  const isDisabled = disabled || isLoading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center text-label-sm outline-none transition duration-200 ease-out',
        s.base,
        fullRadius ? 'rounded-full' : s.radius,
        onlyIcon && s.onlyIcon,
        isDisabled
          ? 'pointer-events-none bg-bg-weak-50 text-text-disabled-300'
          : cn(looks[mode][variant], focusRing[variant]),
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <SpinnerIcon className="size-5 animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="flex size-5 shrink-0 items-center justify-center">{leftIcon}</span>}
          {!onlyIcon && children != null && <span className="px-1">{children}</span>}
          {rightIcon && <span className="flex size-5 shrink-0 items-center justify-center">{rightIcon}</span>}
        </>
      )}
    </button>
  )
})

export default Button
