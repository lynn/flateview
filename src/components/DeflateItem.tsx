import React from "react";
import type { DeflateItem } from "../types";

interface DeflateItemProps {
  item: DeflateItem;
  compressedData: Uint8Array | null;
}

export const DeflateItemComponent: React.FC<DeflateItemProps> = ({
  item,
  compressedData,
}) => {
  // Extract bits for this item
  const getItemBits = (item: DeflateItem): string => {
    if (!compressedData) return "";

    const startByte = Math.floor(item.bitStart / 8);
    const endByte = Math.floor((item.bitEnd - 1) / 8);
    const startBit = item.bitStart % 8;
    const endBit = (item.bitEnd - 1) % 8;

    let bits = "";

    if (startByte === endByte) {
      // All bits are in the same byte
      const byte = compressedData[startByte];
      for (let i = startBit; i <= endBit; i++) {
        bits += ((byte >> i) & 1).toString();
      }
    } else {
      // Bits span multiple bytes
      for (let byteIndex = startByte; byteIndex <= endByte; byteIndex++) {
        const byte = compressedData[byteIndex];
        const startBitInByte = byteIndex === startByte ? startBit : 0;
        const endBitInByte = byteIndex === endByte ? endBit : 7;

        for (let i = startBitInByte; i <= endBitInByte; i++) {
          bits += ((byte >> i) & 1).toString();
        }
      }
    }

    return bits;
  };

  // Get text content for this item
  const getItemText = (item: DeflateItem): string => {
    switch (item.type) {
      case "literal":
        return item.value;
      case "lz77":
        return new TextDecoder().decode(item.text);
      case "zlib_header":
        return `(header)`;
      case "zlib_checksum":
        return `checksum=${item.checksum
          .toString(16)
          .toUpperCase()
          .padStart(8, "0")}`;
      case "dynamic_huffman_header":
        return `huff(${item.hlit},${item.hdist},${item.hclen})`;
      case "dynamic_huffman_literal":
        return String.fromCharCode(item.symbol);
      case "dynamic_huffman_distance":
        return new TextDecoder().decode(item.text);
      case "dynamic_huffman_length":
        return `${item.text}`;
      case "end_of_block":
        return "end";
      default:
        return "";
    }
  };

  // Get color based on item type
  const getItemTypeColor = (item: DeflateItem): string => {
    switch (item.type) {
      case "dynamic_huffman_literal":
      case "literal":
        return "bg-blue-800 border-blue-600 text-blue-100";
      case "lz77":
      case "dynamic_huffman_distance":
        return "bg-amber-800 border-amber-600 text-amber-100";
      case "dynamic_huffman_header":
      case "zlib_header":
        return "bg-rose-800 border-purple-600 text-purple-100";
      default:
        return "bg-gray-700 border-gray-500 text-gray-200";
    }
  };

  const bits = getItemBits(item);
  const text = getItemText(item);
  const typeColor = getItemTypeColor(item);

  const factor = bits.length / text.length;

  return (
    <div
      className={`relative ${typeColor} flex flex-col items-center min-w-0 rounded-sm`}
    >
      <div className={`relative w-full font-mono break-all`}>
        <div
          className={`absolute origin-top-left tracking-tight overflow-visible whitespace-nowrap`}
          style={{ transform: `scaleX(${factor}) scaleY(2)` }}
        >
          {text
            .replaceAll(" ", "·")
            .replaceAll("\n", "␤")
            .replaceAll("\r", "␤")
            .replaceAll("\t", "␉")}
        </div>
      </div>

      <div className="mt-10 font-mono text-center break-all tracking-tight">
        {bits}
      </div>
    </div>
  );
};
