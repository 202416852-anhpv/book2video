import { describe, it, expect } from 'vitest';
import { CAPTION_BASE_FONT_SIZE } from '../caption-types';
import type {
  CaptionStyleConfig,
  CaptionPresetId,
  OutlineConfig,
  ShadowConfig,
  BackgroundConfig,
  WordHighlightConfig,
  PositionConfig,
  CaptionBlock,
  CaptionWord,
  CaptionFontMeta,
} from '../caption-types';

describe('caption-types', () => {
  it('CAPTION_BASE_FONT_SIZE is 64', () => {
    expect(CAPTION_BASE_FONT_SIZE).toBe(64);
  });

  it('CaptionPresetId includes new preset IDs (cinematic, meme)', () => {
    // Type-level check: these should compile without error
    const ids: CaptionPresetId[] = [
      'none', 'classic', 'one-word', 'negative', 'punchy', 'peach',
      'hype', 'yellow-highlight', 'bubble', 'modern',
      'cinematic', 'meme', 'handwritten', 'custom',
    ];
    expect(ids).toHaveLength(14);
  });

  it('CaptionStyleConfig has sizeScale instead of fontSize', () => {
    const config: Partial<CaptionStyleConfig> = { sizeScale: 200 };
    expect(config.sizeScale).toBe(200);
    // @ts-expect-error fontSize should not exist on CaptionStyleConfig
    const _: CaptionStyleConfig = { fontSize: 72 } as any;
  });

  it('CaptionStyleConfig has autoBreak field', () => {
    const config: Partial<CaptionStyleConfig> = { autoBreak: false };
    expect(config.autoBreak).toBe(false);
  });

  it('WordHighlightConfig no longer has mode field', () => {
    const highlight: WordHighlightConfig = {
      enabled: true,
      color: '#fff',
      backgroundColor: '#000',
      opacity: 0.5,
    };
    expect(highlight).not.toHaveProperty('mode');
    expect(highlight.opacity).toBe(0.5);
  });

  it('CaptionFontMeta category includes handwriting', () => {
    const font: CaptionFontMeta = {
      family: 'Caveat',
      label: 'Caveat',
      weights: [400, 700],
      category: 'handwriting',
    };
    expect(font.category).toBe('handwriting');
  });

  it('CaptionBlock has optional words field', () => {
    const block: CaptionBlock = {
      id: '1',
      text: 'Hello world',
      startTime: 0,
      endTime: 2,
    };
    expect(block.words).toBeUndefined();

    const blockWithWords: CaptionBlock = {
      ...block,
      words: [{ text: 'Hello', start: 0, end: 1 }, { text: 'world', start: 1, end: 2 }],
    };
    expect(blockWithWords.words).toHaveLength(2);
  });
});
