import { describe, it, expect } from 'vitest';
import { CAPTION_PRESETS, PRESET_LIST, CAPTION_FONTS } from '../caption-presets';
import type { CaptionPresetId, CaptionStyleConfig } from '../caption-types';
import { CAPTION_BASE_FONT_SIZE } from '../caption-types';

describe('CAPTION_PRESETS', () => {
  const allPresetIds: CaptionPresetId[] = [
    'none', 'classic', 'one-word', 'negative', 'punchy', 'peach',
    'hype', 'yellow-highlight', 'bubble', 'modern',
    'cinematic', 'meme', 'handwritten', 'custom',
  ];

  it('has all 14 preset IDs', () => {
    expect(Object.keys(CAPTION_PRESETS)).toHaveLength(14);
    for (const id of allPresetIds) {
      expect(CAPTION_PRESETS).toHaveProperty(id);
    }
  });

  it('each preset has presetId matching its key', () => {
    for (const [key, preset] of Object.entries(CAPTION_PRESETS)) {
      expect(preset.presetId).toBe(key);
    }
  });

  it('each preset has all required CaptionStyleConfig fields', () => {
    const requiredKeys: (keyof CaptionStyleConfig)[] = [
      'presetId', 'fontFamily', 'fontWeight', 'sizeScale', 'textColor',
      'textTransform', 'letterSpacing', 'outline', 'shadow', 'background',
      'wordHighlight', 'position', 'maxWidth', 'maxLines', 'maxWordsPerLine',
      'autoBreak', 'textAlign', 'revealMode',
    ];
    for (const [id, preset] of Object.entries(CAPTION_PRESETS)) {
      for (const key of requiredKeys) {
        expect(preset, `${id} missing ${key}`).toHaveProperty(key);
      }
    }
  });

  it('uses sizeScale (not fontSize) in all presets', () => {
    for (const [id, preset] of Object.entries(CAPTION_PRESETS)) {
      expect(typeof preset.sizeScale, `${id} sizeScale`).toBe('number');
      expect(preset.sizeScale, `${id} sizeScale > 0`).toBeGreaterThan(0);
      expect(preset).not.toHaveProperty('fontSize');
    }
  });

  it('outline sub-config is complete in all presets', () => {
    for (const [id, preset] of Object.entries(CAPTION_PRESETS)) {
      const { outline } = preset;
      expect(typeof outline.enabled, `${id}.outline.enabled`).toBe('boolean');
      expect(typeof outline.color, `${id}.outline.color`).toBe('string');
      expect(typeof outline.width, `${id}.outline.width`).toBe('number');
      expect(typeof outline.opacity, `${id}.outline.opacity`).toBe('number');
    }
  });

  it('shadow sub-config is complete in all presets', () => {
    for (const [id, preset] of Object.entries(CAPTION_PRESETS)) {
      const { shadow } = preset;
      expect(typeof shadow.enabled, `${id}.shadow.enabled`).toBe('boolean');
      expect(typeof shadow.color, `${id}.shadow.color`).toBe('string');
      expect(typeof shadow.offsetX, `${id}.shadow.offsetX`).toBe('number');
      expect(typeof shadow.offsetY, `${id}.shadow.offsetY`).toBe('number');
      expect(typeof shadow.blur, `${id}.shadow.blur`).toBe('number');
    }
  });

  it('position sub-config is complete in all presets', () => {
    const validX = ['left', 'center', 'right'];
    const validY = ['top', 'center', 'bottom'];
    for (const [id, preset] of Object.entries(CAPTION_PRESETS)) {
      expect(validX, `${id}.position.x`).toContain(preset.position.x);
      expect(validY, `${id}.position.y`).toContain(preset.position.y);
      expect(typeof preset.position.offsetX).toBe('number');
      expect(typeof preset.position.offsetY).toBe('number');
    }
  });

  describe('specific presets', () => {
    it('classic: uppercase, thick outline, hard shadow', () => {
      const c = CAPTION_PRESETS['classic'];
      expect(c.textTransform).toBe('uppercase');
      expect(c.outline.enabled).toBe(true);
      expect(c.outline.width).toBeGreaterThanOrEqual(10);
      expect(c.shadow.enabled).toBe(true);
      expect(c.shadow.blur).toBe(0); // hard shadow
      expect(c.sizeScale).toBe(400);
    });

    it('one-word: one-word-at-a-time reveal, maxWordsPerLine=1', () => {
      const ow = CAPTION_PRESETS['one-word'];
      expect(ow.revealMode).toBe('one-word-at-a-time');
      expect(ow.maxWordsPerLine).toBe(1);
      expect(ow.maxLines).toBe(1);
    });

    it('negative: one-word-at-a-time, 400% size, no outline', () => {
      const n = CAPTION_PRESETS['negative'];
      expect(n.revealMode).toBe('one-word-at-a-time');
      expect(n.sizeScale).toBe(400);
      expect(n.outline.enabled).toBe(false);
    });

    it('punchy: yellow text, red outline + shadow', () => {
      const p = CAPTION_PRESETS['punchy'];
      expect(p.textColor).toBe('#fecc01');
      expect(p.outline.color).toBe('#c90303');
      expect(p.shadow.color).toBe('#c90303');
    });

    it('hype: hot pink word highlight', () => {
      const h = CAPTION_PRESETS['hype'];
      expect(h.wordHighlight.enabled).toBe(true);
      expect(h.wordHighlight.backgroundColor).toBe('#f71c53');
    });

    it('cinematic: character-by-character reveal, serif font', () => {
      const cin = CAPTION_PRESETS['cinematic'];
      expect(cin.revealMode).toBe('character-by-character');
      expect(cin.fontFamily).toBe('Merriweather');
    });

    it('meme: black text, white bg, autoBreak=false', () => {
      const m = CAPTION_PRESETS['meme'];
      expect(m.textColor).toBe('#000000');
      expect(m.background.enabled).toBe(true);
      expect(m.background.color).toBe('#ffffff');
      expect(m.autoBreak).toBe(false);
    });

    it('handwritten: Caveat font, no effects', () => {
      const h = CAPTION_PRESETS['handwritten'];
      expect(h.fontFamily).toBe('Caveat');
      expect(h.outline.enabled).toBe(false);
      expect(h.shadow.enabled).toBe(false);
    });
  });
});

