/**
 * Caption presets v2 — 10 presets based on ElevenLabs template analysis.
 *
 * Sits alongside v1 presets (caption-presets.ts). v1 consumers unaffected.
 * v2 branch will switch selector/editor to import from here.
 */
import type { CaptionStyleConfigV2, CaptionPresetIdV2 } from './caption-types-v2';

// ── Defaults ─────────────────────────────────────────────────

const DEFAULT_OUTLINE: CaptionStyleConfigV2['outline'] = {
  enabled: false, color: '#000000', width: 3, opacity: 0.8,
};

const DEFAULT_SHADOW: CaptionStyleConfigV2['shadow'] = {
  enabled: false, color: 'rgba(0,0,0,0.5)', offsetX: 0, offsetY: 2, blur: 4, opacity: 0.5,
};

const DEFAULT_BG: CaptionStyleConfigV2['background'] = {
  enabled: true, color: 'rgba(0,0,0,0.6)', opacity: 1, borderRadius: 8, padding: { x: 24, y: 8 },
};

const DEFAULT_HIGHLIGHT: CaptionStyleConfigV2['wordHighlight'] = {
  enabled: false, mode: 'color', color: '#FFFFFF', backgroundColor: '#FFFF00', opacity: 1,
};

const DEFAULT_POSITION: CaptionStyleConfigV2['position'] = {
  x: 'center', y: 'bottom', offsetX: 0, offsetY: 5,
};

const BASE: CaptionStyleConfigV2 = {
  presetId: 'classic',
  fontFamily: 'Poppins',
  fontWeight: 600,
  fontSize: 72,
  textColor: '#FFFFFF',
  textTransform: 'none',
  letterSpacing: 0,
  outline: DEFAULT_OUTLINE,
  shadow: DEFAULT_SHADOW,
  background: DEFAULT_BG,
  wordHighlight: DEFAULT_HIGHLIGHT,
  position: DEFAULT_POSITION,
  maxWidth: 90,
  maxLines: 2,
  maxWordsPerLine: 8,
  textAlign: 'center',
  revealMode: 'all',
};

function preset(id: CaptionPresetIdV2, o: Partial<CaptionStyleConfigV2>): CaptionStyleConfigV2 {
  return {
    ...BASE,
    ...o,
    presetId: id,
    outline: { ...BASE.outline, ...(o.outline ?? {}) },
    shadow: { ...BASE.shadow, ...(o.shadow ?? {}) },
    background: { ...BASE.background, ...(o.background ?? {}) },
    wordHighlight: { ...BASE.wordHighlight, ...(o.wordHighlight ?? {}) },
    position: { ...BASE.position, ...(o.position ?? {}) },
  };
}

// ── 10 Presets + none + custom ───────────────────────────────

export const CAPTION_PRESETS_V2: Record<CaptionPresetIdV2, CaptionStyleConfigV2> = {
  'none': preset('none', {}),

  'classic': preset('classic', {
    outline: { enabled: true, color: '#000000', width: 3, opacity: 0.8 },
    shadow: { enabled: true, color: 'rgba(0,0,0,0.8)', offsetX: 0, offsetY: 2, blur: 6, opacity: 0.8 },
    background: { ...DEFAULT_BG, enabled: false },
  }),

  'one-word': preset('one-word', {
    fontSize: 96,
    fontWeight: 700,
    revealMode: 'one-word-at-a-time',
    outline: { enabled: true, color: '#000000', width: 4, opacity: 0.9 },
    background: { ...DEFAULT_BG, enabled: false },
  }),

  'negative': preset('negative', {
    fontSize: 120,
    fontWeight: 900,
    revealMode: 'one-word-at-a-time',
    background: { ...DEFAULT_BG, enabled: false },
    outline: { enabled: true, color: '#000000', width: 4, opacity: 0.9 },
  }),

  'punchy': preset('punchy', {
    fontFamily: 'Montserrat',
    textColor: '#FFCC00',
    textTransform: 'uppercase',
    fontWeight: 800,
    outline: { enabled: true, color: '#000000', width: 8, opacity: 1 },
    background: { ...DEFAULT_BG, enabled: false },
  }),

  'peach': preset('peach', {
    textColor: '#FFB380',
    textTransform: 'uppercase',
    fontWeight: 700,
    outline: { enabled: true, color: '#FFFFFF', width: 4, opacity: 0.9 },
    background: { ...DEFAULT_BG, enabled: false },
  }),

  'hype': preset('hype', {
    fontWeight: 700,
    textTransform: 'uppercase',
    wordHighlight: { enabled: true, mode: 'box', color: '#FFFFFF', backgroundColor: '#FF0000', opacity: 1 },
    outline: { enabled: true, color: '#000000', width: 3, opacity: 0.8 },
    background: { ...DEFAULT_BG, enabled: false },
  }),

  'yellow-highlight': preset('yellow-highlight', {
    fontWeight: 600,
    textColor: '#000000',
    wordHighlight: { enabled: true, mode: 'background', color: '#000000', backgroundColor: '#FFFF00', opacity: 1 },
    background: { ...DEFAULT_BG, enabled: false },
    outline: { enabled: true, color: '#FFFFFF', width: 2, opacity: 0.6 },
  }),

  'bubble': preset('bubble', {
    fontFamily: 'Fredoka',
    fontWeight: 600,
    wordHighlight: { enabled: true, mode: 'background', color: '#FFFFFF', backgroundColor: '#00AAFF', opacity: 1 },
    background: { ...DEFAULT_BG, enabled: false },
  }),

  'modern': preset('modern', {
    fontWeight: 600,
    wordHighlight: { enabled: true, mode: 'background', color: '#FFFFFF', backgroundColor: '#000000', opacity: 0.85 },
    background: { ...DEFAULT_BG, enabled: false },
  }),

  'handwritten': preset('handwritten', {
    fontFamily: 'Dancing Script',
    fontWeight: 600,
    fontSize: 80,
    shadow: { enabled: true, color: 'rgba(0,0,0,0.6)', offsetX: 0, offsetY: 2, blur: 8, opacity: 0.6 },
    background: { ...DEFAULT_BG, enabled: false },
  }),

  'custom': preset('custom', {}),
};

// ── Preset display metadata ──────────────────────────────────

export const PRESET_LIST_V2: { id: CaptionPresetIdV2; label: string }[] = [
  { id: 'none',              label: 'Không áp dụng' },
  { id: 'classic',           label: 'Cơ bản' },
  { id: 'one-word',          label: 'Từng từ' },
  { id: 'negative',          label: 'Nổi bật' },
  { id: 'punchy',            label: 'Mạnh mẽ' },
  { id: 'peach',             label: 'Đào' },
  { id: 'hype',              label: 'Sôi động' },
  { id: 'yellow-highlight',  label: 'Tô sáng' },
  { id: 'bubble',            label: 'Bong bóng' },
  { id: 'modern',            label: 'Hiện đại' },
  { id: 'handwritten',       label: 'Viết tay' },
  { id: 'custom',            label: 'Tùy chỉnh' },
];

// ── Font metadata (extended for v2 presets) ──────────────────

export { CAPTION_FONTS } from './caption-presets'; // re-export v1 fonts

export const CAPTION_FONTS_V2_ADDITIONS = [
  { family: 'Fredoka',          label: 'Fredoka',          weights: [400, 500, 600, 700], category: 'display' as const },
  { family: 'Dancing Script',   label: 'Dancing Script',   weights: [400, 500, 600, 700], category: 'display' as const },
];
