import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface FloatingPortalProps {
  children: ReactNode
}

export function FloatingPortal({ children }: FloatingPortalProps) {
  return createPortal(children, document.body)
}
