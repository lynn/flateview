// Core types for DEFLATE visualization

export interface BitPosition {
  byte: number;
  bit: number;
}

export interface DeflateItem {
  type: 'literal' | 'lz77';
  value?: string;
  charCode?: number;
  length?: number;
  distance?: number;
  text?: string;
  position: BitPosition;
  bitStart: number;
  bitEnd: number;
  blockIndex?: number;
  itemIndex?: number;
}

export interface DeflateBlock {
  type: 'uncompressed' | 'fixed' | 'dynamic';
  size: number;
  position: BitPosition;
  content: string;
  decompressedData?: string;
  items: DeflateItem[];
}

export interface HuffmanTreeEntry {
  symbol: number;
  length: number;
}

export interface HighlightRange {
  start: number;
  end: number;
  type: string;
  bitStart: number;
  bitEnd: number;
  startBitInByte: number;
  endBitInByte: number;
}

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

export interface LengthTableEntry {
  code: number;
  extraBits: number;
  length: number;
}

export interface DistanceTableEntry {
  code: number;
  extraBits: number;
  distance: number;
}