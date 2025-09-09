import React from 'react';

interface HighlightedTextProps {
  highlightedText: string;
  hasData: boolean;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({ highlightedText, hasData }) => {
  if (!hasData) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Decompressed Text</h3>
      <div className="font-mono text-base leading-relaxed p-4 bg-gray-50 rounded border border-gray-200">
        <div dangerouslySetInnerHTML={{ __html: highlightedText }} />
      </div>
    </div>
  );
};
