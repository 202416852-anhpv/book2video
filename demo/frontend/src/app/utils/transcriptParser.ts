export interface TranscriptBlock {
  id: number;
  startTime: string; // Format: HH:MM:SS,mmm
  endTime: string;   // Format: HH:MM:SS,mmm
  startSeconds: number; // For easier playback
  endSeconds: number;
  text: string;
}

// Convert SRT timestamp to seconds
function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.replace(',', '.').split(':');
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parseFloat(parts[2]);
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Parse SRT-style transcript file
export function parseTranscript(content: string): TranscriptBlock[] {
  const blocks: TranscriptBlock[] = [];
  const lines = content.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Look for block number
    if (line && /^\d+$/.test(line)) {
      const id = parseInt(line);
      i++;
      
      // Look for timestamp line
      if (i < lines.length) {
        const timestampLine = lines[i].trim();
        const timestampMatch = timestampLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
        
        if (timestampMatch) {
          const startTime = timestampMatch[1];
          const endTime = timestampMatch[2];
          const startSeconds = timestampToSeconds(startTime);
          const endSeconds = timestampToSeconds(endTime);
          i++;
          
          // Collect text lines until empty line or next block
          const textLines: string[] = [];
          while (i < lines.length) {
            const textLine = lines[i].trim();
            if (!textLine || /^\d+$/.test(textLine)) {
              break;
            }
            textLines.push(textLine);
            i++;
          }
          
          blocks.push({
            id,
            startTime,
            endTime,
            startSeconds,
            endSeconds,
            text: textLines.join(' ').trim()
          });
        } else {
          i++;
        }
      }
    } else {
      i++;
    }
  }
  
  return blocks;
}

// Format seconds to HH:MM:SS for display
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
}
