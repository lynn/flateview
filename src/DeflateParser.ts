import { BitReader } from "./BitReader";
import type {
  DeflateBlock,
  DeflateItem,
  LiteralItem,
  LZ77Item,
  ZlibHeaderItem,
  ZlibChecksumItem,
  DynamicHuffmanLiteralItem,
  DynamicHuffmanDistanceItem,
  DynamicHuffmanLengthItem,
  EndOfBlockItem,
  HuffmanTreeEntry,
  LengthTableEntry,
  DistanceTableEntry,
  DynamicHuffmanHeaderItem,
} from "./types";

export class DeflateParser {
  private static readonly LENGTH_TABLE: LengthTableEntry[] = [
    { code: 257, extraBits: 0, length: 3 },
    { code: 258, extraBits: 0, length: 4 },
    { code: 259, extraBits: 0, length: 5 },
    { code: 260, extraBits: 0, length: 6 },
    { code: 261, extraBits: 0, length: 7 },
    { code: 262, extraBits: 0, length: 8 },
    { code: 263, extraBits: 0, length: 9 },
    { code: 264, extraBits: 0, length: 10 },
    { code: 265, extraBits: 1, length: 11 },
    { code: 266, extraBits: 1, length: 13 },
    { code: 267, extraBits: 1, length: 15 },
    { code: 268, extraBits: 1, length: 17 },
    { code: 269, extraBits: 2, length: 19 },
    { code: 270, extraBits: 2, length: 23 },
    { code: 271, extraBits: 2, length: 27 },
    { code: 272, extraBits: 2, length: 31 },
    { code: 273, extraBits: 3, length: 35 },
    { code: 274, extraBits: 3, length: 43 },
    { code: 275, extraBits: 3, length: 51 },
    { code: 276, extraBits: 3, length: 59 },
    { code: 277, extraBits: 4, length: 67 },
    { code: 278, extraBits: 4, length: 83 },
    { code: 279, extraBits: 4, length: 99 },
    { code: 280, extraBits: 4, length: 115 },
    { code: 281, extraBits: 5, length: 131 },
    { code: 282, extraBits: 5, length: 163 },
    { code: 283, extraBits: 5, length: 195 },
    { code: 284, extraBits: 5, length: 227 },
    { code: 285, extraBits: 0, length: 258 },
  ];

  private static readonly DISTANCE_TABLE: DistanceTableEntry[] = [
    { code: 0, extraBits: 0, distance: 1 },
    { code: 1, extraBits: 0, distance: 2 },
    { code: 2, extraBits: 0, distance: 3 },
    { code: 3, extraBits: 0, distance: 4 },
    { code: 4, extraBits: 1, distance: 5 },
    { code: 5, extraBits: 1, distance: 7 },
    { code: 6, extraBits: 2, distance: 9 },
    { code: 7, extraBits: 2, distance: 13 },
    { code: 8, extraBits: 3, distance: 17 },
    { code: 9, extraBits: 3, distance: 25 },
    { code: 10, extraBits: 4, distance: 33 },
    { code: 11, extraBits: 4, distance: 49 },
    { code: 12, extraBits: 5, distance: 65 },
    { code: 13, extraBits: 5, distance: 97 },
    { code: 14, extraBits: 6, distance: 129 },
    { code: 15, extraBits: 6, distance: 193 },
    { code: 16, extraBits: 7, distance: 257 },
    { code: 17, extraBits: 7, distance: 385 },
    { code: 18, extraBits: 8, distance: 513 },
    { code: 19, extraBits: 8, distance: 769 },
    { code: 20, extraBits: 9, distance: 1025 },
    { code: 21, extraBits: 9, distance: 1537 },
    { code: 22, extraBits: 10, distance: 2049 },
    { code: 23, extraBits: 10, distance: 3073 },
    { code: 24, extraBits: 11, distance: 4097 },
    { code: 25, extraBits: 11, distance: 6145 },
    { code: 26, extraBits: 12, distance: 8193 },
    { code: 27, extraBits: 12, distance: 12289 },
    { code: 28, extraBits: 13, distance: 16385 },
    { code: 29, extraBits: 13, distance: 24577 },
  ];

  private static readonly CODE_LENGTH_ORDER = [
    16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15,
  ];

