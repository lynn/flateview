import React from 'react';
import type { DeflateItem } from '../types';

interface DeflateStreamProps {
  deflateItems: DeflateItem[];
  compressedData: Uint8Array | null;
}

export const DeflateStream: React.FC<DeflateStreamProps> = ({
  deflateItems,
  compressedData
}) => {
  if (deflateItems.length === 0 || !compressedData) return null;

  const getItemBits = (item: DeflateItem): string => {
    if (!compressedData) return '';
    
    const startByte = Math.floor(item.bitStart / 8);
    const endByte = Math.floor((item.bitEnd - 1) / 8);
    const startBit = item.bitStart % 8;
    const endBit = (item.bitEnd - 1) % 8;
    
    let bits = '';
    
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

  const getItemText = (item: DeflateItem): string => {
    if (item.type === 'literal') {
      return item.value || '';
    } else if (item.type === 'lz77' && item.text) {
      return new TextDecoder().decode(item.text);
    }
    return '';
  };

  const getItemTypeColor = (item: DeflateItem): string => {
    if (item.type === 'literal') {
      return 'bg-blue-100 border-blue-300 text-blue-800';
    } else if (item.type === 'lz77') {
      return 'bg-green-100 border-green-300 text-green-800';
    }
    return 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getItemTypeLabel = (item: DeflateItem): string => {
    if (item.type === 'literal') {
      return `L${item.charCode}`;
    } else if (item.type === 'lz77') {
      return `LZ${item.length}`;
    }
    return '?';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">DEFLATE Stream</h3>
      
      <div className="flex flex-wrap gap-2">
        {deflateItems.map((item, index) => {
          const bits = getItemBits(item);
          const text = getItemText(item);
          const typeColor = getItemTypeColor(item);
          const typeLabel = getItemTypeLabel(item);
          
          return (
            <div
              key={index}
              className={`flex flex-col items-center p-2 rounded border-2 ${typeColor} min-w-0`}
              title={`${item.type === 'literal' ? 'Literal' : 'LZ77'}: ${text} (${bits.length} bits)`}
            >
              {/* Decoded text on top */}
              <div className="text-xs font-semibold mb-1 text-center break-all">
                {text || 'EOF'}
              </div>
              
              {/* Type label */}
              <div className="text-xs opacity-75 mb-1">
                {typeLabel}
              </div>
              
              {/* Bits */}
              <div className="font-mono text-xs text-center break-all">
                {bits}
              </div>
              
              {/* Bit count */}
              <div className="text-xs opacity-50 mt-1">
                {bits.length}b
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Literal ({deflateItems.filter(item => item.type === 'literal').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>LZ77 ({deflateItems.filter(item => item.type === 'lz77').length})</span>
          </div>
          <div className="text-gray-500">
            Total: {deflateItems.length} items
          </div>
        </div>
      </div>
    </div>
  );
};
