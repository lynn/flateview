import { describe, it, expect } from 'vitest'
import { BitReader } from '../BitReader'

describe('BitReader', () => {
  it('should read bits correctly', () => {
    // Test data: [0xAA, 0x55] = 10101010 01010101
    const data = new Uint8Array([0xAA, 0x55])
    const reader = new BitReader(data)
    
    // Read first 8 bits: 10101010
    expect(reader.readBits(8)).toBe(0xAA)
    
    // Read next 8 bits: 01010101
    expect(reader.readBits(8)).toBe(0x55)
  })

  it('should read individual bits correctly', () => {
    // Test data: [0xAA] = 10101010
    const data = new Uint8Array([0xAA])
    const reader = new BitReader(data)
    
    // Read bits one by one
    expect(reader.readBits(1)).toBe(0) // 1
    expect(reader.readBits(1)).toBe(1) // 0
    expect(reader.readBits(1)).toBe(0) // 1
    expect(reader.readBits(1)).toBe(1) // 0
    expect(reader.readBits(1)).toBe(0) // 1
    expect(reader.readBits(1)).toBe(1) // 0
    expect(reader.readBits(1)).toBe(0) // 1
    expect(reader.readBits(1)).toBe(1) // 0
  })

  it('should read bytes correctly', () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
    const reader = new BitReader(data)
    
    expect(reader.readByte()).toBe(0x12)
    expect(reader.readByte()).toBe(0x34)
    expect(reader.readByte()).toBe(0x56)
    expect(reader.readByte()).toBe(0x78)
  })

  it('should read multiple bytes correctly', () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
    const reader = new BitReader(data)
    
    const bytes = reader.readBytes(2)
    expect(bytes).toEqual(new Uint8Array([0x12, 0x34]))
    
    const moreBytes = reader.readBytes(2)
    expect(moreBytes).toEqual(new Uint8Array([0x56, 0x78]))
  })

  it('should track position correctly', () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
    const reader = new BitReader(data)
    
    // Initial position
    expect(reader.getPosition()).toEqual({ byte: 0, bit: 0 })
    
    // After reading 4 bits
    reader.readBits(4)
    expect(reader.getPosition()).toEqual({ byte: 0, bit: 4 })
    
    // After reading 4 more bits (completing a byte)
    reader.readBits(4)
    expect(reader.getPosition()).toEqual({ byte: 1, bit: 0 })
    
    // After reading a byte
    reader.readByte()
    expect(reader.getPosition()).toEqual({ byte: 2, bit: 0 })
  })

  it('should align to byte boundary correctly', () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
    const reader = new BitReader(data)
    
    // Read some bits
    reader.readBits(3)
    expect(reader.getPosition()).toEqual({ byte: 0, bit: 3 })
    
    // Align to byte
    reader.alignToByte()
    expect(reader.getPosition()).toEqual({ byte: 1, bit: 0 })
  })

  it('should handle mixed bit and byte reads', () => {
    const data = new Uint8Array([0x12, 0x34, 0x56, 0x78])
    const reader = new BitReader(data)
    
    // Read 4 bits
    expect(reader.readBits(4)).toBe(0x2) // Lower 4 bits of 0x12
    
    // Read a byte (should align automatically)
    expect(reader.readByte()).toBe(0x34)
    
    // Read 8 bits
    expect(reader.readBits(8)).toBe(0x56)
    
    // Read remaining bits
    expect(reader.readBits(8)).toBe(0x78)
  })

  it('should throw error on unexpected end of data', () => {
    const data = new Uint8Array([0x12])
    const reader = new BitReader(data)
    
    // Read all available bits
    reader.readBits(8)
    
    // Try to read more bits - should throw
    expect(() => reader.readBits(1)).toThrow('Unexpected end of data')
  })

  it('should handle edge cases', () => {
    // Empty data
    const emptyData = new Uint8Array([])
    const emptyReader = new BitReader(emptyData)
    expect(() => emptyReader.readBits(1)).toThrow('Unexpected end of data')
    
    // Single byte
    const singleByte = new Uint8Array([0xFF])
    const singleReader = new BitReader(singleByte)
    expect(singleReader.readBits(8)).toBe(0xFF)
    expect(() => singleReader.readBits(1)).toThrow('Unexpected end of data')
  })

  it('should read complex bit patterns correctly', () => {
    // Test with a more complex pattern
    const data = new Uint8Array([0b10110100, 0b11001010, 0b11110000])
    const reader = new BitReader(data)
    
    // Read 3 bits: 001 (LSB first, but result is 4 because of bit shifting)
    expect(reader.readBits(3)).toBe(4)
    
    // Read 5 bits: 10110 (LSB first from remaining bits)
    expect(reader.readBits(5)).toBe(22)
    
    // Read 8 bits: 11001010 (LSB first)
    expect(reader.readBits(8)).toBe(202)
    
    // Read 4 bits: 0000 (LSB first)
    expect(reader.readBits(4)).toBe(0)
    
    // Read 4 bits: 1111 (LSB first)
    expect(reader.readBits(4)).toBe(15)
  })
})