describe('PRESET_LIST', () => {
  it('has entries for all non-custom presets', () => {
    // PRESET_LIST excludes 'custom' (it's for UI display)
    expect(PRESET_LIST.length).toBeGreaterThanOrEqual(12);
    const ids = PRESET_LIST.map(p => p.id);
    expect(ids).toContain('none');
    expect(ids).toContain('classic');
    expect(ids).toContain('cinematic');
    expect(ids).toContain('meme');
    expect(ids).toContain('handwritten');
  });

  it('each entry has id and label', () => {
    for (const entry of PRESET_LIST) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.label).toBe('string');
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it('all PRESET_LIST ids exist in CAPTION_PRESETS', () => {
    for (const entry of PRESET_LIST) {
      expect(CAPTION_PRESETS).toHaveProperty(entry.id);
    }
  });
});

describe('CAPTION_FONTS', () => {
  it('has at least 10 fonts', () => {
    expect(CAPTION_FONTS.length).toBeGreaterThanOrEqual(10);
  });

  it('includes handwriting category', () => {
    const handwriting = CAPTION_FONTS.filter(f => f.category === 'handwriting');
    expect(handwriting.length).toBeGreaterThanOrEqual(1);
  });

  it('each font has family, label, weights[], and category', () => {
    for (const font of CAPTION_FONTS) {
      expect(typeof font.family).toBe('string');
      expect(typeof font.label).toBe('string');
      expect(Array.isArray(font.weights)).toBe(true);
      expect(font.weights.length).toBeGreaterThan(0);
      expect(['sans-serif', 'serif', 'display', 'handwriting']).toContain(font.category);
    }
  });

  it('all fonts used by presets are in CAPTION_FONTS', () => {
    const fontFamilies = new Set(CAPTION_FONTS.map(f => f.family));
    for (const [id, preset] of Object.entries(CAPTION_PRESETS)) {
      if (id === 'none' || id === 'custom') continue;
      expect(fontFamilies, `${id} uses font ${preset.fontFamily}`).toContain(preset.fontFamily);
    }
  });
});
