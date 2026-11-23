/**
 * Caption types v2 — redesigned primitives based on ElevenLabs analysis.
 *
 * These types live alongside v1 (caption-types.ts). v1 consumers are
 * unaffected. v2 branch will migrate consumers one by one.
 *
 * Key differences from v1:
 * - Outline, shadow, background, wordHighlight are sub-objects (not flat CSS strings)
 * - Position is { x, y, offsetX, offsetY } instead of flat 'top' | 'center' | 'bottom'
 * - Added revealMode for per-word / per-character animation
 * - CaptionBlock gains optional words[] for word-level timing
 */

// ── Text styling primitives ──────────────────────────────────

export interface OutlineConfig {
  enabled: boolean;
  color: string;     // hex
  width: number;     // px
  opacity: number;   // 0-1
}

export interface ShadowConfig {
  enabled: boolean;
  color: string;     // hex with alpha
  offsetX: number;   // px
  offsetY: number;   // px
  blur: number;      // px
  opacity: number;   // 0-1
}

export interface BackgroundConfig {
  enabled: boolean;
  color: string;     // hex or rgba
  opacity: number;   // 0-1
  borderRadius: number; // px
  padding: { x: number; y: number }; // px
}

export interface WordHighlightConfig {
  enabled: boolean;
  mode: 'color' | 'background' | 'box';
  color: string;          // text color when highlighted
  backgroundColor: string; // box/bg color when highlighted
  opacity: number;
}

export interface PositionConfig {
  x: 'left' | 'center' | 'right';
  y: 'top' | 'center' | 'bottom';
  offsetX: number; // % of video width
  offsetY: number; // % of video height
}

// ── Main config ──────────────────────────────────────────────

export type CaptionRevealMode = 'all' | 'one-word-at-a-time' | 'character-by-character';

export type CaptionPresetIdV2 =
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
  | 'handwritten'
  | 'custom';

export interface CaptionStyleConfigV2 {
  presetId: CaptionPresetIdV2;

  // Text
  fontFamily: string;
  fontWeight: number;
  fontSize: number;          // px at 1080p
  textColor: string;         // hex
  textTransform: 'none' | 'uppercase' | 'lowercase';
  letterSpacing: number;     // px

  // Sub-configs
  outline: OutlineConfig;
  shadow: ShadowConfig;
  background: BackgroundConfig;
  wordHighlight: WordHighlightConfig;

  // Layout
  position: PositionConfig;
  maxWidth: number;          // % of video width (0-100)
  maxLines: number;
  maxWordsPerLine: number;
  textAlign: 'left' | 'center' | 'right';

  // Animation
  revealMode: CaptionRevealMode;
}

// ── Word-level timing (for word highlight + reveal animations) ──

export interface CaptionWord {
  text: string;
  start: number; // seconds
  end: number;   // seconds
}

export interface CaptionBlockV2 {
  id: string | number;
  text: string;
  startTime: number;  // seconds
  endTime: number;    // seconds
  words?: CaptionWord[];  // optional — if missing, divide evenly
}
