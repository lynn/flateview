import React from 'react';
import type { CompressionStats } from '../types';
import { StatsSection } from './StatsSection';

interface InputSectionProps {
  value: string;
  onChange: (value: string) => void;
  stats: CompressionStats | null;
}

export const InputSection: React.FC<InputSectionProps> = ({ value, onChange, stats }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 transition-colors duration-200">
      <label htmlFor="inputText" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        enter text to compress and visualize:
      </label>
      <textarea
        id="inputText"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type or paste your text here..."
        className="w-full min-h-[120px] p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-mono text-lg resize-y transition-colors focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
      />
      <StatsSection stats={stats} />
    </div>
  );
};
