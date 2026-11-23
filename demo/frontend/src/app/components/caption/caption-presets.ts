import type { CaptionStyleConfig, CaptionPresetId, CaptionFontMeta } from './caption-types';

// ── Defaults ─────────────────────────────────────────────────

const OFF_OUTLINE: CaptionStyleConfig['outline'] = { enabled: false, color: '#000000', width: 0, opacity: 1 };
const OFF_SHADOW: CaptionStyleConfig['shadow'] = { enabled: false, color: '#000000', offsetX: 0, offsetY: 0, blur: 0, opacity: 1 };
const OFF_BG: CaptionStyleConfig['background'] = { enabled: false, color: '#000000', opacity: 50, borderRadius: 8, padding: { x: 20, y: 10 } };
const OFF_HIGHLIGHT: CaptionStyleConfig['wordHighlight'] = { enabled: false, color: '#ffffff', backgroundColor: '#ffffff', opacity: 0 };

const BASE: CaptionStyleConfig = {
  presetId: 'classic',
  fontFamily: 'Source Sans 3',
  fontWeight: 700,
  sizeScale: 100,
  textColor: '#ffffff',
  textTransform: 'none',
  letterSpacing: 0,
  outline: OFF_OUTLINE,
  shadow: OFF_SHADOW,
  background: OFF_BG,
  wordHighlight: OFF_HIGHLIGHT,
  position: { x: 'center', y: 'bottom', offsetX: 0, offsetY: 0 },
  maxWidth: 80,
  maxLines: 2,
  maxWordsPerLine: 6,
  autoBreak: true,
  textAlign: 'center',
  revealMode: 'all',
};

