/**
 * Pinyin input hook
 * Provides utilities for pinyin input handling
 */

import { useState, useCallback } from 'react'
import { addToneMark } from '@/lib/utils/pinyin-utils'

export function usePinyinInput(initialValue = '') {
  const [value, setValue] = useState(initialValue)
  const [selectedTone, setSelectedTone] = useState<number | null>(null)

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue)
    setSelectedTone(null)
  }, [])

  const handleToneSelect = useCallback(
    (tone: number) => {
      if (!value) {
        return
      }

      const syllables = value.split(/\s+/)
      const lastSyllable = syllables[syllables.length - 1] || ''

      if (lastSyllable) {
        const withTone = addToneMark(lastSyllable, tone)
        const newValue = [...syllables.slice(0, -1), withTone].join(' ')
        setValue(newValue)
        setSelectedTone(tone)
      }
    },
    [value]
  )

  const reset = useCallback(() => {
    setValue('')
    setSelectedTone(null)
  }, [])

  return {
    value,
    selectedTone,
    handleChange,
    handleToneSelect,
    reset,
  }
}
