import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  buildCalendarMonth,
  buildYearRange,
  isDateDisabled,
  isMonthDisabled,
  isSameDay,
  isYearDisabled,
  monthLongName,
  monthShortName,
  parseIsoDate,
  todayIsoDate,
  WEEKDAY_LABELS,
  yearRangeLabel,
  yearRangeStart,
} from '@/utils/date'
import styles from './Calendar.module.css'

interface CalendarProps {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
}

type CalendarView = 'days' | 'months' | 'years'

const YEAR_PAGE_SIZE = 12

export function Calendar({ value, onChange, min, max }: CalendarProps) {
  const selectedDate = parseIsoDate(value)
  const today = useMemo(() => new Date(), [])
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? today)
  const [view, setView] = useState<CalendarView>('days')

  const days = useMemo(() => buildCalendarMonth(visibleMonth), [visibleMonth])
  const visibleYear = visibleMonth.getFullYear()
  const visibleMonthIndex = visibleMonth.getMonth()
  const yearPageStart = yearRangeStart(visibleYear, YEAR_PAGE_SIZE)
  const years = useMemo(
    () => buildYearRange(yearPageStart, YEAR_PAGE_SIZE),
    [yearPageStart],
  )

  function shiftMonth(offset: number) {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    )
  }

  function shiftYear(offset: number) {
    setVisibleMonth(
      (current) => new Date(current.getFullYear() + offset, current.getMonth(), 1),
    )
  }

  function shiftYearPage(offset: number) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear() + offset * YEAR_PAGE_SIZE, current.getMonth(), 1),
    )
  }

  function handleSelectDay(iso: string, date: Date) {
    if (isDateDisabled(date, min, max)) return
    onChange(iso)
  }

  function handleSelectMonth(monthIndex: number) {
    if (isMonthDisabled(visibleYear, monthIndex, min, max)) return
    setVisibleMonth(new Date(visibleYear, monthIndex, 1))
    setView('days')
  }

  function handleSelectYear(year: number) {
    if (isYearDisabled(year, min, max)) return
    setVisibleMonth(new Date(year, visibleMonthIndex, 1))
    setView('months')
  }

  function handleToday() {
    const iso = todayIsoDate()
    const date = parseIsoDate(iso)
    if (!date || isDateDisabled(date, min, max)) return
    setVisibleMonth(date)
    setView('days')
    onChange(iso)
  }

  function handlePrevious() {
    if (view === 'days') shiftMonth(-1)
    else if (view === 'months') shiftYear(-1)
    else shiftYearPage(-1)
  }

  function handleNext() {
    if (view === 'days') shiftMonth(1)
    else if (view === 'months') shiftYear(1)
    else shiftYearPage(1)
  }

  const previousLabel =
    view === 'days' ? 'Previous month' : view === 'months' ? 'Previous year' : 'Previous years'

  const nextLabel =
    view === 'days' ? 'Next month' : view === 'months' ? 'Next year' : 'Next years'

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navButton}
          aria-label={previousLabel}
          onClick={handlePrevious}
        >
          <ChevronLeft size={16} />
        </button>

        <div className={styles.headerLabel}>
          {view === 'days' ? (
            <>
              <button
                type="button"
                className={styles.headerButton}
                onClick={() => setView('months')}
              >
                {monthLongName(visibleMonthIndex)}
              </button>
              <button
                type="button"
                className={styles.headerButton}
                onClick={() => setView('years')}
              >
                {visibleYear}
              </button>
            </>
          ) : null}

          {view === 'months' ? (
            <button
              type="button"
              className={[styles.headerButton, styles.headerButtonSingle].join(' ')}
              onClick={() => setView('years')}
            >
              {visibleYear}
            </button>
          ) : null}

          {view === 'years' ? (
            <span className={styles.headerRange}>{yearRangeLabel(yearPageStart, YEAR_PAGE_SIZE)}</span>
          ) : null}
        </div>

        <button
          type="button"
          className={styles.navButton}
          aria-label={nextLabel}
          onClick={handleNext}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {view === 'days' ? (
        <>
          <div className={styles.weekdays}>
            {WEEKDAY_LABELS.map((weekday) => (
              <span key={weekday} className={styles.weekday}>
                {weekday}
              </span>
            ))}
          </div>

          <div className={styles.grid}>
            {days.map((day) => {
              const disabled = isDateDisabled(day.date, min, max)
              const isSelected = selectedDate ? isSameDay(day.date, selectedDate) : false
              const isToday = isSameDay(day.date, today)

              return (
                <button
                  key={day.iso}
                  type="button"
                  disabled={disabled}
                  className={[
                    styles.day,
                    !day.inCurrentMonth ? styles.dayOutside : '',
                    isToday ? styles.dayToday : '',
                    isSelected ? styles.daySelected : '',
                    disabled ? styles.dayDisabled : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleSelectDay(day.iso, day.date)}
                >
                  {day.date.getDate()}
                </button>
              )
            })}
          </div>
        </>
      ) : null}

      {view === 'months' ? (
        <div className={styles.pickerGrid}>
          {Array.from({ length: 12 }, (_, monthIndex) => {
            const disabled = isMonthDisabled(visibleYear, monthIndex, min, max)
            const isSelected = visibleMonthIndex === monthIndex
            const isCurrent = today.getFullYear() === visibleYear && today.getMonth() === monthIndex

            return (
              <button
                key={monthIndex}
                type="button"
                disabled={disabled}
                className={[
                  styles.pickerCell,
                  isCurrent ? styles.pickerCurrent : '',
                  isSelected ? styles.pickerSelected : '',
                  disabled ? styles.pickerDisabled : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSelectMonth(monthIndex)}
              >
                {monthShortName(monthIndex)}
              </button>
            )
          })}
        </div>
      ) : null}

      {view === 'years' ? (
        <div className={styles.pickerGrid}>
          {years.map((year) => {
            const disabled = isYearDisabled(year, min, max)
            const isSelected = visibleYear === year
            const isCurrent = today.getFullYear() === year

            return (
              <button
                key={year}
                type="button"
                disabled={disabled}
                className={[
                  styles.pickerCell,
                  isCurrent ? styles.pickerCurrent : '',
                  isSelected ? styles.pickerSelected : '',
                  disabled ? styles.pickerDisabled : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSelectYear(year)}
              >
                {year}
              </button>
            )
          })}
        </div>
      ) : null}

      <div className={styles.footer}>
        {view !== 'days' ? (
          <button type="button" className={styles.secondaryButton} onClick={() => setView('days')}>
            Back to days
          </button>
        ) : null}
        <button type="button" className={styles.todayButton} onClick={handleToday}>
          Today
        </button>
      </div>
    </div>
  )
}
