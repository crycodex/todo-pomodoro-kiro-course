/**
 * Unit tests for formatTime utility
 */
import { describe, it, expect } from 'vitest'
import { formatTime } from '@/utils/formatTime'

describe('formatTime', () => {
  describe('standard durations', () => {
    it('formats full work duration (25 minutes)', () => {
      expect(formatTime(1500)).toBe('25:00')
    })

    it('formats full break duration (5 minutes)', () => {
      expect(formatTime(300)).toBe('05:00')
    })

    it('formats 5 minutes and 30 seconds', () => {
      expect(formatTime(330)).toBe('05:30')
    })

    it('formats 0 minutes and 45 seconds', () => {
      expect(formatTime(45)).toBe('00:45')
    })

    it('formats 0 minutes and 5 seconds', () => {
      expect(formatTime(5)).toBe('00:05')
    })
  })

  describe('boundary values', () => {
    it('formats zero seconds', () => {
      expect(formatTime(0)).toBe('00:00')
    })

    it('formats negative values as zero', () => {
      expect(formatTime(-1)).toBe('00:00')
      expect(formatTime(-100)).toBe('00:00')
    })

    it('formats exactly 10 seconds', () => {
      expect(formatTime(10)).toBe('00:10')
    })

    it('formats 9 seconds', () => {
      expect(formatTime(9)).toBe('00:09')
    })

    it('formats 59 seconds', () => {
      expect(formatTime(59)).toBe('00:59')
    })

    it('formats 60 seconds', () => {
      expect(formatTime(60)).toBe('01:00')
    })
  })

  describe('output format validation', () => {
    it('always matches MM:SS', () => {
      expect(formatTime(0)).toMatch(/^\d{2}:\d{2}$/)
      expect(formatTime(5)).toMatch(/^\d{2}:\d{2}$/)
      expect(formatTime(1500)).toMatch(/^\d{2}:\d{2}$/)
    })
  })
})
