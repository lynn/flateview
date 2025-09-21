import React from 'react';

interface CompressionLevelSliderProps {
  level: number;
  onChange: (level: number) => void;
}

export const CompressionLevelSlider: React.FC<CompressionLevelSliderProps> = ({
  level,
  onChange,
}) => {
  const compressionLevels = [
    { value: 0, label: '0', description: 'No compression' },
    { value: 1, label: '1', description: 'Fastest' },
    { value: 2, label: '2', description: 'Fast' },
    { value: 3, label: '3', description: 'Good' },
    { value: 4, label: '4', description: 'Better' },
    { value: 5, label: '5', description: 'Default' },
    { value: 6, label: '6', description: 'Better' },
    { value: 7, label: '7', description: 'Good' },
    { value: 8, label: '8', description: 'Best' },
    { value: 9, label: '9', description: 'Maximum' },
  ];

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="compression-level" className="text-sm font-semibold text-gray-300">
          compression level:
        </label>
      </div>

      <div className="relative">
        <input
          id="compression-level"
          type="range"
          min="0"
          max="9"
          step="1"
          value={level}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(level / 9) * 100}%, #374151 ${(level / 9) * 100}%, #374151 100%)`
          }}
        />

        {/* Level markers */}
        <div className="flex justify-between mt-1">
          {compressionLevels.map((levelOption) => (
            <div
              key={levelOption.value}
              className={`text-xs ${
                levelOption.value === level
                  ? 'text-blue-400 font-bold'
                  : 'text-gray-500'
              }`}
            >
              {levelOption.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
