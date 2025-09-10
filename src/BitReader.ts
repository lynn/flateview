import type { BitPosition } from './types';

export class BitReader {
  private data: Uint8Array;
  private byteIndex: number = 0;
  private bitIndex: number = 0;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  readBits(count: number): number {
    let result = 0;
    for (let i = 0; i < count; i++) {
      if (this.byteIndex >= this.data.length) {
        throw new Error('Unexpected end of data');
      }
      
      const bit = (this.data[this.byteIndex] >> this.bitIndex) & 1;
      result |= bit << i;
      
      this.bitIndex++;
      if (this.bitIndex === 8) {
        this.bitIndex = 0;
        this.byteIndex++;
      }
    }
    return result;
  }

  readByte(): number {
    if (this.bitIndex !== 0) {
      this.bitIndex = 0;
      this.byteIndex++;
    }
    if (this.byteIndex >= this.data.length) {
      throw new Error('Unexpected end of data');
    }
    return this.data[this.byteIndex++];
  }

  readBytes(count: number): Uint8Array {
    if (this.bitIndex !== 0) {
      this.bitIndex = 0;
      this.byteIndex++;
    }
    const result = this.data.slice(this.byteIndex, this.byteIndex + count);
    this.byteIndex += count;
    return result;
  }

  alignToByte(): void {
    if (this.bitIndex !== 0) {
      this.bitIndex = 0;
      this.byteIndex++;
    }
  }

  getPosition(): BitPosition {
    return { byte: this.byteIndex, bit: this.bitIndex };
  }

  getBitPosition(): number {
    return this.byteIndex * 8 + this.bitIndex;
  }
}
