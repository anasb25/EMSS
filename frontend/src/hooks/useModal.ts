import { useCallback, useState } from 'react'

export function useModal<T = undefined>() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<T | undefined>(undefined)

  const open = useCallback((item?: T) => {
    setData(item)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setData(undefined)
  }, [])

  return {
    isOpen,
    data,
    open,
    close,
  }
}
