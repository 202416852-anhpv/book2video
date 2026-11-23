import type { RenderStyle, RenderCaption } from './schema';

export function drawCaptionFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    source?: {
      video?: HTMLVideoElement | null;
      mediaOverlay?: HTMLImageElement | null;
      bgColor?: string;
    };
    caption?: RenderCaption | null;
    captionStyle?: RenderStyle;
    time?: number;
  }
) {
  const { source, caption, captionStyle, time = 0 } = options;

  // Clear or background
  if (source?.bgColor) {
    ctx.fillStyle = source.bgColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  // Draw video frame if available
  if (source?.video && source.video.readyState >= 2) {
    try {
      ctx.drawImage(source.video, 0, 0, width, height);
    } catch (e) {
      // ignore draw error
    }
  }

  // Draw image mediaOverlay if available
  if (source?.mediaOverlay && source.mediaOverlay.complete) {
    try {
      ctx.drawImage(source.mediaOverlay, 0, 0, width, height);
    } catch (e) {
      // ignore draw error
    }
  }

  // Draw caption text
  if (caption && caption.text && captionStyle) {
    ctx.save();
    const fontSize = ((captionStyle.sizeScale ?? 100) / 100) * 36;
    ctx.font = `${captionStyle.fontWeight || 'normal'} ${fontSize}px ${captionStyle.fontFamily || 'sans-serif'}`;
    ctx.fillStyle = captionStyle.textColor || '#ffffff';
    ctx.textAlign = (captionStyle.textAlign as CanvasTextAlign) || 'center';
    ctx.textBaseline = 'middle';

    const x = width / 2;
    const y = height * 0.85;

    if (captionStyle.outline?.enabled) {
      ctx.strokeStyle = captionStyle.outline.color || '#000000';
      ctx.lineWidth = captionStyle.outline.width || 2;
      ctx.strokeText(caption.text, x, y);
    }

    ctx.fillText(caption.text, x, y);
    ctx.restore();
  }
}

export function drawCaption(ctx: any, frame: any, style: any, bounds: any) {
  // stub for tests if needed
}

export function measureAndWrapText(ctx: any, words: string[], style: any, maxWidth: number, scale: number) {
  return [{ text: words.join(' '), words }];
}
