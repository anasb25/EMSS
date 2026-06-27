import { forwardRef, type InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? props.name

    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={[styles.input, error ? styles.invalid : '', className]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    )
  },
)

Input.displayName = 'Input'
