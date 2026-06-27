import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type InputHTMLAttributes,
} from 'react'
import { CalendarDays } from 'lucide-react'
import { Calendar } from '@/components/ui/Calendar'
import { FloatingPortal } from '@/components/ui/FloatingPortal'
import { useFloatingPanel } from '@/hooks/useFloatingPanel'
import { formatInputDate } from '@/utils/date'
import styles from './DateInput.module.css'

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label: string
  error?: string
  value: string
  onChange: (event: { target: { name?: string; value: string } }) => void
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      label,
      error,
      id,
      className = '',
      value,
      onChange,
      name,
      min,
      max,
      disabled = false,
      required = false,
    },
    ref,
  ) => {
    const inputId = id ?? name
    const hiddenInputRef = useRef<HTMLInputElement>(null)
    const controlRef = useRef<HTMLButtonElement>(null)
    const [isOpen, setIsOpen] = useState(false)

    useImperativeHandle(ref, () => hiddenInputRef.current as HTMLInputElement)

    const { panelRef, panelStyle } = useFloatingPanel({
      isOpen,
      onClose: () => setIsOpen(false),
      anchorRef: controlRef,
      estimatedHeight: 360,
      matchAnchorWidth: false,
      panelWidth: 292,
    })

    function handleSelect(nextValue: string) {
      onChange({ target: { name, value: nextValue } })
      setIsOpen(false)
    }

    return (
      <div className={[styles.field, className].filter(Boolean).join(' ')}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>

        <input
          ref={hiddenInputRef}
          id={inputId}
          type="hidden"
          name={name}
          value={value}
          required={required}
          disabled={disabled}
          readOnly
        />

        <button
          ref={controlRef}
          type="button"
          disabled={disabled}
          className={[
            styles.control,
            isOpen ? styles.controlOpen : '',
            disabled ? styles.controlDisabled : '',
            error ? styles.invalid : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => {
            if (!disabled) setIsOpen((open) => !open)
          }}
        >
          <span className={styles.iconWrap} aria-hidden>
            <CalendarDays size={15} />
          </span>
          <span className={[styles.value, !value ? styles.placeholder : ''].filter(Boolean).join(' ')}>
            {value ? formatInputDate(value) : 'Select date'}
          </span>
        </button>

        {isOpen && panelStyle ? (
          <FloatingPortal>
            <div ref={panelRef} style={panelStyle}>
              <Calendar
                value={value}
                min={typeof min === 'string' ? min : undefined}
                max={typeof max === 'string' ? max : undefined}
                onChange={handleSelect}
              />
            </div>
          </FloatingPortal>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    )
  },
)

DateInput.displayName = 'DateInput'
