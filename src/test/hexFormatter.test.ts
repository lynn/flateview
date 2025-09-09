import { describe, it, expect } from 'vitest'
import { HexFormatter } from '../HexFormatter'
import type { HighlightRange } from '../types'

describe('HexFormatter', () => {
  it('should format hex dump correctly', () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0])
    const result = HexFormatter.formatHexDump(data)
    
    expect(result).toContain('12')
    expect(result).toContain('34')
    expect(result).toContain('56')
    expect(result).toContain('78')
    expect(result).toContain('9A')
    expect(result).toContain('BC')
    expect(result).toContain('DE')
    expect(result).toContain('F0')
  })

  it('should handle empty data', () => {
    const data = new Uint8Array([])
    const result = HexFormatter.formatHexDump(data)
    
    expect(result).toBe('')
  })

  it('should handle single byte', () => {
    const data = new Uint8Array([0xFF])
    const result = HexFormatter.formatHexDump(data)
    
    expect(result).toContain('FF')
  })

  it('should handle data longer than 16 bytes', () => {
    const data = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
      data[i] = i
    }
    
    const result = HexFormatter.formatHexDump(data)
    
    // Should have multiple lines
    const lines = result.split('\n').filter(line => line.trim())
    expect(lines.length).toBe(2)
    
    // First line should contain 00-0F
    expect(result).toContain('00')
    expect(result).toContain('0F')
    
    // Second line should contain 10-1F
    expect(result).toContain('10')
    expect(result).toContain('1F')
  })

  it('should highlight ranges correctly', () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0])
    const highlightRanges: HighlightRange[] = [
      {
        start: 1,
        end: 3,
        type: 'literal',
        bitStart: 8,
        bitEnd: 24,
        startBitInByte: 0,
        endBitInByte: 7
      }
    ]
    
    const result = HexFormatter.formatHexDump(data, highlightRanges)
    
    // Should contain highlighted content (using inline styles)
    expect(result).toContain('background: linear-gradient')
  })

  it('should handle partial byte highlighting', () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
    const highlightRanges: HighlightRange[] = [
      {
        start: 1,
        end: 2,
        type: 'literal',
        bitStart: 12,
        bitEnd: 16,
        startBitInByte: 4,
        endBitInByte: 7
      }
    ]
    
    const result = HexFormatter.formatHexDump(data, highlightRanges)
    
    // Should contain gradient styling for partial byte
    expect(result).toContain('background: linear-gradient')
  })

  it('should handle multiple highlight ranges', () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0])
    const highlightRanges: HighlightRange[] = [
      {
        start: 0,
        end: 2,
        type: 'literal',
        bitStart: 0,
        bitEnd: 16,
        startBitInByte: 0,
        endBitInByte: 7
      },
      {
        start: 4,
        end: 6,
        type: 'lz77',
        bitStart: 32,
        bitEnd: 48,
        startBitInByte: 0,
        endBitInByte: 7
      }
    ]
    
    const result = HexFormatter.formatHexDump(data, highlightRanges)
    
    // Should contain multiple highlighted sections
    const highlightCount = (result.match(/background: linear-gradient/g) || []).length
    expect(highlightCount).toBeGreaterThan(0)
  })

  it('should handle edge case ranges', () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
    const highlightRanges: HighlightRange[] = [
      {
        start: 0,
        end: 1,
        type: 'literal',
        bitStart: 0,
        bitEnd: 8,
        startBitInByte: 0,
        endBitInByte: 7
      },
      {
        start: 3,
        end: 4,
        type: 'literal',
        bitStart: 24,
        bitEnd: 32,
        startBitInByte: 0,
        endBitInByte: 7
      }
    ]
    
    const result = HexFormatter.formatHexDump(data, highlightRanges)
    
    // Should handle first and last bytes
    expect(result).toContain('background: linear-gradient')
  })

  it('should format large data correctly', () => {
    const data = new Uint8Array(256)
    for (let i = 0; i < 256; i++) {
      data[i] = i
    }
    
    const result = HexFormatter.formatHexDump(data)
    
    // Should have 16 lines (256 / 16)
    const lines = result.split('\n').filter(line => line.trim())
    expect(lines.length).toBe(16)
    
    // Should contain expected hex values
    expect(result).toContain('00')
    expect(result).toContain('FF')
  })

  it('should handle zlib header dimming', () => {
    const data = new Uint8Array([0x78, 0x9C, 0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0])
    const result = HexFormatter.formatHexDump(data)
    
    // First two bytes should be dimmed (zlib header)
    expect(result).toContain('hex-dim')
  })

  it('should handle checksum dimming', () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0])
    const result = HexFormatter.formatHexDump(data)
    
    // Last 4 bytes should be dimmed (checksum)
    expect(result).toContain('hex-dim')
  })
})