function p(id: CaptionPresetId, o: Partial<CaptionStyleConfig>): CaptionStyleConfig {
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

// ── 12 Presets (exact values from ElevenLabs DOM extraction) ─

export const CAPTION_PRESETS: Record<CaptionPresetId, CaptionStyleConfig> = {

  'none': p('none', {}),

  // Source Sans 3, bold, uppercase, thick black outline + hard shadow
  'classic': p('classic', {
    fontFamily: 'Source Sans 3',
    fontWeight: 700,
    sizeScale: 400,
    textTransform: 'uppercase',
    outline: { enabled: true, color: '#000000', width: 10.5, opacity: 1 },
    shadow: { enabled: true, color: '#000000', offsetX: 4.4, offsetY: 4.4, blur: 0, opacity: 1 },
    position: { x: 'center', y: 'bottom', offsetX: 0, offsetY: -15 },
    maxWidth: 80, maxLines: 2, maxWordsPerLine: 12,
  }),

  // Montserrat heavy, uppercase, one word at a time, thick outline + hard shadow
  'one-word': p('one-word', {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    sizeScale: 125,
    textTransform: 'uppercase',
    outline: { enabled: true, color: '#000000', width: 10.5, opacity: 1 },
    shadow: { enabled: true, color: '#000000', offsetX: 4.4, offsetY: 4.4, blur: 0, opacity: 1 },
    position: { x: 'center', y: 'center', offsetX: 0, offsetY: 0 },
    maxWidth: 80, maxLines: 1, maxWordsPerLine: 1,
    revealMode: 'one-word-at-a-time',
  }),

  // Montserrat heavy, massive 400% size, one word, no effects
  'negative': p('negative', {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    sizeScale: 400,
    textTransform: 'uppercase',
    position: { x: 'center', y: 'center', offsetX: 0, offsetY: 0 },
    maxWidth: 90, maxLines: 1, maxWordsPerLine: 1,
    revealMode: 'one-word-at-a-time',
  }),

  // Montserrat heavy, yellow text, red outline + red shadow
  'punchy': p('punchy', {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    sizeScale: 115,
    textColor: '#fecc01',
    textTransform: 'uppercase',
    outline: { enabled: true, color: '#c90303', width: 3, opacity: 1 },
    shadow: { enabled: true, color: '#c90303', offsetX: 6, offsetY: 5, blur: 0, opacity: 1 },
    position: { x: 'center', y: 'center', offsetX: 0, offsetY: -5 },
    maxWidth: 85, maxLines: 1, maxWordsPerLine: 5,
  }),

  // Montserrat bold, peach/salmon text, uppercase, one word
  'peach': p('peach', {
    fontFamily: 'Montserrat',
    fontWeight: 700,
    sizeScale: 200,
    textColor: '#ffb07c',
    textTransform: 'uppercase',
    outline: { enabled: true, color: '#000000', width: 2, opacity: 1 },
    shadow: { enabled: true, color: '#000000', offsetX: 4.4, offsetY: 4.4, blur: 0, opacity: 1 },
    position: { x: 'center', y: 'bottom', offsetX: 0, offsetY: -15 },
    maxWidth: 80, maxLines: 1, maxWordsPerLine: 12,
  }),

  // Oswald bold, uppercase, outline + soft shadow, hot pink word highlight
  'hype': p('hype', {
    fontFamily: 'Oswald',
    fontWeight: 700,
    sizeScale: 110,
    textTransform: 'uppercase',
    outline: { enabled: true, color: '#000000', width: 4.4, opacity: 1 },
    shadow: { enabled: true, color: '#000000', offsetX: 5.5, offsetY: 5.5, blur: 5.5, opacity: 1 },
    wordHighlight: { enabled: true, color: '#ffffff', backgroundColor: '#f71c53', opacity: 1 },
    position: { x: 'center', y: 'center', offsetX: 0, offsetY: 15 },
    maxWidth: 70, maxLines: 1, maxWordsPerLine: 5,
  }),

  // Inter heavy, white text, yellow word color highlight (bg opacity 0)
  'yellow-highlight': p('yellow-highlight', {
    fontFamily: 'Inter',
    fontWeight: 900,
    sizeScale: 100,
    outline: { enabled: true, color: '#000000', width: 5, opacity: 1 },
    shadow: { enabled: true, color: '#000000', offsetX: 4.4, offsetY: 4.4, blur: 0, opacity: 1 },
    wordHighlight: { enabled: true, color: '#fff900', backgroundColor: '#ffffff', opacity: 0 },
    position: { x: 'center', y: 'bottom', offsetX: 0, offsetY: 0 },
    maxWidth: 80, maxLines: 2, maxWordsPerLine: 12,
  }),

  // DynaPuff bold, soft shadow, blue word highlight bg
  'bubble': p('bubble', {
    fontFamily: 'DynaPuff',
    fontWeight: 700,
    sizeScale: 100,
    shadow: { enabled: true, color: '#000000', offsetX: 5, offsetY: 5, blur: 5, opacity: 1 },
    wordHighlight: { enabled: true, color: '#ffffff', backgroundColor: '#0077FF', opacity: 0.8 },
    position: { x: 'center', y: 'center', offsetX: 0, offsetY: 0 },
    maxWidth: 90, maxLines: 1, maxWordsPerLine: 6,
  }),

  // Sofia Sans Semi Condensed, subtle white word highlight bg
  'modern': p('modern', {
    fontFamily: 'Sofia Sans Semi Condensed',
    fontWeight: 700,
    sizeScale: 100,
    wordHighlight: { enabled: true, color: '#ffffff', backgroundColor: '#ffffff', opacity: 0.2 },
    position: { x: 'center', y: 'bottom', offsetX: 0, offsetY: -5 },
    maxWidth: 85, maxLines: 2, maxWordsPerLine: 12,
  }),

  // Merriweather serif, golden text, center, character reveal
  'cinematic': p('cinematic', {
    fontFamily: 'Merriweather',
    fontWeight: 700,
    sizeScale: 90,
    textColor: '#FFB223',
    position: { x: 'center', y: 'center', offsetX: 0, offsetY: 0 },
    maxWidth: 70, maxLines: 2, maxWordsPerLine: 6,
    revealMode: 'character-by-character',
  }),

  // Comic Relief bold, black text, white background box
  'meme': p('meme', {
    fontFamily: 'Comic Relief',
    fontWeight: 700,
    sizeScale: 80,
    textColor: '#000000',
    background: { enabled: true, color: '#ffffff', opacity: 95, borderRadius: 8, padding: { x: 20, y: 10 } },
    wordHighlight: { enabled: true, color: '#000000', backgroundColor: '#ffffff', opacity: 0 },
    position: { x: 'center', y: 'center', offsetX: 0, offsetY: 0 },
    maxWidth: 70, maxLines: 1, maxWordsPerLine: 6,
    autoBreak: false,
  }),

  // Caveat handwriting, clean, no effects
  'handwritten': p('handwritten', {
    fontFamily: 'Caveat',
    fontWeight: 700,
    sizeScale: 100,
    position: { x: 'center', y: 'bottom', offsetX: 0, offsetY: -5 },
    maxWidth: 88, maxLines: 2, maxWordsPerLine: 12,
  }),

  'custom': p('custom', {}),
};

// ── Display metadata ─────────────────────────────────────────

export const PRESET_LIST: { id: CaptionPresetId; label: string }[] = [
  { id: 'none',              label: 'None' },
  { id: 'one-word',          label: 'One word after another' },
  { id: 'hype',              label: 'Hype' },
  { id: 'negative',          label: 'Negative' },
  { id: 'punchy',            label: 'Punchy' },
  { id: 'yellow-highlight',  label: 'Yellow highlight' },
  { id: 'peach',             label: 'Peach' },
  { id: 'classic',           label: 'Classic' },
  { id: 'bubble',            label: 'Bubble' },
  { id: 'modern',            label: 'Modern' },
  { id: 'cinematic',         label: 'Cinematic' },
  { id: 'meme',              label: 'Meme' },
  { id: 'handwritten',       label: 'Handwritten' },
];

// ── Font metadata ────────────────────────────────────────────

export const CAPTION_FONTS: CaptionFontMeta[] = [
  { family: 'Source Sans 3',              label: 'Source Sans 3',              weights: [400, 600, 700, 900], category: 'sans-serif' },
  { family: 'Montserrat',                 label: 'Montserrat',                 weights: [500, 600, 700, 800, 900], category: 'sans-serif' },
  { family: 'Inter',                      label: 'Inter',                      weights: [400, 500, 600, 700, 800, 900], category: 'sans-serif' },
  { family: 'Oswald',                     label: 'Oswald',                     weights: [400, 500, 600, 700], category: 'sans-serif' },
  { family: 'Poppins',                    label: 'Poppins',                    weights: [400, 500, 600, 700, 800, 900], category: 'sans-serif' },
  { family: 'Roboto',                     label: 'Roboto',                     weights: [400, 500, 700, 900], category: 'sans-serif' },
  { family: 'Lato',                       label: 'Lato',                       weights: [300, 400, 700, 900], category: 'sans-serif' },
  { family: 'Sofia Sans Semi Condensed',  label: 'Sofia Sans Semi Condensed',  weights: [400, 600, 700], category: 'sans-serif' },
  { family: 'Merriweather',               label: 'Merriweather',               weights: [400, 700, 900], category: 'serif' },
  { family: 'Playfair Display',           label: 'Playfair Display',           weights: [400, 500, 600, 700], category: 'serif' },
  { family: 'DynaPuff',                   label: 'DynaPuff',                   weights: [400, 500, 600, 700], category: 'display' },
  { family: 'Comic Relief',              label: 'Comic Relief',              weights: [400, 700], category: 'display' },
  { family: 'Caveat',                     label: 'Caveat',                     weights: [400, 500, 600, 700], category: 'handwriting' },
  { family: 'Dancing Script',             label: 'Dancing Script',             weights: [400, 500, 600, 700], category: 'handwriting' },
  { family: 'Bebas Neue',                 label: 'Bebas Neue',                 weights: [400], category: 'display' },
];
