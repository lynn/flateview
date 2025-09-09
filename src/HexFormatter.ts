import type { HighlightRange } from './types';

export class HexFormatter {
  static formatHexDump(data: Uint8Array, highlightRanges: HighlightRange[] = []): string {
    const bytes = new Uint8Array(data);
    let result = '';
    
    for (let i = 0; i < bytes.length; i += 16) {
      // Hex bytes
      let hexLine = '';
      
      for (let j = 0; j < 16; j++) {
        if (i + j < bytes.length) {
          const byte = bytes[i + j];
          const byteIndex = i + j;
          const hexStr = byte.toString(16).padStart(2, '0').toUpperCase();
          
          // Check if this byte should be highlighted and get bit-level info
          const highlightInfo = highlightRanges.find(range => 
            byteIndex >= range.start && byteIndex < range.end
          );
          
          if (highlightInfo) {
            // Check if this is a partial byte highlight
            if (byteIndex === highlightInfo.start && byteIndex === highlightInfo.end - 1) {
              // Single byte with partial bit highlighting
              const startBit = highlightInfo.startBitInByte;
              const endBit = highlightInfo.endBitInByte;
              const bitCount = endBit - startBit + 1;
              const gradientPercent = (bitCount / 8) * 100;
              const gradientOffset = (startBit / 8) * 100;
              
              const gradientStyle = `background: linear-gradient(90deg, 
                purple ${gradientOffset}%, 
                #2196f3 ${gradientOffset}%, 
                #2196f3 ${gradientOffset + gradientPercent}%, 
                purple ${gradientOffset + gradientPercent}%); 
                color: #fff; font-weight: bold;`;
              
              hexLine += `<span style="${gradientStyle}">${hexStr}</span>`;
            } else if (byteIndex === highlightInfo.start) {
              // Start byte with partial bit highlighting (right side)
              const startBit = highlightInfo.startBitInByte;
              const gradientOffset = (startBit / 8) * 100;
              
              const gradientStyle = `background: linear-gradient(90deg, 
                purple ${gradientOffset}%, 
                #2196f3 ${gradientOffset}%, 
                #2196f3 100%); 
                color: #fff; font-weight: bold;`;
              
              hexLine += `<span style="${gradientStyle}">${hexStr}</span>`;
            } else if (byteIndex === highlightInfo.end - 1) {
              // End byte with partial bit highlighting (left side)
              const endBit = highlightInfo.endBitInByte;
              const gradientPercent = ((endBit + 1) / 8) * 100;
              
              const gradientStyle = `background: linear-gradient(90deg, 
                #2196f3 0%, 
                #2196f3 ${gradientPercent}%, 
                purple ${gradientPercent}%); 
                color: #fff; font-weight: bold;`;
              
              hexLine += `<span style="${gradientStyle}">${hexStr}</span>`;
            } else {
              // Full byte highlight (middle bytes)
              hexLine += `<span class="hex-highlight">${hexStr}</span>`;
            }
          } else if (i + j < 2 || i + j >= bytes.length - 4) {
            hexLine += `<span class="hex-dim">${hexStr}</span>`;
          } else {
            hexLine += hexStr;
          }
          
          // Add space after each byte (except the last one in the line)
          if (j < 15 && i + j + 1 < bytes.length) {
            hexLine += '<span style="display:inline-block; width: 2px;"></span>';
          }
        }
      }
      
      result += hexLine + '\n';
    }
    
    return result;
  }
}