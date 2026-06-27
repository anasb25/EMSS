import { type FormEvent, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/hooks/useAuth'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const location = useLocation()
  const { isAuthenticated, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    ROUTES.dashboard

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(username, password)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to sign in. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.brand}>
        <Logo showWordmark size="xl" />
      </div>

      <Card padding="lg" className={styles.card}>
        <div className={styles.intro}>
          <h1>Welcome back</h1>
          <p>Sign in to your EMSS workspace to continue.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Enter your username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error ? <p className={styles.error}>{error}</p> : null}

          <Button type="submit" fullWidth isLoading={isLoading}>
            Sign in
          </Button>
        </form>

        <p className={styles.footer}>Secure access to your business operations</p>
      </Card>
    </div>
  )
}