  parseDeflateBlocks(zlibData: Uint8Array): DeflateBlock[] {
    const blocks: DeflateBlock[] = [];
    const reader = new BitReader(zlibData);

    // Parse zlib header
    const zlibHeader = this.parseZlibHeader(reader);
    if (zlibHeader) {
      // Add zlib header as a special block
      blocks.push({
        type: "uncompressed",
        size: 2,
        position: { byte: 0, bit: 0 },
        content: "zlib_header",
        items: [zlibHeader],
      });
    }

    while (true) {
      const bfinal = reader.readBits(1);
      const btype = reader.readBits(2);

      let block: DeflateBlock;

      if (btype === 0) {
        // Uncompressed block
        block = this.parseUncompressedBlock(reader);
      } else if (btype === 1) {
        // Fixed Huffman block
        block = this.parseFixedHuffmanBlock(reader);
      } else if (btype === 2) {
        // Dynamic Huffman block
        block = this.parseDynamicHuffmanBlock(reader);
      } else {
        throw new Error(`Invalid block type: ${btype}`);
      }

      blocks.push(block);

      if (bfinal) {
        break;
      }
    }

    // Parse zlib checksum at the end
    const checksum = this.parseZlibChecksum(reader);
    if (checksum) {
      blocks.push({
        type: "uncompressed",
        size: 4,
        position: {
          byte: Math.floor(checksum.bitStart / 8),
          bit: checksum.bitStart % 8,
        },
        content: "zlib_checksum",
        items: [checksum],
      });
    }

    return blocks;
  }

  private parseUncompressedBlock(reader: BitReader): DeflateBlock {
    const startPos = reader.getPosition();
    reader.alignToByte();

    const len = reader.readByte() | (reader.readByte() << 8);
    const nlen = reader.readByte() | (reader.readByte() << 8);

    if ((len ^ nlen) !== 0xffff) {
      throw new Error("Invalid uncompressed block: LEN != ~NLEN");
    }

    const dataStartPos = reader.getPosition();
    const data = reader.readBytes(len);

    let content = `Uncompressed block (${len} bytes)\n`;
    const items: DeflateItem[] = [];

    for (let i = 0; i < data.length; i++) {
      const char = String.fromCharCode(data[i]);
      const bitStart = (dataStartPos.byte + i) * 8 + dataStartPos.bit;
      const bitEnd = bitStart + 8;

      items.push({
        type: "literal",
        value: char,
        charCode: data[i],
        position: reader.getPosition(),
        bitStart,
        bitEnd,
      });

      content += `Literal: ${data[i]} ('${char}')\n`;
    }

    return {
      type: "uncompressed",
      size: len,
      position: startPos,
      content,
      decompressedData: new TextDecoder().decode(data),
      items,
    };
  }

