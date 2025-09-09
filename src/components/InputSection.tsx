import React from 'react';

interface InputSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ value, onChange }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <label htmlFor="inputText" className="block text-sm font-semibold text-gray-700 mb-3">
        Enter text to compress and visualize:
      </label>
      <textarea
        id="inputText"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type or paste your text here..."
        className="w-full min-h-[120px] p-4 border-2 border-gray-200 rounded-lg font-mono text-lg resize-y transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
};
