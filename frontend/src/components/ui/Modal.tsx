import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import styles from './Modal.module.css'

const ANIMATION_MS = 250

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

interface ModalProps {
  isOpen: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
  anchorRef?: RefObject<HTMLElement | null>
}

function applyTransformOrigin(anchor: HTMLElement, modal: HTMLElement): void {
  const anchorRect = anchor.getBoundingClientRect()
  const modalRect = modal.getBoundingClientRect()
  const x = anchorRect.left + anchorRect.width / 2 - modalRect.left
  const y = anchorRect.top + anchorRect.height / 2 - modalRect.top
  modal.style.transformOrigin = `${x}px ${y}px`
}

export function Modal({
  isOpen,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
  anchorRef,
}: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const modalRef = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(false)

  useLayoutEffect(() => {
    if (isOpen) {
      setShouldRender(true)

      const frame = requestAnimationFrame(() => {
        const modal = modalRef.current
        if (modal) {
          if (anchorRef?.current) {
            applyTransformOrigin(anchorRef.current, modal)
          } else {
            modal.style.transformOrigin = 'center center'
          }
        }
        setIsVisible(true)
      })

      return () => cancelAnimationFrame(frame)
    }

    setIsVisible(false)
    const timeout = window.setTimeout(() => setShouldRender(false), ANIMATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isOpen, anchorRef])

  useEffect(() => {
    if (!shouldRender || !isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [shouldRender, isOpen, onClose])

  if (!shouldRender) return null

  return createPortal(
    <div
      className={[styles.overlay, isVisible ? styles.overlayVisible : ''].join(' ')}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={[
          styles.modal,
          styles[size],
          isVisible ? styles.modalVisible : '',
        ].join(' ')}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
