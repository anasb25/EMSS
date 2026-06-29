import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { FloatingPortal } from '@/components/ui/FloatingPortal'
import { useFloatingPanel } from '@/hooks/useFloatingPanel'
import { useListboxKeyboard } from '@/hooks/useListboxKeyboard'
import styles from './SearchableSelect.module.css'

export interface SearchableSelectOption {
  value: string
  label: string
  sublabel?: string
}

interface SearchableSelectProps {
  label: string
  value: string
  selectedLabel?: string
  placeholder?: string
  options: SearchableSelectOption[]
  onSearchChange: (query: string) => void
  onChange: (value: string, option: SearchableSelectOption) => void
  isLoading?: boolean
  error?: string
  required?: boolean
}

export function SearchableSelect({
  label,
  value,
  selectedLabel,
  placeholder = 'Search...',
  options,
  onSearchChange,
  onChange,
  isLoading = false,
  error,
  required = false,
}: SearchableSelectProps) {
  const fieldId = useId()
  const controlRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const { panelRef, panelStyle } = useFloatingPanel({
    isOpen,
    onClose: () => setIsOpen(false),
    anchorRef: controlRef,
    estimatedHeight: 260,
  })

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery)
    onSearchChange(nextQuery)
    if (!isOpen) setIsOpen(true)
  }

  function handleSelect(option: SearchableSelectOption) {
    onChange(option.value, option)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const { highlightedIndex, setHighlightedIndex, handleKeyDown } = useListboxKeyboard({
    isOpen,
    setIsOpen,
    itemCount: options.length,
    onSelect: (index) => {
      const option = options[index]
      if (option) handleSelect(option)
    },
    onOpen: () => onSearchChange(query),
  })

  useEffect(() => {
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, isOpen, options])

  const displayValue = isOpen ? query : selectedLabel ?? ''

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId}>
        {label}
        {required ? <span className={styles.required}>*</span> : null}
      </label>

      <div
        ref={controlRef}
        className={[
          styles.control,
          isOpen ? styles.controlOpen : '',
          error ? styles.invalid : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Search size={16} className={styles.searchIcon} />
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          className={styles.input}
          value={displayValue}
          placeholder={value && !isOpen ? selectedLabel : placeholder}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => {
            setIsOpen(true)
            onSearchChange(query)
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setIsOpen((open) => !open)}
          aria-label="Toggle options"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {isOpen && panelStyle ? (
        <FloatingPortal>
          <div ref={panelRef} style={panelStyle} className={styles.dropdown}>
            {isLoading ? (
              <p className={styles.empty}>Searching...</p>
            ) : options.length ? (
              <ul className={styles.list} role="listbox">
                {options.map((option, index) => (
                  <li key={option.value}>
                    <button
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
                      onClick={() => handleSelect(option)}
                    >
                      <span>{option.label}</span>
                      {option.sublabel ? (
                        <small>{option.sublabel}</small>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>No results found</p>
            )}
          </div>
        </FloatingPortal>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  )
}
