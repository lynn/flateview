import React from 'react';
import type { DeflateBlock, DeflateItem } from '../types';

interface DeflateBreakdownProps {
  deflateItems: DeflateItem[];
  currentItemIndex: number;
  onItemChange: (index: number) => void;
  currentItem: DeflateItem | null;
  currentBlock: DeflateBlock | null;
}

export const DeflateBreakdown: React.FC<DeflateBreakdownProps> = ({
  deflateItems,
  currentItemIndex,
  onItemChange,
  currentItem,
  currentBlock
}) => {
  if (deflateItems.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">DEFLATE Breakdown</h3>
      
      <div className="mb-6">
        <input
          type="range"
          min="0"
          max={Math.max(0, deflateItems.length - 1)}
          value={currentItemIndex}
          onChange={(e) => onItemChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="text-sm text-gray-600 mt-2">
          Item {currentItemIndex + 1} of {deflateItems.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <div className="text-sm font-semibold text-gray-600">Block Type</div>
          <div className="text-lg font-bold text-gray-900">
            {currentBlock ? `Block ${(currentItem?.blockIndex || 0) + 1} (${currentBlock.type})` : 'Unknown'}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-600">Block Size</div>
          <div className="text-lg font-bold text-gray-900">
            {currentBlock ? `${currentBlock.size} bytes` : '0 bytes'}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-600">Position</div>
          <div className="text-lg font-bold text-gray-900">
            {currentItem ? `Position ${currentItem.position.byte}.${currentItem.position.bit}` : 'Position 0.0'}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded border-l-4 border-blue-500">
        <div className="font-mono text-sm whitespace-pre">
          {currentItem ? (
            currentItem.type === 'literal' ? (
              `Literal: ${currentItem.charCode} ('${currentItem.value}')\n`
            ) : currentItem.type === 'lz77' ? (
              `LZ77: length=${currentItem.length}, distance=${currentItem.distance}\nText: "${new TextDecoder().decode(currentItem.text)}"\n`
            ) : currentItem.type === 'zlib_header' ? (
              `ZLIB Header: CM=${currentItem.compressionMethod}, CINFO=${currentItem.compressionInfo}, FCHECK=${currentItem.fcheck}, FDICT=${currentItem.fdict}, FLEVEL=${currentItem.flevel}\n`
            ) : currentItem.type === 'zlib_checksum' ? (
              `ZLIB Checksum: ${currentItem.checksum.toString(16).toUpperCase().padStart(8, '0')}\n`
            ) : currentItem.type === 'dynamic_huffman_literal' ? (
              `Dynamic Huffman Literal: symbol=${currentItem.symbol}, codeLength=${currentItem.codeLength}\n`
            ) : currentItem.type === 'dynamic_huffman_distance' ? (
              `Dynamic Huffman Distance: symbol=${currentItem.symbol}, codeLength=${currentItem.codeLength}\n`
            ) : currentItem.type === 'dynamic_huffman_length' ? (
              `Dynamic Huffman Length: symbol=${currentItem.symbol}, codeLength=${currentItem.codeLength}\n`
            ) : currentItem.type === 'end_of_block' ? (
              `End of Block\n`
            ) : (
              'Unknown item type'
            )
          ) : (
            'No data'
          )}
        </div>
      </div>
    </div>
  );
};
