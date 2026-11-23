import { describe, it, expect } from 'vitest';
import { BASE_FONT_SIZE } from '@vbee-holding/video-renderer/schema';

describe('renderer/types', () => {
  it('BASE_FONT_SIZE is 64', () => {
    expect(BASE_FONT_SIZE).toBe(64);
  });

  it('BASE_FONT_SIZE matches CAPTION_BASE_FONT_SIZE from caption-types', async () => {
    const { CAPTION_BASE_FONT_SIZE } = await import('../../components/caption/caption-types');
    expect(BASE_FONT_SIZE).toBe(CAPTION_BASE_FONT_SIZE);
  });
});
