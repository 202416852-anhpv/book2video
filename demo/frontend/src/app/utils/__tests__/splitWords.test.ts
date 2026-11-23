import { describe, it, expect } from 'vitest';
import { splitWordsEvenly } from '../splitWords';

describe('splitWordsEvenly', () => {
  it('returns empty array for empty text', () => {
    expect(splitWordsEvenly('', 0, 5)).toEqual([]);
  });

  it('returns empty array for whitespace-only text', () => {
    expect(splitWordsEvenly('   ', 0, 5)).toEqual([]);
  });

  it('splits single word across entire duration', () => {
    const words = splitWordsEvenly('Hello', 0, 2);
    expect(words).toHaveLength(1);
    expect(words[0].text).toBe('Hello');
    expect(words[0].start).toBe(0);
    expect(words[0].end).toBe(2);
  });

  it('splits two words evenly', () => {
    const words = splitWordsEvenly('Hello world', 0, 4);
    expect(words).toHaveLength(2);
    expect(words[0]).toEqual({ text: 'Hello', start: 0, end: 2 });
    expect(words[1]).toEqual({ text: 'world', start: 2, end: 4 });
  });

  it('handles non-zero start time', () => {
    const words = splitWordsEvenly('one two three', 5, 8);
    expect(words).toHaveLength(3);
    expect(words[0].start).toBe(5);
    expect(words[2].end).toBe(8);
  });

  it('rounds to 2 decimal places', () => {
    const words = splitWordsEvenly('a b c', 0, 1);
    // duration = 1, each word = 0.333...
    expect(words[0].start).toBe(0);
    expect(words[0].end).toBeCloseTo(0.33, 2);
    expect(words[1].start).toBeCloseTo(0.33, 2);
    expect(words[1].end).toBeCloseTo(0.67, 2);
    expect(words[2].start).toBeCloseTo(0.67, 2);
    expect(words[2].end).toBe(1);
  });

  it('handles multiple spaces between words', () => {
    const words = splitWordsEvenly('hello   world', 0, 4);
    expect(words).toHaveLength(2);
    expect(words[0].text).toBe('hello');
    expect(words[1].text).toBe('world');
  });

  it('produces contiguous (non-overlapping, no-gap) intervals', () => {
    const words = splitWordsEvenly('one two three four five', 1.5, 6.5);
    for (let i = 1; i < words.length; i++) {
      expect(words[i].start).toBe(words[i - 1].end);
    }
    expect(words[0].start).toBe(1.5);
    expect(words[words.length - 1].end).toBe(6.5);
  });
});
