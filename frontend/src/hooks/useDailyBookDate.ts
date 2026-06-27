import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { todayDateInputValue } from '@/types/cash'

export function useDailyBookDate(routePath: string) {
  const location = useLocation()
  const [selectedDate, setSelectedDate] = useState(todayDateInputValue)
  const lastKnownTodayRef = useRef(todayDateInputValue())

  const resetToToday = useCallback(() => {
    const today = todayDateInputValue()
    setSelectedDate(today)
    lastKnownTodayRef.current = today
  }, [])

  useEffect(() => {
    if (location.pathname === routePath) {
      resetToToday()
    }
  }, [location.pathname, resetToToday, routePath])

  useEffect(() => {
    const checkDayRollover = () => {
      const today = todayDateInputValue()
      if (today === lastKnownTodayRef.current) {
        return
      }

      setSelectedDate((current) =>
        current === lastKnownTodayRef.current ? today : current,
      )
      lastKnownTodayRef.current = today
    }

    checkDayRollover()

    const interval = window.setInterval(checkDayRollover, 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        checkDayRollover()
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', checkDayRollover)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', checkDayRollover)
    }
  }, [])

  return [selectedDate, setSelectedDate] as const
}
