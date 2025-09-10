// Core types for DEFLATE visualization

export interface BitPosition {
  byte: number;
  bit: number;
}

// Base interface for common properties
interface BaseDeflateItem {
  position: BitPosition;
  bitStart: number;
  bitEnd: number;
  blockIndex?: number;
  itemIndex?: number;
}

// Block start item
export interface BlockStartItem extends BaseDeflateItem {
  type: 'block_start';
  flavor: string;
}

// Literal item
export interface LiteralItem extends BaseDeflateItem {
  type: 'literal';
  symbol: number;
  charCode: number;
}

// LZ77 reference item
export interface LZ77Item extends BaseDeflateItem {
  type: 'lz77';
  length: number;
  distance: number;
  text: Uint8Array;
}

// Zlib header item
export interface ZlibHeaderItem extends BaseDeflateItem {
  type: 'zlib_header';
  compressionMethod: number;
  compressionInfo: number;
  fcheck: number;
  fdict: number;
  flevel: number;
}

// Zlib checksum item
export interface ZlibChecksumItem extends BaseDeflateItem {
  type: 'zlib_checksum';
  checksum: number;
}

// Dynamic Huffman header item
export interface DynamicHuffmanHeaderItem extends BaseDeflateItem {
  type: 'dynamic_huffman_header';
  hlit: number;
  hdist: number;
  hclen: number;
}

// Dynamic Huffman literal item
export interface DynamicHuffmanLiteralItem extends BaseDeflateItem {
  type: 'dynamic_huffman_literal';
  symbol: number;
  codeLength: number;
}

// Dynamic Huffman distance item
export interface DynamicHuffmanDistanceItem extends BaseDeflateItem {
  type: 'dynamic_huffman_distance';
  symbol: number;
  codeLength: number;
  text: Uint8Array;
  length: number;
  distance: number;
  numLengthBits: number;
}

// Dynamic Huffman length item
export interface DynamicHuffmanLengthItem extends BaseDeflateItem {
  type: 'dynamic_huffman_length';
  text: string;
}

// End of block item
export interface EndOfBlockItem extends BaseDeflateItem {
  type: 'end_of_block';
}

// Union type for all DeflateItem types
export type DeflateItem = 
  | BlockStartItem
  | LiteralItem
  | LZ77Item
  | ZlibHeaderItem
  | ZlibChecksumItem
  | DynamicHuffmanHeaderItem
  | DynamicHuffmanLiteralItem
  | DynamicHuffmanDistanceItem
  | DynamicHuffmanLengthItem
  | EndOfBlockItem;

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