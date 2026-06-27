import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  isLoading?: boolean
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={[
          styles.button,
          styles[variant],
          styles[size],
          fullWidth ? styles.fullWidth : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <span className={styles.spinner} aria-hidden /> : null}
        <span
          className={[styles.content, isLoading ? styles.hidden : ''].join(' ')}
        >
          {children}
        </span>
      </button>
    )
  },
)
