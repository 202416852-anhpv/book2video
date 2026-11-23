import type { CaptionWord } from '../components/caption/caption-types';

/**
 * If a block has no word-level timestamps from transcription,
 * split the text evenly across the block duration.
 */
export function splitWordsEvenly(
  text: string,
  startTime: number,
  endTime: number,
): CaptionWord[] {
  const rawWords = text.split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return [];

  const duration = endTime - startTime;
  const wordDuration = duration / rawWords.length;

  return rawWords.map((w, i) => ({
    text: w,
    start: +(startTime + i * wordDuration).toFixed(2),
    end: +(startTime + (i + 1) * wordDuration).toFixed(2),
  }));
}
