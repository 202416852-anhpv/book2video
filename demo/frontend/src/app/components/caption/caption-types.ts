// ── Sub-config primitives ────────────────────────────────────

export interface OutlineConfig {
  enabled: boolean;
  color: string;     // hex
  width: number;     // 0-20
  opacity: number;   // 0-1
}

export interface ShadowConfig {
  enabled: boolean;
  color: string;     // hex
  offsetX: number;   // -20 to 20
  offsetY: number;   // -20 to 20
  blur: number;      // 0-20
  opacity: number;   // 0-1
}

export interface BackgroundConfig {
  enabled: boolean;
  color: string;     // hex
  opacity: number;   // 0-100 (%)
  borderRadius: number;
  padding: { x: number; y: number };
}

export interface WordHighlightConfig {
  enabled: boolean;
  color: string;          // text color when highlighted
  backgroundColor: string; // bg color behind highlighted word
  opacity: number;        // 0-1 — bg opacity; 0 = color-only (no background box)
}

export interface PositionConfig {
  x: 'left' | 'center' | 'right';
  y: 'top' | 'center' | 'bottom';
  offsetX: number; // -100 to 100 (%)
  offsetY: number; // -100 to 100 (%)
}

// ── Enums ────────────────────────────────────────────────────

export type CaptionRevealMode = 'all' | 'one-word-at-a-time' | 'character-by-character';

export type CaptionPresetId =
  | 'none'
  | 'classic'
  | 'one-word'
  | 'negative'
  | 'punchy'
  | 'peach'
  | 'hype'
  | 'yellow-highlight'
  | 'bubble'
  | 'modern'
  | 'cinematic'
  | 'meme'
  | 'handwritten'
  | 'custom';

// ── Constants ────────────────────────────────────────────────

/** Base font size in px at 1080p. sizeScale 100% = this value. */
export const CAPTION_BASE_FONT_SIZE = 64;

// ── Main config ──────────────────────────────────────────────

export interface CaptionStyleConfig {
  presetId: CaptionPresetId;

  // Text
  fontFamily: string;
  fontWeight: number;      // 100-900
  sizeScale: number;       // % (100 = base, 200 = 2x, 400 = 4x)
  textColor: string;       // hex
  textTransform: 'none' | 'uppercase' | 'lowercase';
  letterSpacing: number;   // px

  // Sub-configs
  outline: OutlineConfig;
  shadow: ShadowConfig;
  background: BackgroundConfig;
  wordHighlight: WordHighlightConfig;

  // Layout
  position: PositionConfig;
  maxWidth: number;          // 0-100 (% of video width)
  maxLines: number;
  maxWordsPerLine: number;
  autoBreak: boolean;        // true = wrap text, false = single line (clip)
  textAlign: 'left' | 'center' | 'right';

  // Animation
  revealMode: CaptionRevealMode;
}

// ── Word + Block ─────────────────────────────────────────────

export interface CaptionWord {
  text: string;
  start: number;
  end: number;
}

export interface CaptionBlock {
  id: string | number;
  text: string;
  startTime: number;
  endTime: number;
  words?: CaptionWord[];
}

// ── Font metadata ────────────────────────────────────────────

export interface CaptionFontMeta {
  family: string;
  label: string;
  weights: number[];
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting';
}
