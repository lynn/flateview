import React from 'react';

interface HexOutputProps {
  hexDump: string;
  hasData: boolean;
}

export const HexOutput: React.FC<HexOutputProps> = ({ hexDump, hasData }) => {
  if (!hasData) {
    return (
      <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-base leading-relaxed h-80 overflow-y-auto whitespace-pre-wrap shadow-sm border border-gray-200 mb-6">
        <div className="text-gray-500 italic text-center py-20">
          Enter some text to see the compressed output
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-base leading-relaxed h-80 overflow-y-auto whitespace-pre-wrap shadow-sm border border-gray-200 mb-6">
      <div dangerouslySetInnerHTML={{ __html: hexDump }} />
    </div>
  );
};
