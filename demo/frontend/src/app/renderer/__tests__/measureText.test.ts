import { describe, it, expect, vi, beforeEach } from 'vitest';
import { measureAndWrapText, type MeasuredLine } from '@vbee-holding/video-renderer/draw';
import type { RenderStyle } from '@vbee-holding/video-renderer/schema';

// Mock CanvasRenderingContext2D
function createMockCtx(charWidth = 10): CanvasRenderingContext2D {
  return {
    font: '',
    measureText: vi.fn((text: string) => ({ width: text.length * charWidth })),
  } as any;
}

const baseStyle: RenderStyle = {
  fontFamily: 'Arial',
  fontWeight: 700,
  sizeScale: 100,
  textColor: '#ffffff',
  textTransform: 'none',
  letterSpacing: 0,
  outline: { enabled: false, color: '#000', width: 0, opacity: 1 },
  shadow: { enabled: false, color: '#000', offsetX: 0, offsetY: 0, blur: 0, opacity: 1 },
  background: { enabled: false, color: '#000', opacity: 50, borderRadius: 8, padding: { x: 20, y: 10 } },
  wordHighlight: { enabled: false, color: '#fff', backgroundColor: '#fff', opacity: 0 },
  position: { x: 'center', y: 'bottom', offsetX: 0, offsetY: 0 },
  maxWidth: 80,
  maxLines: 2,
  maxWordsPerLine: 6,
  autoBreak: true,
  textAlign: 'center',
  revealMode: 'all',
};

describe('measureAndWrapText', () => {
  const scale = 1;

  it('returns empty array for empty words', () => {
    const ctx = createMockCtx();
    const lines = measureAndWrapText(ctx, [], baseStyle, 500, scale);
    expect(lines).toHaveLength(0);
  });

  it('puts all words on one line if they fit', () => {
    const ctx = createMockCtx(10);
    // "Hello world" = 5*10 + space(10) + 5*10 = 110px, maxWidth=500 → fits
    const lines = measureAndWrapText(ctx, ['Hello', 'world'], baseStyle, 500, scale);
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe('Hello world');
    expect(lines[0].words).toHaveLength(2);
  });

  it('wraps words to next line when exceeding maxWidth', () => {
    const ctx = createMockCtx(10);
    // Each word is ~50px (5 chars * 10), space = 10px
    // Line width: word(50) + space(10) + word(50) = 110px
    // maxWidth=100 → second word wraps
    const lines = measureAndWrapText(ctx, ['Hello', 'world'], baseStyle, 100, scale);
    expect(lines).toHaveLength(2);
    expect(lines[0].text).toBe('Hello');
    expect(lines[1].text).toBe('world');
  });

  it('respects maxLines limit when unlimited=false', () => {
    const ctx = createMockCtx(10);
    const style = { ...baseStyle, maxLines: 1 };
    const words = ['one', 'two', 'three', 'four', 'five'];
    const lines = measureAndWrapText(ctx, words, style, 60, scale, false);
    expect(lines.length).toBeLessThanOrEqual(1);
  });

  it('ignores maxLines when unlimited=true', () => {
    const ctx = createMockCtx(10);
    const style = { ...baseStyle, maxLines: 1 };
    const words = ['one', 'two', 'three', 'four', 'five'];
    const lines = measureAndWrapText(ctx, words, style, 60, scale, true);
    expect(lines.length).toBeGreaterThan(1);
  });

  it('respects maxWordsPerLine', () => {
    const ctx = createMockCtx(5);
    const style = { ...baseStyle, maxWordsPerLine: 2 };
    const words = ['a', 'b', 'c', 'd'];
    const lines = measureAndWrapText(ctx, words, style, 9999, scale);
    expect(lines.length).toBe(2);
    expect(lines[0].words).toHaveLength(2);
    expect(lines[1].words).toHaveLength(2);
  });

  it('assigns correct wordIndex to each word', () => {
    const ctx = createMockCtx(10);
    const lines = measureAndWrapText(ctx, ['a', 'b', 'c'], baseStyle, 9999, scale);
    const allWords = lines.flatMap(l => l.words);
    expect(allWords.map(w => w.wordIndex)).toEqual([0, 1, 2]);
  });

  it('assigns y positions based on lineHeight (fontSize * 1.35)', () => {
    const ctx = createMockCtx(10);
    const style = { ...baseStyle, maxWordsPerLine: 1, maxLines: 3 };
    const lines = measureAndWrapText(ctx, ['a', 'b', 'c'], style, 9999, scale);
    // fontSize = 64 * (100/100) * 1 = 64, lineHeight = 64 * 1.35 = 86.4
    const expectedLineHeight = 64 * 1.35;
    expect(lines).toHaveLength(3);
    expect(lines[0].y).toBe(0);
    expect(lines[1].y).toBeCloseTo(expectedLineHeight, 1);
    expect(lines[2].y).toBeCloseTo(expectedLineHeight * 2, 1);
  });

  it('sets font on context with correct format', () => {
    const ctx = createMockCtx();
    measureAndWrapText(ctx, ['test'], baseStyle, 500, scale);
    expect(ctx.font).toMatch(/700 64px 'Arial'/);
  });

  it('scales font size with sizeScale', () => {
    const ctx = createMockCtx();
    const style = { ...baseStyle, sizeScale: 200 };
    measureAndWrapText(ctx, ['test'], style, 500, scale);
    // 64 * (200/100) * 1 = 128
    expect(ctx.font).toMatch(/700 128px/);
  });

  it('scales font size with scale parameter', () => {
    const ctx = createMockCtx();
    measureAndWrapText(ctx, ['test'], baseStyle, 500, 0.5);
    // 64 * (100/100) * 0.5 = 32
    expect(ctx.font).toMatch(/700 32px/);
  });
});
