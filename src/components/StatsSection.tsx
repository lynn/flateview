import React from 'react';
import type { CompressionStats } from '../types';

interface StatsSectionProps {
  stats: CompressionStats | null;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => {
  if (!stats) return null;

  return (
      <div className="flex flex-wrap gap-6 mt-4">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-400">Original size:</span>
          <span className="text-lg font-bold text-gray-100">{stats.originalSize} bytes</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-400">Compressed size:</span>
          <span className="text-lg font-bold text-gray-100">{stats.compressedSize} bytes</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-400">Compression ratio:</span>
          <span className={`text-lg font-bold ${stats.ratio < 0 ? 'text-red-400' : 'text-gray-100'}`}>
            {stats.ratio.toFixed(1)}%
          </span>
        </div>
      </div>
  );
};
