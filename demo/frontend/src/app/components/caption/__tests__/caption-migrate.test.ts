import { describe, it, expect } from 'vitest';
import { migrateCaptionConfig, isLegacyConfig } from '../caption-migrate';
import { CAPTION_PRESETS } from '../caption-presets';

describe('isLegacyConfig', () => {
  it('returns false for null/undefined', () => {
    expect(isLegacyConfig(null)).toBe(false);
    expect(isLegacyConfig(undefined)).toBe(false);
  });

  it('returns false for current v2 config', () => {
    expect(isLegacyConfig(CAPTION_PRESETS['classic'])).toBe(false);
  });

  it('returns true for v1 flat config with bgColor string', () => {
    expect(isLegacyConfig({ bgColor: 'rgba(0,0,0,0.6)', textColor: '#fff' })).toBe(true);
  });

  it('returns false when outline is an object (v2)', () => {
    expect(isLegacyConfig({
      bgColor: '#000',
      outline: { enabled: true, color: '#000', width: 3, opacity: 1 },
    })).toBe(false);
  });
});

describe('migrateCaptionConfig', () => {
  it('returns "none" preset for null input', () => {
    const result = migrateCaptionConfig(null);
    expect(result.presetId).toBe('none');
  });

  it('passes through current format config unchanged (adds defaults)', () => {
    const current = { ...CAPTION_PRESETS['classic'] };
    const result = migrateCaptionConfig(current);
    expect(result.presetId).toBe('classic');
    expect(result.sizeScale).toBe(current.sizeScale);
    expect(result.autoBreak).toBe(true);
  });

  it('adds autoBreak default to config missing it', () => {
    const configNoAutoBreak = { ...CAPTION_PRESETS['classic'] };
    delete (configNoAutoBreak as any).autoBreak;
    const result = migrateCaptionConfig(configNoAutoBreak);
    expect(result.autoBreak).toBe(true);
  });

  it('adds sizeScale default to config missing it', () => {
    const configNoScale = { ...CAPTION_PRESETS['classic'] };
    delete (configNoScale as any).sizeScale;
    const result = migrateCaptionConfig(configNoScale);
    expect(result.sizeScale).toBe(100);
  });

  describe('v1 flat format migration', () => {
    const v1Config = {
      presetId: 'classic',
      bgColor: 'rgba(0,0,0,0.6)',
      textColor: '#FFFFFF',
      fontFamily: 'Poppins',
      fontWeight: 600,
      fontSize: 72,
      textTransform: 'uppercase',
      textShadow: '2 4 6 rgba(0,0,0,0.8)',
      padding: '8px 24px',
      borderRadius: 8,
      textAlign: 'center',
      position: 'bottom',
    };

    it('converts v1 to v2 format', () => {
      const result = migrateCaptionConfig(v1Config);
      expect(result.presetId).toBe('classic');
      expect(result.fontFamily).toBe('Poppins');
      expect(result.fontWeight).toBe(600);
      expect(result.textTransform).toBe('uppercase');
      expect(result.autoBreak).toBe(true);
    });

    it('converts fontSize to sizeScale', () => {
      const result = migrateCaptionConfig(v1Config);
      // fontSize 72 / 64 * 100 = 112.5 → rounded to 113
      expect(result.sizeScale).toBe(Math.round((72 / 64) * 100));
    });

    it('parses textShadow string into shadow config', () => {
      const result = migrateCaptionConfig(v1Config);
      expect(result.shadow.enabled).toBe(true);
      expect(result.shadow.offsetX).toBe(2);
      expect(result.shadow.offsetY).toBe(4);
      expect(result.shadow.blur).toBe(6);
    });

    it('creates background config from bgColor', () => {
      const result = migrateCaptionConfig(v1Config);
      expect(result.background.enabled).toBe(true);
      expect(result.background.color).toBe('rgba(0,0,0,0.6)');
    });

    it('parses padding string into padding object', () => {
      const result = migrateCaptionConfig(v1Config);
      expect(result.background.padding).toEqual({ x: 24, y: 8 });
    });

    it('maps v1 position to v2 position config', () => {
      const result = migrateCaptionConfig(v1Config);
      expect(result.position.y).toBe('bottom');
      expect(result.position.x).toBe('center');
    });

    it('maps legacy presetIds correctly', () => {
      expect(migrateCaptionConfig({ ...v1Config, presetId: 'bouncy' }).presetId).toBe('classic');
      expect(migrateCaptionConfig({ ...v1Config, presetId: 'liquid-glass' }).presetId).toBe('modern');
      expect(migrateCaptionConfig({ ...v1Config, presetId: 'uppercase' }).presetId).toBe('punchy');
      expect(migrateCaptionConfig({ ...v1Config, presetId: 'cinema-classic' }).presetId).toBe('cinematic');
      expect(migrateCaptionConfig({ ...v1Config, presetId: 'unknown-thing' }).presetId).toBe('custom');
    });

    it('disables outline when bg is present', () => {
      const result = migrateCaptionConfig(v1Config);
      expect(result.outline.enabled).toBe(false);
    });

    it('enables outline when no bg', () => {
      const noBg = { ...v1Config, bgColor: 'transparent' };
      const result = migrateCaptionConfig(noBg);
      expect(result.outline.enabled).toBe(true);
    });
  });

  describe('v2 with legacy fontSize (px) → sizeScale (%)', () => {
    it('converts fontSize 64 to sizeScale 100', () => {
      const config = { ...CAPTION_PRESETS['classic'], fontSize: 64 } as any;
      delete config.sizeScale;
      const result = migrateCaptionConfig(config);
      expect(result.sizeScale).toBe(100);
    });

    it('converts fontSize 128 to sizeScale 200', () => {
      const config = { ...CAPTION_PRESETS['classic'], fontSize: 128 } as any;
      delete config.sizeScale;
      const result = migrateCaptionConfig(config);
      expect(result.sizeScale).toBe(200);
    });

    it('converts fontSize 96 to sizeScale 150', () => {
      const config = { ...CAPTION_PRESETS['classic'], fontSize: 96 } as any;
      delete config.sizeScale;
      const result = migrateCaptionConfig(config);
      expect(result.sizeScale).toBe(150);
    });

    it('preserves autoBreak when present', () => {
      const config = { ...CAPTION_PRESETS['classic'], fontSize: 64, autoBreak: false } as any;
      delete config.sizeScale;
      const result = migrateCaptionConfig(config);
      expect(result.autoBreak).toBe(false);
    });
  });
});
