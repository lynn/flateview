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
    if (item.type === "literal") {
      return item.value || "";
    } else if (item.type === "lz77" && item.text) {
      return new TextDecoder().decode(item.text);
    }
    return "";
  };

  // Get color based on item type
  const getItemTypeColor = (item: DeflateItem): string => {
    if (item.type === "literal") {
      return "bg-blue-900 border-blue-600 text-blue-100";
    } else if (item.type === "lz77") {
      return "bg-green-900 border-green-600 text-green-100";
    }
    return "bg-gray-800 border-gray-600 text-gray-100";
  };

  const bits = getItemBits(item);
  const text = getItemText(item);
  const typeColor = getItemTypeColor(item);

  const factor = bits.length / text.length;

  return (
    <div
      className={`relative ${typeColor} flex flex-col items-center min-w-0`}
    >
      <div className={`relative w-full mx-1 font-mono break-all whitespace-pre-wrap`}>
        <div
          className={`absolute top-0 left-0 origin-top-left inline-block tracking-tight overflow-visible whitespace-nowrap ${
            text.trim() ? "" : "text-gray-300"
          }`}
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
