import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type SelectHTMLAttributes,
} from 'react'
import { ChevronDown } from 'lucide-react'
import { FloatingPortal } from '@/components/ui/FloatingPortal'
import { useFloatingPanel } from '@/hooks/useFloatingPanel'
import { useListboxKeyboard } from '@/hooks/useListboxKeyboard'
import styles from './Select.module.css'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  onChange?: (event: { target: { name?: string; value: string } }) => void
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      error,
      id,
      className = '',
      options,
      placeholder = 'Select...',
      value = '',
      name,
      disabled = false,
      required = false,
      onChange,
    },
    ref,
  ) => {
    const generatedId = useId()
    const fieldId = id ?? name ?? generatedId
    const buttonRef = useRef<HTMLButtonElement>(null)
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
    const [isOpen, setIsOpen] = useState(false)

    useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement)

    const listItems = useMemo(() => {
      const items: SelectOption[] = []
      if (placeholder) {
        items.push({ value: '', label: placeholder })
      }
      items.push(...options)
      return items
    }, [options, placeholder])

    const { panelRef, panelStyle } = useFloatingPanel({
      isOpen,
      onClose: () => setIsOpen(false),
      anchorRef: buttonRef,
      estimatedHeight: 240,
    })

    const selectedOption = options.find((option) => option.value === value)

    function handleSelect(nextValue: string) {
      onChange?.({ target: { name, value: nextValue } })
      setIsOpen(false)
      buttonRef.current?.focus()
    }

    const { highlightedIndex, setHighlightedIndex, handleKeyDown } = useListboxKeyboard({
      isOpen,
      setIsOpen,
      itemCount: listItems.length,
      onSelect: (index) => {
        const item = listItems[index]
        if (item) handleSelect(item.value)
      },
    })

    useEffect(() => {
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }, [highlightedIndex, isOpen])

    return (
      <div className={[styles.field, className].filter(Boolean).join(' ')}>
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>

        <input
          tabIndex={-1}
          aria-hidden
          className={styles.hiddenInput}
          name={name}
          value={value}
          required={required}
          disabled={disabled}
          readOnly
        />

        <button
          ref={buttonRef}
          id={fieldId}
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
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => {
            if (!disabled) setIsOpen((open) => !open)
          }}
          onKeyDown={handleKeyDown}
        >
          <span
            className={[
              styles.value,
              !selectedOption ? styles.placeholder : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown
            size={16}
            className={[styles.chevron, isOpen ? styles.chevronOpen : '']
              .filter(Boolean)
              .join(' ')}
          />
        </button>

        {isOpen && panelStyle ? (
          <FloatingPortal>
            <div
              ref={panelRef}
              style={panelStyle}
              className={styles.dropdown}
              role="listbox"
            >
              {listItems.map((option, index) => (
                <button
                  key={option.value || '__placeholder__'}
                  ref={(element) => {
                    optionRefs.current[index] = element
                  }}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={[
                    styles.option,
                    option.value === value ? styles.optionSelected : '',
                    index === highlightedIndex ? styles.optionHighlighted : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FloatingPortal>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    )
  },
)

Select.displayName = 'Select'