  private parseFixedHuffmanBlock(reader: BitReader): DeflateBlock {
    const startPos = reader.getPosition();
    let content = "Fixed Huffman codes:\n";
    const items: DeflateItem[] = [];
    let decompressedData = new Uint8Array(0);

    try {
      const fixedLiteralLengthCodes = this.buildFixedLiteralLengthCodes();
      const fixedDistanceCodes = this.buildFixedDistanceCodes();

      let literalCount = 0;
      let lengthCount = 0;
      let distanceCount = 0;

      while (true) {
        let code = 0;
        let bits = 0;
        const codeStartPos = reader.getPosition();

        while (bits < 15) {
          const bit = reader.readBits(1);
          code = (code << 1) | bit; // Build code MSB-first (as per RFC 3.1.1)
          bits++;

          if (
            fixedLiteralLengthCodes[code] &&
            fixedLiteralLengthCodes[code].length === bits
          ) {
            break;
          }
        }

        const symbol = fixedLiteralLengthCodes[code]?.symbol;

        if (symbol < 256) {
          // Literal byte
          const char = String.fromCharCode(symbol);
          const newData = new Uint8Array(decompressedData.length + 1);
          newData.set(decompressedData);
          newData[decompressedData.length] = symbol;
          decompressedData = newData;
          literalCount++;
          content += `Literal: ${symbol} ('${char}')\n`;

          const currentPos = reader.getPosition();
          const bitStart = codeStartPos.byte * 8 + codeStartPos.bit;
          const bitEnd = currentPos.byte * 8 + currentPos.bit;

          items.push({
            type: "literal",
            value: char,
            charCode: symbol,
            position: currentPos,
            bitStart,
            bitEnd,
          } as LiteralItem);
        } else if (symbol === 256) {
          // End of block
          content += "End of block\n";

          const currentPos = reader.getPosition();
          const bitStart = codeStartPos.byte * 8 + codeStartPos.bit;
          const bitEnd = currentPos.byte * 8 + currentPos.bit;

          items.push({
            type: "end_of_block",
            position: currentPos,
            bitStart,
            bitEnd,
          } as EndOfBlockItem);

          break;
        } else if (symbol >= 257 && symbol <= 285) {
          // Length code
          const length = this.getLengthFromCode(symbol, reader);
          const distanceResult = this.readDistanceCodeFixed(
            reader,
            fixedDistanceCodes
          );
          const distance = this.getDistanceFromCode(
            distanceResult.symbol,
            reader
          );

          const currentPos = reader.getPosition();
          const bitStart = codeStartPos.byte * 8 + codeStartPos.bit;

          const repeatedText = this.generateLZ77Text(
            length,
            distance,
            decompressedData
          );
          const newData = new Uint8Array(
            decompressedData.length + repeatedText.length
          );
          newData.set(decompressedData);
          newData.set(repeatedText, decompressedData.length);
          decompressedData = newData;
          lengthCount++;
          distanceCount++;
          content += `LZ77: length=${length}, distance=${distance} -> "${new TextDecoder().decode(
            repeatedText
          )}"\n`;

          items.push({
            type: "lz77",
            length,
            distance,
            text: repeatedText,
            position: currentPos,
            bitStart,
            bitEnd: distanceResult.bitEnd,
          } as LZ77Item);
        }
      }

      content += `\nSummary: ${literalCount} literals, ${lengthCount} length codes, ${distanceCount} distance codes`;
    } catch (error) {
      content += `Parse error: ${
        error instanceof Error ? error.message : "Unknown error"
      }\n`;
    }

    const endPos = reader.getPosition();
    return {
      type: "fixed",
      size: endPos.byte - startPos.byte,
      position: startPos,
      content,
      decompressedData: new TextDecoder().decode(decompressedData),
      items,
    };
  }

