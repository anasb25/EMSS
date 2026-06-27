import { forwardRef, type TextareaHTMLAttributes } from 'react'
import styles from './Textarea.module.css'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const textareaId = id ?? props.name

    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={textareaId}>
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          className={[styles.textarea, error ? styles.invalid : '', className]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
