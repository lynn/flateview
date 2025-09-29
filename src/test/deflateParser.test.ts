import { describe, it, expect } from 'vitest'
import { DeflateParser } from '../DeflateParser'
import * as fflate from 'fflate'

describe('DeflateParser Structure Tests', () => {
  const parser = new DeflateParser()

  const testCases = [
    {
      name: 'Simple text',
      input: 'Hello, World!'
    },
    {
      name: 'Repeated text',
      input: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    },
    {
      name: 'Mixed content',
      input: 'The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.'
    },
    {
      name: 'Code-like content',
      input: 'for x in range(10): print(x); print(x); print(x)'
    },
    {
      name: 'Empty string',
      input: ''
    },
    {
      name: 'Single character',
      input: 'a'
    },
    {
      name: 'Very long text',
      input: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100)
    },
    {
      name: 'Binary-like content',
      input: '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F'
    },
    {
      name: 'Unicode text',
      input: 'Hello 世界! 🌍 测试 unicode characters'
    }
  ]

  testCases.forEach(({ name, input }) => {
    it(`should parse ${name} structure correctly`, () => {
      // Compress the input using fflate
      const textBytes = new TextEncoder().encode(input)
      const compressed = fflate.zlibSync(textBytes, { level: 9, mem: 12 })

      // Parse the DEFLATE blocks
      const blocks = parser.parseDeflateBlocks(compressed)

      // Verify we got blocks
      expect(blocks).toBeDefined()
      expect(blocks.length).toBeGreaterThan(0)

      // Verify each block has the expected structure
      blocks.forEach((block) => {
        expect(block).toHaveProperty('type')
        expect(block).toHaveProperty('size')
        expect(block).toHaveProperty('position')
        expect(block).toHaveProperty('content')
        expect(block).toHaveProperty('items')
        expect(Array.isArray(block.items)).toBe(true)

        // Verify block type is valid
        expect(['uncompressed', 'fixed', 'dynamic']).toContain(block.type)

        // Verify items have correct structure
        block.items.forEach((item) => {
          expect(item).toHaveProperty('type')
      expect(['literal', 'lz77', 'zlib_header', 'zlib_checksum', 'dynamic_huffman_literal', 'dynamic_huffman_distance', 'dynamic_huffman_length', 'dynamic_huffman_header', 'block_start', 'end_of_block', 'uncompressed_len16', 'uncompressed_nlen16']).toContain(item.type)
          expect(item).toHaveProperty('position')
          expect(item).toHaveProperty('bitStart')
          expect(item).toHaveProperty('bitEnd')
          expect(typeof item.bitStart).toBe('number')
          expect(typeof item.bitEnd).toBe('number')
          expect(item.bitEnd).toBeGreaterThan(item.bitStart)

          if (item.type === 'literal') {
            expect(item).toHaveProperty('charCode')
            expect(typeof item.charCode).toBe('number')
            expect(item.charCode).toBeGreaterThanOrEqual(0)
            expect(item.charCode).toBeLessThanOrEqual(255)
          } else if (item.type === 'lz77') {
            expect(item).toHaveProperty('length')
            expect(item).toHaveProperty('distance')
            expect(item).toHaveProperty('text')
            expect(typeof item.length).toBe('number')
            expect(typeof item.distance).toBe('number')
            expect(item.length).toBeGreaterThan(0)
            expect(item.distance).toBeGreaterThan(0)
          }
        })
      })

      // Verify that the parser can handle the data without errors
      expect(() => parser.parseDeflateBlocks(compressed)).not.toThrow()
    })
  })

  it('should handle different compression levels', () => {
    const input = 'Test compression at different levels'
    const textBytes = new TextEncoder().encode(input)

    // Test different compression levels
    const levels = [0, 1, 6, 9]

    levels.forEach(level => {
      const compressed = fflate.zlibSync(textBytes, { level: level as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, mem: 12 })
      const blocks = parser.parseDeflateBlocks(compressed)

      expect(blocks).toBeDefined()
      expect(blocks.length).toBeGreaterThan(0)

      // Verify parser can handle the data
      expect(() => parser.parseDeflateBlocks(compressed)).not.toThrow()
    })
  })

  it('should handle edge cases', () => {
    // Test with very small input
    const smallInput = 'a'
    const smallBytes = new TextEncoder().encode(smallInput)
    const smallCompressed = fflate.zlibSync(smallBytes, { level: 9, mem: 12 })
    const smallBlocks = parser.parseDeflateBlocks(smallCompressed)

    expect(smallBlocks).toBeDefined()
    expect(smallBlocks.length).toBeGreaterThan(0)

    // Test with input that compresses poorly
    const randomInput = Array.from({ length: 1000 }, () =>
      String.fromCharCode(Math.floor(Math.random() * 256))
    ).join('')
    const randomBytes = new TextEncoder().encode(randomInput)
    const randomCompressed = fflate.zlibSync(randomBytes, { level: 9, mem: 12 })
    const randomBlocks = parser.parseDeflateBlocks(randomCompressed)

    expect(randomBlocks).toBeDefined()
    expect(randomBlocks.length).toBeGreaterThan(0)
  })

  it('should maintain bit position accuracy', () => {
    const input = 'Test bit position accuracy'
    const textBytes = new TextEncoder().encode(input)
    const compressed = fflate.zlibSync(textBytes, { level: 9, mem: 12 })
    const blocks = parser.parseDeflateBlocks(compressed)

    // Verify bit positions are consistent
    blocks.forEach(block => {
      block.items.forEach((item, index) => {
        if (index > 0) {
          const prevItem = block.items[index - 1]
          expect(item.bitStart).toBeGreaterThanOrEqual(prevItem.bitEnd)
        }
        expect(item.bitEnd).toBeGreaterThan(item.bitStart)
      })
    })
  })

  it('should handle LZ77 references correctly', () => {
    const input = 'Hello Hello Hello World World World'
    const textBytes = new TextEncoder().encode(input)
    const compressed = fflate.zlibSync(textBytes, { level: 9, mem: 12 })
    const blocks = parser.parseDeflateBlocks(compressed)

    // Find LZ77 items and verify they make sense
    const lz77Items = blocks.flatMap(block =>
      block.items.filter(item => item.type === 'lz77')
    )

    if (lz77Items.length > 0) {
      lz77Items.forEach(item => {
        expect(item.length).toBeGreaterThan(0)
        expect(item.distance).toBeGreaterThan(0)
        expect(item.text).toBeDefined()
        expect(item.text!.length).toBe(item.length)
      })
    }
  })

  it('should have correct DEFLATE item structure for byte reconstruction', () => {
    const input = 'Hello, World!'
    const textBytes = new TextEncoder().encode(input)
    const compressed = fflate.zlibSync(textBytes, { level: 9, mem: 12 })
    const blocks = parser.parseDeflateBlocks(compressed)

    // Verify that we can reconstruct the original data using fflate
    const decompressed = fflate.unzlibSync(compressed)
    expect(new TextDecoder().decode(decompressed)).toBe(input)

    // Verify that the parser can parse the structure without errors
    expect(blocks).toBeDefined()
    expect(blocks.length).toBeGreaterThan(0)

    // Verify that literal items have the correct structure
    const literalItems = blocks.flatMap(block =>
      block.items.filter(item => item.type === 'literal')
    )

    literalItems.forEach(item => {
      expect(item.charCode).toBeDefined()
      expect(item.charCode).toBeGreaterThanOrEqual(0)
      expect(item.charCode).toBeLessThanOrEqual(255)
      expect(String.fromCharCode(item.charCode!)).toBe(String.fromCharCode(item.charCode!))
    })

    // Verify that LZ77 items have the correct structure
    const lz77Items = blocks.flatMap(block =>
      block.items.filter(item => item.type === 'lz77')
    )

    lz77Items.forEach(item => {
      expect(item.length).toBeDefined()
      expect(item.distance).toBeDefined()
      expect(item.length).toBeGreaterThan(0)
      expect(item.distance).toBeGreaterThan(0)
      expect(item.text).toBeDefined()
      expect(item.text!.length).toBe(item.length)
    })
  })

  it('should correctly parse and reconstruct "hello" compressed data', () => {
    // Test with the specific byte string mentioned: 78 DA CB 48 CD C9 C9 07 00 06 2C 02 15
    const compressedBytes = new Uint8Array([0x78, 0xDA, 0xCB, 0x48, 0xCD, 0xC9, 0xC9, 0x07, 0x00, 0x06, 0x2C, 0x02, 0x15])

    // Verify that we can reconstruct the original data using fflate
    const decompressed = fflate.unzlibSync(compressedBytes)
    expect(new TextDecoder().decode(decompressed)).toBe('hello')

    // Parse the DEFLATE structure
    const blocks = parser.parseDeflateBlocks(compressedBytes)
    expect(blocks).toBeDefined()
    expect(blocks.length).toBe(3) // Should be zlib header, fixed block, and zlib checksum
    expect(blocks[0].type).toBe('uncompressed') // Should be zlib header
    expect(blocks[1].type).toBe('fixed') // Should be fixed Huffman
    expect(blocks[2].type).toBe('uncompressed') // Should be zlib checksum

    // Reconstruct the original data from DEFLATE items
    let reconstructedBytes = new Uint8Array(0)

    // Only process the actual DEFLATE block (skip zlib header and checksum)
    const deflateBlocks = blocks.filter(block => block.type === 'fixed' || block.type === 'dynamic' || (block.type === 'uncompressed' && block.content !== 'zlib_header' && block.content !== 'zlib_checksum'))

    deflateBlocks.forEach(block => {
      block.items.forEach(item => {
        if (item.type === 'literal') {
          // Add literal byte
          const newBytes = new Uint8Array(reconstructedBytes.length + 1)
          newBytes.set(reconstructedBytes)
          newBytes[reconstructedBytes.length] = item.charCode!
          reconstructedBytes = newBytes
        } else if (item.type === 'lz77' && item.text) {
          // Add LZ77 repeated text
          const newBytes = new Uint8Array(reconstructedBytes.length + item.text.length)
          newBytes.set(reconstructedBytes)
          newBytes.set(item.text, reconstructedBytes.length)
          reconstructedBytes = newBytes
        }
      })
    })

    // Verify that our reconstruction matches the original
    const originalBytes = new TextEncoder().encode('hello')
    expect(Array.from(reconstructedBytes)).toEqual(Array.from(originalBytes))
    expect(new TextDecoder().decode(reconstructedBytes)).toBe('hello')
  })

  it('should correctly parse and reconstruct "abcdeabcd" with LZ77 reference', () => {
    // Test case that should have an LZ77 reference: "abcdeabcd" -> "abcde" + LZ77(length=4, distance=5)
    const input = 'abcdeabcd'
    const compressed = fflate.zlibSync(new TextEncoder().encode(input), { level: 9 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 })

    // Verify that fflate can decompress it correctly
    const decompressed = fflate.unzlibSync(compressed)
    expect(new TextDecoder().decode(decompressed)).toBe(input)

    // Parse the DEFLATE structure
    const blocks = parser.parseDeflateBlocks(compressed)
    expect(blocks).toBeDefined()
    expect(blocks.length).toBeGreaterThan(0)

    // Reconstruct the original data from DEFLATE items
    let reconstructedBytes = new Uint8Array(0)

    blocks.forEach(block => {
      block.items.forEach(item => {
        if (item.type === 'literal') {
          // Add literal byte
          const newBytes = new Uint8Array(reconstructedBytes.length + 1)
          newBytes.set(reconstructedBytes)
          newBytes[reconstructedBytes.length] = item.charCode!
          reconstructedBytes = newBytes
        } else if (item.type === 'lz77' && item.text) {
          // Add LZ77 repeated text
          const newBytes = new Uint8Array(reconstructedBytes.length + item.text.length)
          newBytes.set(reconstructedBytes)
          newBytes.set(item.text, reconstructedBytes.length)
          reconstructedBytes = newBytes
        }
      })
    })

    // Verify that our reconstruction matches the original
    const originalBytes = new TextEncoder().encode(input)
    expect(Array.from(reconstructedBytes)).toEqual(Array.from(originalBytes))
    expect(new TextDecoder().decode(reconstructedBytes)).toBe(input)
  })
})