  private parseDynamicHuffmanBlock(reader: BitReader): DeflateBlock {
    const startPos = reader.getPosition();
    let content = "Dynamic Huffman codes:\n";
    const items: DeflateItem[] = [];
    let decompressedData = new Uint8Array(0);

    try {
      // Read header
      const hlit = reader.readBits(5) + 257; // 257-286
      const hdist = reader.readBits(5) + 1; // 1-32
      const hclen = reader.readBits(4) + 4; // 4-19

      content += `HLIT: ${hlit} (literal/length codes)\n`;
      content += `HDIST: ${hdist} (distance codes)\n`;
      content += `HCLEN: ${hclen} (code length codes)\n\n`;

      items.push({
        type: "dynamic_huffman_header",
        position: reader.getPosition(),
        bitStart: reader.getBitPosition() - 14,
        bitEnd: reader.getBitPosition(),
        hlit,
        hdist,
        hclen,
      } satisfies DynamicHuffmanHeaderItem);

      // Read code length codes
      const codeLengths = new Array(19).fill(0);

      for (let i = 0; i < hclen; i++) {
        const startBit = reader.getBitPosition();
        const codeLength = reader.readBits(3);
        const endBit = reader.getBitPosition();

        codeLengths[DeflateParser.CODE_LENGTH_ORDER[i]] = codeLength;

        // Create item for code length
        items.push({
          type: "dynamic_huffman_length",
          position: { byte: Math.floor(startBit / 8), bit: startBit % 8 },
          bitStart: startBit,
          bitEnd: endBit,
          text: `${DeflateParser.CODE_LENGTH_ORDER[i]}→${codeLength}`,
        } as DynamicHuffmanLengthItem);
      }

      content +=
        "Code length codes: " + codeLengths.slice(0, hclen).join(", ") + "\n";

      // Build Huffman tree for code lengths
      const codeLengthTree = this.buildHuffmanTree(codeLengths, 18);
      content += `\nCode length tree built\n`;

      // Decode literal/length and distance code lengths
      const allCodeLengths: number[] = [];
      const totalCodes = hlit + hdist;

      while (allCodeLengths.length < totalCodes) {
        const before = reader.getBitPosition();
        const symbolResult = this.decodeSymbol(reader, codeLengthTree);
        const symbol = symbolResult.symbol;
        let text = "";

        if (symbol < 16) {
          // Direct code length
          allCodeLengths.push(symbol);
          text = `${symbol}`;
        } else if (symbol === 16) {
          // Copy previous code length 3-6 times
          const repeat = reader.readBits(2) + 3;
          const lastLength = allCodeLengths[allCodeLengths.length - 1];
          for (let i = 0; i < repeat; i++) {
            allCodeLengths.push(lastLength);
          }
          text = `←×${repeat}`;
        } else if (symbol === 17) {
          // Repeat code length 0 for 3-10 times
          const repeat = reader.readBits(3) + 3;
          for (let i = 0; i < repeat; i++) {
            allCodeLengths.push(0);
          }
          text = `0×${repeat}`;
        } else if (symbol === 18) {
          // Repeat code length 0 for 11-138 times
          const repeat = reader.readBits(7) + 11;
          for (let i = 0; i < repeat; i++) {
            allCodeLengths.push(0);
          }
          text = `0×${repeat}`;
        }
        const after = reader.getBitPosition();
        items.push({
          type: "dynamic_huffman_length",
          position: { byte: Math.floor(before / 8), bit: before % 8 },
          bitStart: before,
          bitEnd: after,
          text,
        } satisfies DynamicHuffmanLengthItem);
      }

      // Split into literal/length and distance code lengths
      const literalLengths = allCodeLengths.slice(0, hlit);
      const distanceLengths = allCodeLengths.slice(hlit, hlit + hdist);

      if (literalLengths.length === 0 || distanceLengths.length === 0) {
        throw new Error(
          `Failed to decode code lengths: got ${allCodeLengths.length}/${totalCodes} codes`
        );
      }

      content += `Literal/length code lengths: ${literalLengths
        .slice(0, 20)
        .join(", ")}${literalLengths.length > 20 ? "..." : ""}\n`;
      content += `Distance code lengths: ${distanceLengths.join(", ")}\n\n`;

      // Build Huffman trees
      const literalLengthTree = this.buildHuffmanTree(literalLengths, hlit - 1);
      const distanceTree = this.buildHuffmanTree(distanceLengths, hdist - 1);

      content += `Huffman trees built\n\n`;

      // Decode the actual compressed data
      let literalCount = 0;
      let lengthCount = 0;
      let distanceCount = 0;

      while (true) {
        const symbolResult = this.decodeSymbol(reader, literalLengthTree);
        const symbol = symbolResult.symbol;

        if (symbol < 256) {
          // Literal byte
          const char = String.fromCharCode(symbol);
          const newData = new Uint8Array(decompressedData.length + 1);
          newData.set(decompressedData);
          newData[decompressedData.length] = symbol;
          decompressedData = newData;
          literalCount++;
          content += `Literal: ${symbol} ('${char}')\n`;

          // Create dynamic Huffman literal item
          const codeLength = literalLengthTree[symbol]?.length || 0;
          items.push({
            type: "dynamic_huffman_literal",
            symbol: symbol,
            codeLength: codeLength,
            position: reader.getPosition(),
            bitStart: symbolResult.bitStart,
            bitEnd: symbolResult.bitEnd,
          } as DynamicHuffmanLiteralItem);
        } else if (symbol === 256) {
          // End of block
          content += "End of block\n";
          items.push({
            type: "end_of_block",
            position: reader.getPosition(),
            bitStart: symbolResult.bitStart,
            bitEnd: symbolResult.bitEnd,
          } satisfies EndOfBlockItem);
          break;
        } else if (symbol >= 257 && symbol <= 285) {
          // Length code
          const length = this.getLengthFromCode(symbol, reader);
          const distanceResult = this.decodeSymbol(reader, distanceTree);
          const distance = this.getDistanceFromCode(
            distanceResult.symbol,
            reader
          );

          const currentPos = reader.getPosition();

          // Generate the repeated text for LZ77 reference
          const repeatedText = this.generateLZ77Text(
            length,
            distance,
            decompressedData
          );
          const newData = new Uint8Array(
            decompressedData.length + repeatedText.length
          );
          newData.set(decompressedData);
          newData.set(repeatedText, decompressedData.length);
          decompressedData = newData;
          lengthCount++;
          distanceCount++;
          content += `LZ77: length=${length}, distance=${distance} -> "${new TextDecoder().decode(
            repeatedText
          )}"\n`;

          // Create dynamic Huffman distance item
          const distanceCodeLength =
            distanceTree[distanceResult.symbol]?.length || 0;
          items.push({
            type: "dynamic_huffman_distance",
            symbol: distanceResult.symbol,
            text: repeatedText,
            codeLength: distanceCodeLength,
            position: currentPos,
            bitStart: symbolResult.bitStart,
            bitEnd: distanceResult.bitEnd,
          } as DynamicHuffmanDistanceItem);
        }
      }

      content += `\nSummary: ${literalCount} literals, ${lengthCount} length codes, ${distanceCount} distance codes`;
    } catch (error) {
      content += `Parse error: ${
        error instanceof Error ? error.message : "Unknown error"
      }\n`;
    }

    const endPos = reader.getPosition();
    return {
      type: "dynamic",
      size: endPos.byte - startPos.byte,
      position: startPos,
      content,
      decompressedData: new TextDecoder().decode(decompressedData),
      items,
    };
  }

