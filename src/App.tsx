import { useEffect } from 'react';
import { useCompression } from './hooks/useCompression';
import { InputSection } from './components/InputSection';
import { StatsSection } from './components/StatsSection';
import { HexOutput } from './components/HexOutput';
import { DeflateStream } from './components/DeflateStream';
import { HighlightedText } from './components/HighlightedText';

function App() {
  const {
    inputText,
    setInputText,
    deflateItems,
    stats,
    hexDump,
    highlightedText,
    error,
    compressAndAnalyze,
    compressedData
  } = useCompression();

  // Auto-compress when input changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      compressAndAnalyze();
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [inputText, compressAndAnalyze]);

  const hasData = deflateItems.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-light text-gray-800 mb-2">FlateView</h1>
          <p className="text-gray-600 text-lg">Interactive DEFLATE Compression Visualizer</p>
        </header>

        <InputSection value={inputText} onChange={setInputText} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        <StatsSection stats={stats} />

        <HexOutput hexDump={hexDump} hasData={hasData} />

        <DeflateStream
          deflateItems={deflateItems}
          compressedData={compressedData}
        />

        <HighlightedText highlightedText={highlightedText} hasData={hasData} />
      </div>
    </div>
  );
}

export default App;