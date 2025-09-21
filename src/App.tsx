import { useEffect } from 'react';
import { useCompression } from './hooks/useCompression';
import { InputSection } from './components/InputSection';
import { DeflateStream } from './components/DeflateStream';

function App() {
  const {
    inputText,
    setInputText,
    compressionLevel,
    setCompressionLevel,
    deflateItems,
    stats,
    error,
    compressAndAnalyze,
    compressedData
  } = useCompression();

  // Auto-compress when input or compression level changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      compressAndAnalyze();
    }, 0); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [inputText, compressionLevel, compressAndAnalyze]);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">

        <InputSection
          value={inputText}
          onChange={setInputText}
          stats={stats}
          compressionLevel={compressionLevel}
          onCompressionLevelChange={setCompressionLevel}
        />

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-100 px-4 py-3 rounded-lg mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}


        {/* <HexOutput hexDump={hexDump} hasData={hasData} /> */}

        <DeflateStream
          deflateItems={deflateItems}
          compressedData={compressedData}
        />
      </div>
    </div>
  );
}

export default App;