  private buildHuffmanTree(
    codeLengths: number[],
    maxSymbol: number
  ): Record<number, HuffmanTreeEntry> {
    if (codeLengths.length === 0) {
      throw new Error(
        "Cannot build Huffman tree from empty code lengths array"
      );
    }

    // Count codes of each length
    const blCount = new Array(16).fill(0);
    for (let i = 0; i <= maxSymbol; i++) {
      if (codeLengths[i] > 0) {
        blCount[codeLengths[i]]++;
      }
    }

    // Find minimum code for each length
    const nextCode = new Array(16).fill(0);
    let code = 0;
    blCount[0] = 0;

    for (let bits = 1; bits <= 15; bits++) {
      code = (code + blCount[bits - 1]) << 1;
      nextCode[bits] = code;
    }

    // Assign codes
    const tree: Record<number, HuffmanTreeEntry> = {};
    for (let i = 0; i <= maxSymbol; i++) {
      const len = codeLengths[i];
      if (len !== 0) {
        const codeValue = nextCode[len];
        if (isNaN(codeValue) || codeValue === undefined) {
          throw new Error(
            `Invalid code value for length ${len}, nextCode[${len}] = ${nextCode[len]}`
          );
        }
        tree[codeValue] = { symbol: i, length: len };
        nextCode[len]++;
      }
    }

    return tree;
  }

  private decodeSymbol(
    reader: BitReader,
    tree: Record<number, HuffmanTreeEntry>
  ): { symbol: number; bitStart: number; bitEnd: number } {
    let code = 0;
    let bits = 0;
    const startPos = reader.getPosition();

    // Read bits until we find a valid code
    while (bits < 15) {
      const bit = reader.readBits(1);
      code = (code << 1) | bit; // Build code MSB-first (as per RFC 3.1.1)
      bits++;

      if (tree[code] && tree[code].length === bits) {
        return {
          symbol: tree[code].symbol,
          bitStart: startPos.byte * 8 + startPos.bit,
          bitEnd: reader.getPosition().byte * 8 + reader.getPosition().bit,
        };
      }
    }

    throw new Error(
      `Invalid Huffman code: ${code} at position ${reader.getPosition().byte}.${
        reader.getPosition().bit
      }`
    );
  }

  private buildFixedLiteralLengthCodes(): Record<number, HuffmanTreeEntry> {
    const codes: Record<number, HuffmanTreeEntry> = {};

    // Literals 0-143: 8 bits, codes 00110000-10111111 (MSB-first)
    // 00110000 = 0x30, 10111111 = 0xBF
    for (let i = 0; i < 144; i++) {
      codes[0x30 + i] = { symbol: i, length: 8 };
    }

    // Literals 144-255: 9 bits, codes 110010000-111111111 (MSB-first)
    // 110010000 = 0x190, 111111111 = 0x1FF
    for (let i = 144; i < 256; i++) {
      codes[0x190 + i - 144] = { symbol: i, length: 9 };
    }

    // Length codes 257-279: 7 bits, codes 0000001-0010111 (MSB-first)
    // 0000001 = 1, 0010111 = 23
    for (let i = 257; i < 280; i++) {
      codes[i - 256] = { symbol: i, length: 7 };
    }

    // End of block: 7 bits, code 0000000 (MSB-first)
    codes[0] = { symbol: 256, length: 7 };

    // Length codes 280-285: 8 bits, codes 11000000-11000101 (MSB-first)
    // 11000000 = 0xC0, 11000101 = 0xC5
    for (let i = 280; i < 286; i++) {
      codes[0xc0 + i - 280] = { symbol: i, length: 8 };
    }

    return codes;
  }

