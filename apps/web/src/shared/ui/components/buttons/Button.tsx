import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'success' | 'ghost'
type ButtonSize = 'large' | 'medium' | 'small'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-default text-primary-on-primary hover:bg-primary-active',
  secondary: 'bg-primary-subtle text-primary-on-subtle hover:bg-secondary-active',
  destructive: 'bg-error-default text-error-on-error hover:bg-error-active',
  success: 'bg-success-default text-success-on-success hover:bg-success-active',
  ghost: 'bg-transparent text-primary-on-subtle hover:bg-secondary-active',
}

const sizeClasses: Record<ButtonSize, string> = {
  large: 'min-h-[52px] px-4 py-2 text-[15px]',
  medium: 'min-h-[44px] px-3.5 py-1.5 text-[14px]',
  small: 'min-h-[32px] px-3 py-1 text-[13px]',
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'large',
  disabled = false,
  isLoading = false,
  className = '',
  children,
  ...rest
}) => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors cursor-pointer'
  const variantCls = disabled
    ? 'bg-disabled-background text-disabled-content cursor-not-allowed'
    : variantClasses[variant]

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${sizeClasses[size]} ${variantCls} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children || (title && <span className="px-1">{title}</span>)
      )}
    </button>
  )
}
