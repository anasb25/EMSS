import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'

interface UseListboxKeyboardOptions {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  itemCount: number
  onSelect: (index: number) => void
  onOpen?: () => void
}

export function useListboxKeyboard({
  isOpen,
  setIsOpen,
  itemCount,
  onSelect,
  onOpen,
}: UseListboxKeyboardOptions) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1)
      return
    }

    setHighlightedIndex(itemCount > 0 ? 0 : -1)
  }, [isOpen, itemCount])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
            onOpen?.()
            return
          }
          if (itemCount > 0) {
            setHighlightedIndex((current) =>
              current < itemCount - 1 ? current + 1 : 0,
            )
          }
          break
        case 'ArrowUp':
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
            onOpen?.()
            return
          }
          if (itemCount > 0) {
            setHighlightedIndex((current) =>
              current > 0 ? current - 1 : itemCount - 1,
            )
          }
          break
        case 'Enter':
          if (!isOpen) {
            return
          }
          if (highlightedIndex >= 0 && highlightedIndex < itemCount) {
            event.preventDefault()
            onSelect(highlightedIndex)
          }
          break
        case 'Escape':
          if (isOpen) {
            event.preventDefault()
            setIsOpen(false)
          }
          break
        case 'Home':
          if (isOpen && itemCount > 0) {
            event.preventDefault()
            setHighlightedIndex(0)
          }
          break
        case 'End':
          if (isOpen && itemCount > 0) {
            event.preventDefault()
            setHighlightedIndex(itemCount - 1)
          }
          break
        default:
          break
      }
    },
    [highlightedIndex, isOpen, itemCount, onOpen, onSelect, setIsOpen],
  )

  return { highlightedIndex, setHighlightedIndex, handleKeyDown }
}
