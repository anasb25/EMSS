import type { ImgHTMLAttributes } from 'react'
import emssLogo from '@/assets/emss-logo.png'
import styles from './Logo.module.css'

interface LogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  showWordmark?: boolean
  variant?: 'default' | 'light'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Logo({
  showWordmark = true,
  variant = 'default',
  size = 'lg',
  className = '',
  alt = 'EMSS',
  ...props
}: LogoProps) {
  return (
    <div
      className={[
        styles.logo,
        showWordmark ? styles.withWordmark : '',
        variant === 'light' ? styles.light : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <img
        src={emssLogo}
        alt={alt}
        className={[styles.mark, styles[size]].join(' ')}
        {...props}
      />
      {showWordmark ? (
        <div className={styles.wordmark}>
          <strong>EMSS</strong>
          <span>Enterprise Suite</span>
        </div>
      ) : null}
    </div>
  )
}