  private buildFixedDistanceCodes(): Record<number, HuffmanTreeEntry> {
    const codes: Record<number, HuffmanTreeEntry> = {};

    // Distance codes 0-31: 5 bits, codes 00000-11111 (MSB-first)
    for (let i = 0; i < 32; i++) {
      codes[i] = { symbol: i, length: 5 };
    }

    return codes;
  }

  private readDistanceCodeFixed(
    reader: BitReader,
    fixedDistanceCodes: Record<number, HuffmanTreeEntry>
  ): { symbol: number; bitStart: number; bitEnd: number } {
    let code = 0;
    let bits = 0;
    const startPos = reader.getPosition();

    while (bits < 5) {
      const bit = reader.readBits(1);
      code = (code << 1) | bit; // Build code MSB-first (as per RFC 3.1.1)
      bits++;

      if (
        fixedDistanceCodes[code] &&
        fixedDistanceCodes[code].length === bits
      ) {
        return {
          symbol: fixedDistanceCodes[code].symbol,
          bitStart: startPos.byte * 8 + startPos.bit,
          bitEnd: reader.getPosition().byte * 8 + reader.getPosition().bit,
        };
      }
    }

    throw new Error("Invalid distance code");
  }

  private getLengthFromCode(code: number, reader: BitReader): number {
    const entry = DeflateParser.LENGTH_TABLE[code - 257];
    if (entry.extraBits > 0) {
      const extraBits = reader.readBits(entry.extraBits);
      return entry.length + extraBits;
    }
    return entry.length;
  }

  private getDistanceFromCode(code: number, reader: BitReader): number {
    const entry = DeflateParser.DISTANCE_TABLE[code];
    if (entry.extraBits > 0) {
      const extraBits = reader.readBits(entry.extraBits);
      return entry.distance + extraBits;
    }
    return entry.distance;
  }

  private generateLZ77Text(
    length: number,
    distance: number,
    currentData: Uint8Array
  ): Uint8Array {
    const result = new Uint8Array(length);
    const startPos = currentData.length - distance;

    for (let i = 0; i < length; i++) {
      const sourceIndex = startPos + i;
      if (sourceIndex >= 0 && sourceIndex < currentData.length) {
        result[i] = currentData[sourceIndex];
      } else {
        // If we go beyond available data, repeat from the beginning of the reference
        const repeatIndex = startPos + (i % distance);
        if (repeatIndex >= 0 && repeatIndex < currentData.length) {
          result[i] = currentData[repeatIndex];
        }
      }
    }

    return result;
  }

  private parseZlibHeader(reader: BitReader): DeflateItem | null {
    const startBit = reader.getBitPosition();

    // Read zlib header (2 bytes)
    const cmf = reader.readByte();
    const flg = reader.readByte();

    // Parse CMF (Compression Method and Info)
    const compressionMethod = cmf & 0x0f;
    const compressionInfo = (cmf >> 4) & 0x0f;

    // Parse FLG (FLaGs)
    const fcheck = flg & 0x1f;
    const fdict = (flg >> 5) & 0x01;
    const flevel = (flg >> 6) & 0x03;

    const endBit = reader.getBitPosition();

    return {
      type: "zlib_header",
      position: { byte: Math.floor(startBit / 8), bit: startBit % 8 },
      bitStart: startBit,
      bitEnd: endBit,
      compressionMethod,
      compressionInfo,
      fcheck,
      fdict,
      flevel,
    } satisfies ZlibHeaderItem;
  }

  private parseZlibChecksum(reader: BitReader): DeflateItem | null {
    const startBit = reader.getBitPosition();

    // Read Adler-32 checksum (4 bytes)
    const checksum =
      reader.readByte() +
      reader.readByte() * 2 ** 8 +
      reader.readByte() * 2 ** 16 +
      reader.readByte() * 2 ** 24;

    const endBit = reader.getBitPosition();

    return {
      type: "zlib_checksum",
      position: { byte: Math.floor(startBit / 8), bit: startBit % 8 },
      bitStart: startBit,
      bitEnd: endBit,
      checksum,
    } satisfies ZlibChecksumItem;
  }
}
