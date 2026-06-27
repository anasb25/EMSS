import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'

export interface FloatingPlacement {
  top: number
  left: number
  width: number
  placement: 'above' | 'below'
}

interface UseFloatingPanelOptions {
  isOpen: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  estimatedHeight?: number
  matchAnchorWidth?: boolean
  panelWidth?: number
}

export function useFloatingPanel({
  isOpen,
  onClose,
  anchorRef,
  estimatedHeight = 240,
  matchAnchorWidth = true,
  panelWidth,
}: UseFloatingPanelOptions) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<FloatingPlacement | null>(null)

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) {
      setPlacement(null)
      return
    }

    function updatePlacement() {
      const anchor = anchorRef.current
      if (!anchor) return

      const rect = anchor.getBoundingClientRect()
      const gap = 6
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const openAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow
      const width = panelWidth ?? (matchAnchorWidth ? rect.width : undefined) ?? rect.width

      setPlacement({
        top: openAbove ? rect.top - gap : rect.bottom + gap,
        left: rect.left,
        width,
        placement: openAbove ? 'above' : 'below',
      })
    }

    updatePlacement()
    window.addEventListener('scroll', updatePlacement, true)
    window.addEventListener('resize', updatePlacement)

    return () => {
      window.removeEventListener('scroll', updatePlacement, true)
      window.removeEventListener('resize', updatePlacement)
    }
  }, [anchorRef, estimatedHeight, isOpen, matchAnchorWidth, panelWidth])

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      onClose()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [anchorRef, isOpen, onClose])

  const panelStyle: CSSProperties | undefined = placement
    ? {
        position: 'fixed',
        top: placement.top,
        left: placement.left,
        width: placement.width,
        zIndex: 1200,
        transform: placement.placement === 'above' ? 'translateY(-100%)' : undefined,
      }
    : undefined

  return { panelRef, panelStyle, placement }
}
