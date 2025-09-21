import { useState, useCallback, useMemo } from "react";
import { DeflateParser } from "../DeflateParser";
import { HexFormatter } from "../HexFormatter";
import type {
  DeflateBlock,
  DeflateItem,
  HighlightRange,
  CompressionStats,
} from "../types";
import * as fflate from "fflate";

export const useCompression = () => {
  const [inputText, setInputText] = useState(`compression and decompression.`);
  const [deflateBlocks, setDeflateBlocks] = useState<DeflateBlock[]>([]);
  const [deflateItems, setDeflateItems] = useState<DeflateItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [compressedData, setCompressedData] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parser = useMemo(() => new DeflateParser(), []);

  const stats: CompressionStats | null = useMemo(() => {
    if (!inputText.trim() || !compressedData) return null;

    const originalSize = new TextEncoder().encode(inputText).length;
    const compressedSize = compressedData.length;
    const ratio = compressedSize / originalSize - 1;

    return {
      originalSize,
      compressedSize,
      ratio,
    };
  }, [inputText, compressedData]);

  const compressAndAnalyze = useCallback(() => {
    try {
      setError(null);

      if (!inputText.trim()) {
        setDeflateBlocks([]);
        setDeflateItems([]);
        setCompressedData(null);
        return;
      }

      // Compress the text
      const textBytes = new TextEncoder().encode(inputText);
      const compressed = fflate.zlibSync(textBytes, { level: 9, mem: 12 });
      setCompressedData(compressed);

      // Parse DEFLATE blocks
      const blocks = parser.parseDeflateBlocks(compressed);
      setDeflateBlocks(blocks);

      // Collect all items from all blocks
      const items: DeflateItem[] = [];
      blocks.forEach((block, blockIndex) => {
        block.items.forEach((item, itemIndex) => {
          items.push({
            ...item,
            blockIndex,
            itemIndex,
          });
        });
      });
      setDeflateItems(items);
      setCurrentItemIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setDeflateBlocks([]);
      setDeflateItems([]);
      setCompressedData(null);
    }
  }, [inputText, parser]);

  const currentItem = useMemo(() => {
    return deflateItems[currentItemIndex] || null;
  }, [deflateItems, currentItemIndex]);

  const currentBlock = useMemo(() => {
    if (!currentItem) return null;
    return deflateBlocks[currentItem.blockIndex!] || null;
  }, [currentItem, deflateBlocks]);

  const calculateItemByteRanges = (item: DeflateItem): HighlightRange[] => {
    const ranges: HighlightRange[] = [];

    // Convert bit positions to byte ranges (zlib header already skipped in parser)
    const startByte = Math.floor(item.bitStart / 8);
    const endByte = Math.floor((item.bitEnd - 1) / 8);

    ranges.push({
      start: startByte,
      end: endByte + 1,
      type: item.type,
      bitStart: item.bitStart,
      bitEnd: item.bitEnd,
      startBitInByte: item.bitStart % 8,
      endBitInByte: (item.bitEnd - 1) % 8,
    });

    return ranges;
  };

  const hexDump = useMemo(() => {
    if (!compressedData || !currentItem) return "";

    const highlightRanges = calculateItemByteRanges(currentItem);
    return HexFormatter.formatHexDump(compressedData, highlightRanges);
  }, [compressedData, currentItem]);

  const highlightedText = useMemo(() => {
    if (!inputText || !currentItem) return "";

    // Build the decompressed text up to this point
    let decompressedSoFar = "";
    for (let i = 0; i <= currentItemIndex; i++) {
      const item = deflateItems[i];
      if (item.type === "literal") {
        decompressedSoFar += String.fromCharCode(item.charCode);
      } else if (item.type === "lz77") {
        decompressedSoFar += new TextDecoder().decode(item.text!);
      }
    }

    // Find this text in the original
    const textIndex = inputText.indexOf(decompressedSoFar);
    if (textIndex !== -1) {
      const before = inputText.substring(0, textIndex);

      // Highlight the current item specifically
      let result = before;

      // Add all previous items
      for (let i = 0; i < currentItemIndex; i++) {
        const prevItem = deflateItems[i];
        if (prevItem.type === "literal") {
          result += String.fromCharCode(prevItem.charCode);
        } else if (prevItem.type === "lz77") {
          result += new TextDecoder().decode(prevItem.text!);
        }
      }

      // Highlight the current item
      if (currentItem.type === "literal") {
        result += `<span class="text-highlight">${String.fromCharCode(
          currentItem.charCode
        )}</span>`;
      } else if (currentItem.type === "lz77") {
        result += `<span class="text-highlight">${new TextDecoder().decode(
          currentItem.text!
        )}</span>`;
      }

      // Add remaining text
      const remainingStart = textIndex + decompressedSoFar.length;
      result += inputText.substring(remainingStart);

      return result;
    } else {
      // Fallback: show the decompressed text
      return `<span class="text-highlight">${decompressedSoFar}</span>`;
    }
  }, [inputText, currentItem, currentItemIndex, deflateItems]);

  return {
    inputText,
    setInputText,
    deflateBlocks,
    deflateItems,
    currentItemIndex,
    setCurrentItemIndex,
    currentItem,
    currentBlock,
    stats,
    hexDump,
    highlightedText,
    error,
    compressAndAnalyze,
    compressedData,
  };
};
