import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { formatTime } from '@/utils/formatTime'

describe('formatTime properties', () => {
  it('Property 7: Formato MM:SS cubre todo el rango válido', () => {
    // Feature: todo-pom, Property 7: Formato MM:SS cubre todo el rango válido
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1500 }), (seconds) => {
        const result = formatTime(seconds)
        expect(result).toMatch(/^\d{2}:\d{2}$/)
        const [mm, ss] = result.split(':')
        const minutes = Number(mm)
        const remainder = Number(ss)
        expect(minutes).toBeGreaterThanOrEqual(0)
        expect(minutes).toBeLessThanOrEqual(25)
        expect(remainder).toBeGreaterThanOrEqual(0)
        expect(remainder).toBeLessThanOrEqual(59)
        expect(minutes * 60 + remainder).toBe(seconds)
      }),
      { numRuns: 100 },
    )
  })
})
