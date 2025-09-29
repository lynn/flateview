import React from "react";
import type { DeflateItem } from "../types";

interface DeflateItemProps {
  item: DeflateItem;
  compressedData: Uint8Array | null;
}

function showWhitespace(text: string): string {
  return text
    .replaceAll(" ", "·")
    .replaceAll("\n", "␤")
    .replaceAll("\r", "␤")
    .replaceAll("\t", "␉");
}

export const Stretch = ({
  sourceLength,
  targetLength,
  children,
  height,
}: {
  sourceLength: number;
  targetLength: number;
  children: React.ReactNode;
  height: number;
}) => {
  const factor = targetLength / sourceLength;
  const y = height / factor;
  return (
    <div
      className={`relative w-full font-mono break-all mt-1 flex items-center`}
      style={{ height: `${height}em` }}
    >
      <div
        className={`absolute origin-left overflow-visible whitespace-nowrap flex`}
        style={{
          transform: `scaleX(${factor}) scaleY(${y * factor})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

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

    for (let byteIndex = startByte; byteIndex <= endByte; byteIndex++) {
      const byte = compressedData[byteIndex];
      const startBitInByte = byteIndex === startByte ? startBit : 0;
      const endBitInByte = byteIndex === endByte ? endBit : 7;

      for (let i = startBitInByte; i <= endBitInByte; i++) {
        bits += (byte >> i) & 1 ? "ı" : "o";
      }
    }

    return bits;
  };

  // Get text content for this item
  const getItemText = (item: DeflateItem): string => {
    switch (item.type) {
      case "uncompressed_len16":
        return `len=${(item as any).value}`;
      case "uncompressed_nlen16":
        return `nlen=~${(~(item as any).value) & 0xffff}`;
      case "dynamic_huffman_literal":
      case "literal":
        return item.symbol < 127
          ? showWhitespace(String.fromCharCode(item.symbol))
          : `\\x${item.symbol.toString(16).padStart(2, "0")}`;
      case "lz77":
        return showWhitespace(new TextDecoder().decode(item.text));
      case "zlib_header":
        return `zlib header`;
      case "zlib_checksum":
        return `checksum`;
      case "dynamic_huffman_header":
        return `parameters`;
      case "dynamic_huffman_distance":
        return showWhitespace(new TextDecoder().decode(item.text));
      case "dynamic_huffman_length":
        return ` `;
      case "block_start":
        return `block`;
      case "end_of_block":
        return "end";
      default:
        return "";
    }
  };

  // Get text content for this item
  const getItemExplanation = (item: DeflateItem): string => {
    switch (item.type) {
      case "uncompressed_len16":
        return `${(item as any).value.toString(16).padStart(4, "0")}`;
      case "uncompressed_nlen16":
        return `${(item as any).value.toString(16).padStart(4, "0")}`;
      case "dynamic_huffman_literal":
      case "literal":
        return item.symbol.toString(16).padStart(2, "0");
      case "lz77":
      case "dynamic_huffman_distance":
        return `×${item.length}←${item.distance}`;
      case "zlib_header":
        return `${item.compressionMethod},${item.compressionInfo};${item.fcheck},${item.fdict},${item.flevel}`;
      case "zlib_checksum":
        return `${item.checksum.toString(16).padStart(8, "0")}`;
      case "dynamic_huffman_header":
        return `(${item.hlit},${item.hdist},${item.hclen})`;
      case "dynamic_huffman_length":
        return `${item.text}`;
      case "block_start":
        return `${item.flavor}`;
      case "end_of_block":
        return "";
      default:
        return "";
    }
  };

  // Get color based on item type
  const getItemTypeColor = (item: DeflateItem): string => {
    switch (item.type) {
      case "uncompressed_len16":
        return "bg-indigo-800 border-indigo-600 text-indigo-100";
      case "uncompressed_nlen16":
        return "bg-fuchsia-800 border-fuchsia-600 text-fuchsia-100";
      case "dynamic_huffman_literal":
      case "literal":
        if (item.symbol < 127) {
          return "bg-blue-800 border-blue-600 text-blue-100";
        } else {
          return "bg-teal-800 border-teal-600 text-teal-100";
        }
      case "lz77":
      case "dynamic_huffman_distance":
        return "bg-amber-800 border-amber-600 text-amber-100";
      case "dynamic_huffman_header":
      case "zlib_header":
      case "zlib_checksum":
      case "block_start":
        return "bg-rose-800 border-purple-600 text-purple-100";
      default:
        return "bg-gray-700 border-gray-500 text-gray-200";
    }
  };

  const bits = getItemBits(item);
  const text = getItemText(item);
  const typeColor = getItemTypeColor(item);
  const explanation = getItemExplanation(item);

  const background =
    item.type === "dynamic_huffman_literal" || item.type === "literal"
      ? `oklab(0.35 ${bits.length * 0.04 - 0.15} -0.1)`
      : "";

  return (
    <div
      className={`relative ${typeColor} tracking-tight flex flex-col items-center min-w-0 rounded-sm`}
      style={{ background, lineHeight: 1 }}
    >
      <Stretch
        sourceLength={explanation.length}
        targetLength={bits.length}
        height={1.5}
      >
        <span className="opacity-50">
          {"numLengthBits" in item ? (
            <>
              <span className="border-b border-r border-gray-200">
                {explanation.slice(0, explanation.indexOf("←"))}
              </span>
              <span>{explanation.slice(explanation.indexOf("←"))}</span>
            </>
          ) : (
            <span>{explanation}</span>
          )}
        </span>
      </Stretch>

      <Stretch sourceLength={text.length} targetLength={bits.length} height={3}>
        {text}
      </Stretch>

      <div className="font-mono opacity-50 flex mt-1">
        {"numLengthBits" in item ? (
          <>
            <span className="border-t border-r border-gray-200 pe-[1px] me-[1px]">
              {bits.slice(0, item.numLengthBits)}
            </span>
            <span className="">{bits.slice(item.numLengthBits)}</span>
          </>
        ) : (
          <span className="">{bits}</span>
        )}
      </div>
    </div>
  );
};
