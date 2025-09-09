import React from 'react';
import type { CompressionStats } from '../types';

interface StatsSectionProps {
  stats: CompressionStats | null;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-wrap gap-6 justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-600">Original size:</span>
          <span className="text-lg font-bold text-gray-900">{stats.originalSize} bytes</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-600">Compressed size:</span>
          <span className="text-lg font-bold text-gray-900">{stats.compressedSize} bytes</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-600">Compression ratio:</span>
          <span className={`text-lg font-bold ${stats.ratio < 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {stats.ratio.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
