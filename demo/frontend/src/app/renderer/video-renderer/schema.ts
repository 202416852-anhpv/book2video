export const BASE_FONT_SIZE = 64;

export interface RenderStyle {
  fontFamily?: string;
  fontWeight?: number | string;
  sizeScale?: number;
  textColor?: string;
  textTransform?: string;
  letterSpacing?: number;
  outline?: { enabled: boolean; color: string; width: number; opacity: number };
  shadow?: { enabled: boolean; color: string; offsetX: number; offsetY: number; blur: number; opacity: number };
  background?: { enabled: boolean; color: string; opacity: number; borderRadius: number; padding: { x: number; y: number } };
  wordHighlight?: { enabled: boolean; color: string; backgroundColor: string; opacity: number };
  position?: { x: string; y: string; offsetX: number; offsetY: number };
  maxWidth?: number;
  maxLines?: number;
  maxWordsPerLine?: number;
  autoBreak?: boolean;
  textAlign?: string;
  revealMode?: string;
  [key: string]: any;
}

export interface RenderCaption {
  text?: string;
  startTime?: number;
  endTime?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
  [key: string]: any;
}

export interface Timeline {
  [key: string]: any;
}

export interface Track {
  [key: string]: any;
}
