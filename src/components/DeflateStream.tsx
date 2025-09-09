import React from 'react';
import type { DeflateItem } from '../types';
import { DeflateItemComponent } from './DeflateItem';

interface DeflateStreamProps {
  deflateItems: DeflateItem[];
  compressedData: Uint8Array | null;
}

export const DeflateStream: React.FC<DeflateStreamProps> = ({
  deflateItems,
  compressedData
}) => {
  if (deflateItems.length === 0 || !compressedData) return null;


  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-700 mb-6">
      
      <div className="flex flex-wrap gap-x-0.5 gap-y-2">
        {deflateItems.map((item, index) => (
          <DeflateItemComponent
            key={index}
            item={item}
            compressedData={compressedData}
          />
        ))}
      </div>
      
    </div>
  );
};
