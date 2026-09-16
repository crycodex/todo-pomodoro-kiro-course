/**
 * Unit tests for formatTime utility
 */
import { describe, it, expect } from "vitest"
import { formatTime } from "@/utils/time"

describe("formatTime", () => {
  describe("standard durations", () => {
    it("formats full work duration (25 minutes)", () => {
      expect(formatTime(1500)).toBe("25:00")
    })

    it("formats full break duration (5 minutes)", () => {
      expect(formatTime(300)).toBe("05:00")
    })

    it("formats 5 minutes and 30 seconds", () => {
      expect(formatTime(330)).toBe("05:30")
    })

    it("formats 0 minutes and 45 seconds", () => {
      expect(formatTime(45)).toBe("00:45")
    })

    it("formats 0 minutes and 5 seconds", () => {
      expect(formatTime(5)).toBe("00:05")
    })
  })

  describe("boundary values", () => {
    it("formats zero seconds", () => {
      expect(formatTime(0)).toBe("0:00")
    })

    it("formats negative values as zero", () => {
      expect(formatTime(-1)).toBe("0:00")
      expect(formatTime(-100)).toBe("0:00")
    })

    it("formats exactly 10 seconds", () => {
      expect(formatTime(10)).toBe("00:10")
    })

    it("formats 9 seconds", () => {
      expect(formatTime(9)).toBe("00:09")
    })

    it("formats 59 seconds", () => {
      expect(formatTime(59)).toBe("00:59")
    })

    it("formats 60 seconds", () => {
      expect(formatTime(60)).toBe("01:00")
    })
  })

  describe("edge cases around 10-second threshold", () => {
    it("formats 11 seconds", () => {
      expect(formatTime(11)).toBe("00:11")
    })

    it("formats 19 seconds", () => {
      expect(formatTime(19)).toBe("00:19")
    })

    it("formats 20 seconds", () => {
      expect(formatTime(20)).toBe("00:20")
    })

    it("formats 30 seconds", () => {
      expect(formatTime(30)).toBe("00:30")
    })

    it("formats 1 minute and 1 second", () => {
      expect(formatTime(61)).toBe("01:01")
    })

    it("formats 1 minute and 9 seconds", () => {
      expect(formatTime(69)).toBe("01:09")
    })

    it("formats 1 minute and 10 seconds", () => {
      expect(formatTime(70)).toBe("01:10")
    })
  })

  describe("output format validation", () => {
    it("always includes a colon separator", () => {
      expect(formatTime(5)).toContain(":")
      expect(formatTime(1500)).toContain(":")
      expect(formatTime(0)).toContain(":")
    })

    it("always has two parts separated by colon", () => {
      const parts = formatTime(1500).split(":")
      expect(parts).toHaveLength(2)
    })
  })

  describe("minutes formatting", () => {
    it("formats single-digit minutes with leading zero", () => {
      expect(formatTime(60)).toMatch(/^0\d:/)
      expect(formatTime(300)).toMatch(/^0\d:/)
      expect(formatTime(599)).toMatch(/^0\d:/)
    })

    it("formats double-digit minutes without extra padding", () => {
      expect(formatTime(600)).toMatch(/^1\d:/)
      expect(formatTime(1500)).toMatch(/^2\d:/)
    })

    it("formats zero minutes as single digit for zero case", () => {
      expect(formatTime(0)).toBe("0:00")
    })
  })

  describe("seconds formatting", () => {
    it("formats single-digit seconds with leading zero", () => {
      expect(formatTime(5)).toMatch(/:0\d$/)
      expect(formatTime(65)).toMatch(/:0\d$/)
      expect(formatTime(125)).toMatch(/:0\d$/)
    })

    it("formats double-digit seconds without extra padding", () => {
      expect(formatTime(10)).toMatch(/:\d{2}$/)
      expect(formatTime(59)).toMatch(/:\d{2}$/)
      expect(formatTime(70)).toMatch(/:\d{2}$/)
    })
  })
})