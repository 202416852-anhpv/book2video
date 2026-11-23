/**
 * Migration utility for saved projects with old caption config formats.
 * Handles: v1 flat format (bgColor strings) and v2 fontSize→sizeScale.
 */
import type { CaptionStyleConfig, CaptionPresetId } from './caption-types';
import { CAPTION_PRESETS } from './caption-presets';

export function isLegacyConfig(config: any): boolean {
  if (!config || typeof config !== 'object') return false;
  return typeof config.bgColor === 'string' && typeof config.outline !== 'object';
}

function hasLegacyFontSize(config: any): boolean {
  return config && typeof config.fontSize === 'number' && typeof config.sizeScale !== 'number';
}

function mapPresetId(v1Id: string): CaptionPresetId {
  const mapping: Record<string, CaptionPresetId> = {
    'none': 'none', 'classic': 'classic', 'bouncy': 'classic',
    'liquid-glass': 'modern', 'uppercase': 'punchy',
    'cinema-classic': 'cinematic', 'clean-minimal': 'classic',
    'sophisticated-stuff': 'classic', 'custom': 'custom',
  };
  return (mapping[v1Id] || 'custom') as CaptionPresetId;
}

function parseShadow(textShadow: string): CaptionStyleConfig['shadow'] {
  const disabled: CaptionStyleConfig['shadow'] = {
    enabled: false, color: '#000000', offsetX: 0, offsetY: 0, blur: 0, opacity: 1,
  };
  if (!textShadow) return disabled;
  const m = textShadow.match(
    /(-?\d+(?:\.\d+)?)\s*(?:px)?\s+(-?\d+(?:\.\d+)?)\s*(?:px)?\s+(-?\d+(?:\.\d+)?)\s*(?:px)?\s+(.*)/,
  );
  if (!m) return disabled;
  return { enabled: true, offsetX: parseFloat(m[1]), offsetY: parseFloat(m[2]), blur: parseFloat(m[3]), color: m[4].trim(), opacity: 1 };
}

function parsePadding(padding: string): { x: number; y: number } {
  const parts = padding.replace(/px/g, '').trim().split(/\s+/).map(Number);
  if (parts.length >= 2) return { y: parts[0], x: parts[1] };
  return { x: parts[0] || 24, y: parts[0] || 8 };
}

export function migrateCaptionConfig(config: any): CaptionStyleConfig {
  if (!config) return CAPTION_PRESETS['none'];

  // Already current format
  if (!isLegacyConfig(config) && !hasLegacyFontSize(config)) {
    // Ensure new fields have defaults (for configs saved before autoBreak / mode existed)
    return {
      ...CAPTION_PRESETS['classic'],
      ...config,
      autoBreak: config.autoBreak ?? true,
      sizeScale: config.sizeScale ?? 100,
      wordHighlight: {
        ...CAPTION_PRESETS['classic'].wordHighlight,
        ...config.wordHighlight,
      },
    };
  }

  // v1 flat format
  if (isLegacyConfig(config)) {
    const v1 = config;
    const presetId = mapPresetId(v1.presetId || 'classic');
    const hasBg = v1.bgColor && v1.bgColor !== 'transparent';
    const base = CAPTION_PRESETS[presetId];
    return {
      ...base,
      presetId,
      fontFamily: v1.fontFamily || base.fontFamily,
      fontWeight: v1.fontWeight ?? base.fontWeight,
      sizeScale: v1.fontSize ? Math.round((v1.fontSize / 64) * 100) : base.sizeScale,
      textColor: v1.textColor || base.textColor,
      textTransform: v1.textTransform === 'uppercase' ? 'uppercase' : 'none',
      letterSpacing: v1.letterSpacing ?? 0,
      outline: { enabled: !hasBg, color: '#000000', width: 3, opacity: 1 },
      shadow: parseShadow(v1.textShadow || ''),
      background: {
        enabled: !!hasBg, color: v1.bgColor || 'rgba(0,0,0,0.6)',
        opacity: 60, borderRadius: v1.borderRadius ?? 8,
        padding: parsePadding(v1.padding || '8px 24px'),
      },
      wordHighlight: base.wordHighlight,
      position: { x: v1.textAlign || 'center', y: v1.position || 'bottom', offsetX: 0, offsetY: 0 },
      textAlign: v1.textAlign || 'center',
      autoBreak: true,
    };
  }

  // v2 with old fontSize (px) → sizeScale (%)
  if (hasLegacyFontSize(config)) {
    const { fontSize, ...rest } = config;
    return { ...CAPTION_PRESETS['classic'], ...rest, sizeScale: Math.round((fontSize / 64) * 100), autoBreak: config.autoBreak ?? true };
  }

  return config as CaptionStyleConfig;
}
