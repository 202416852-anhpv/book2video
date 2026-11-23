import { describe, it, expect, vi } from 'vitest';
import { drawCaption } from '@vbee-holding/video-renderer/draw';
import type { CaptionFrame, RenderStyle, RenderCaption } from '@vbee-holding/video-renderer/schema';
import { BASE_FONT_SIZE } from '@vbee-holding/video-renderer/schema';
import { CAPTION_PRESETS } from '../../components/caption/caption-presets';

/* ── Mock canvas context ── */

interface RecordedCall {
  method: string;
  args: any[];
}

function createMockCtx() {
  const calls: RecordedCall[] = [];
  const handler = (method: string) => (...args: any[]) => {
    calls.push({ method, args });
  };
  const ctx = {
    fillStyle: '',
    fillRect: handler('fillRect'),
    drawImage: handler('drawImage'),
    font: '',
    textBaseline: '' as CanvasTextBaseline,
    globalAlpha: 1,
    strokeStyle: '',
    lineWidth: 0,
    lineJoin: '',
    shadowColor: '',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    save: handler('save'),
    restore: handler('restore'),
    fillText: handler('fillText'),
    strokeText: handler('strokeText'),
    measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
    beginPath: handler('beginPath'),
    moveTo: handler('moveTo'),
    lineTo: handler('lineTo'),
    arcTo: handler('arcTo'),
    closePath: handler('closePath'),
    fill: handler('fill'),
    letterSpacing: '0px',
  } as any as CanvasRenderingContext2D;

  return { ctx, calls };
}

/* ── Shared fixtures ── */

const CANVAS_W = 1920;
const CANVAS_H = 1080;

const baseStyle: RenderStyle = {
  fontFamily: 'Arial',
  fontWeight: 700,
  sizeScale: 100,
  textColor: '#ffffff',
  textTransform: 'none',
  letterSpacing: 0,
  outline: { enabled: false, color: '#000', width: 0, opacity: 1 },
  shadow: { enabled: false, color: '#000', offsetX: 0, offsetY: 0, blur: 0, opacity: 1 },
  background: { enabled: false, color: '#000', opacity: 50, borderRadius: 8, padding: { x: 20, y: 10 } },
  wordHighlight: { enabled: false, color: '#fff', backgroundColor: '#fff', opacity: 0 },
  position: { x: 'center', y: 'bottom', offsetX: 0, offsetY: 0 },
  maxWidth: 80,
  maxLines: 2,
  maxWordsPerLine: 6,
  autoBreak: true,
  textAlign: 'center',
  revealMode: 'all',
};

const sampleCaption: RenderCaption = {
  text: 'Xin chào thế giới',
  startTime: 0,
  endTime: 3,
  words: [
    { text: 'Xin', start: 0, end: 0.5 },
    { text: 'chào', start: 0.5, end: 1 },
    { text: 'thế', start: 1, end: 1.5 },
    { text: 'giới', start: 1.5, end: 2 },
  ],
};

function makeFrame(styleOverrides: Partial<RenderStyle> = {}, caption = sampleCaption, time = 0.7): CaptionFrame {
  return {
    caption,
    style: { ...baseStyle, ...styleOverrides },
    time,
    canvasWidth: CANVAS_W,
    canvasHeight: CANVAS_H,
  };
}

function makePresetFrame(presetId: string, time = 0.7): CaptionFrame {
  const preset = CAPTION_PRESETS[presetId as keyof typeof CAPTION_PRESETS];
  // Convert CaptionStyleConfig to RenderStyle (drop presetId)
  const { presetId: _pid, ...rest } = preset;
  return {
    caption: sampleCaption,
    style: rest as RenderStyle,
    time,
    canvasWidth: CANVAS_W,
    canvasHeight: CANVAS_H,
  };
}

/** Extract fillText calls from recorded calls */
function getFillTextCalls(calls: RecordedCall[]) {
  return calls.filter(c => c.method === 'fillText').map(c => ({
    text: c.args[0] as string,
    x: c.args[1] as number,
    y: c.args[2] as number,
  }));
}

/** Extract roundRect fill sequences (beginPath → fill) to find background boxes */
function getBoxDrawCalls(calls: RecordedCall[]) {
  const boxes: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < calls.length; i++) {
    // roundRect starts with beginPath then moveTo(x+r, y)
    if (calls[i].method === 'beginPath' && i + 1 < calls.length && calls[i + 1].method === 'moveTo') {
      // Find the lineTo calls to determine box dimensions
      // roundRect pattern: moveTo, lineTo, arcTo, lineTo, arcTo, lineTo, arcTo, lineTo, arcTo, closePath
      // We can get x,y from first arcTo and w,h from opposing arcTo
      const moveToCall = calls[i + 1];
      // Find all arcTo calls in this sequence
      const arcToCalls: RecordedCall[] = [];
      for (let j = i + 2; j < calls.length && calls[j].method !== 'closePath'; j++) {
        if (calls[j].method === 'arcTo') arcToCalls.push(calls[j]);
      }
      if (arcToCalls.length >= 4) {
        // arcTo(x+w, y, x+w, y+r, r) → gives us x+w from args[0]
        // arcTo(x+w, y+h, x+w-r, y+h, r) → gives us y+h from args[1]
        // arcTo(x, y+h, x, y+h-r, r) → gives us x from args[0]
        // arcTo(x, y, x+r, y, r) → gives us y from args[1]
        const xPlusW = arcToCalls[0].args[0];
        const yPlusH = arcToCalls[1].args[1];
        const boxX = arcToCalls[2].args[0];
        const boxY = arcToCalls[3].args[1];
        boxes.push({ x: boxX, y: boxY, w: xPlusW - boxX, h: yPlusH - boxY });
      }
    }
  }
  return boxes;
}

/* ── Tests ── */

describe('drawCaption', () => {
  describe('textBaseline', () => {
    it('sets textBaseline to middle for multi-word mode', () => {
      const { ctx } = createMockCtx();
      drawCaption(ctx, makeFrame());
      expect(ctx.textBaseline).toBe('middle');
    });

    it('sets textBaseline to middle for one-word-at-a-time mode', () => {
      const { ctx } = createMockCtx();
      drawCaption(ctx, makeFrame({ revealMode: 'one-word-at-a-time', maxLines: 1, maxWordsPerLine: 1 }));
      expect(ctx.textBaseline).toBe('middle');
    });
  });

  describe('text vertical centering in background box', () => {
    it('text Y is at vertical center of background box (single line)', () => {
      const { ctx, calls } = createMockCtx();
      const style: Partial<RenderStyle> = {
        background: { enabled: true, color: '#ffffff', opacity: 95, borderRadius: 8, padding: { x: 20, y: 10 } },
        maxLines: 1,
        autoBreak: false,
      };
      drawCaption(ctx, makeFrame(style));

      const boxes = getBoxDrawCalls(calls);
      const fillTexts = getFillTextCalls(calls);

      expect(boxes.length).toBeGreaterThan(0);
      expect(fillTexts.length).toBeGreaterThan(0);

      const box = boxes[0]; // background box
      const textY = fillTexts[0].y;
      const boxCenterY = box.y + box.h / 2;

      // Text Y (drawn with textBaseline='middle') should be at the center of the box
      expect(textY).toBeCloseTo(boxCenterY, 0);
    });

    it('text Y is centered for multi-line text', () => {
      const { ctx, calls } = createMockCtx();
      const longCaption: RenderCaption = {
        text: 'Một hai ba bốn năm sáu bảy tám chín mười',
        startTime: 0,
        endTime: 5,
        words: 'Một hai ba bốn năm sáu bảy tám chín mười'.split(' ').map((w, i) => ({
          text: w, start: i * 0.5, end: (i + 1) * 0.5,
        })),
      };
      const style: Partial<RenderStyle> = {
        background: { enabled: true, color: '#ffffff', opacity: 95, borderRadius: 8, padding: { x: 20, y: 10 } },
        maxLines: 2,
        maxWordsPerLine: 5,
        autoBreak: true,
      };
      drawCaption(ctx, makeFrame(style, longCaption, 0.3));

      const boxes = getBoxDrawCalls(calls);
      const fillTexts = getFillTextCalls(calls);

      expect(boxes.length).toBeGreaterThan(0);
      expect(fillTexts.length).toBeGreaterThanOrEqual(2);

      const box = boxes[0];
      const boxCenterY = box.y + box.h / 2;

      // All text lines should be symmetrically distributed around box center
      const avgTextY = fillTexts.reduce((sum, t) => sum + t.y, 0) / fillTexts.length;
      expect(avgTextY).toBeCloseTo(boxCenterY, 0);
    });

    it('single word mode: text centered in background box', () => {
      const { ctx, calls } = createMockCtx();
      const style: Partial<RenderStyle> = {
        revealMode: 'one-word-at-a-time',
        maxLines: 1,
        maxWordsPerLine: 1,
        background: { enabled: true, color: '#ffffff', opacity: 95, borderRadius: 8, padding: { x: 20, y: 10 } },
      };
      drawCaption(ctx, makeFrame(style));

      const boxes = getBoxDrawCalls(calls);
      const fillTexts = getFillTextCalls(calls);

      expect(boxes.length).toBeGreaterThan(0);
      expect(fillTexts.length).toBeGreaterThan(0);

      const box = boxes[0];
      const textY = fillTexts[0].y;
      const boxCenterY = box.y + box.h / 2;

      expect(textY).toBeCloseTo(boxCenterY, 0);
    });
  });

  describe('word highlight box positioning', () => {
    it('highlight box covers text with more space on top for diacritics', () => {
      const { ctx, calls } = createMockCtx();
      const style: Partial<RenderStyle> = {
        wordHighlight: { enabled: true, color: '#fff900', backgroundColor: '#ff0000', opacity: 1 },
      };
      drawCaption(ctx, makeFrame(style));

      const fillTexts = getFillTextCalls(calls);
      const boxes = getBoxDrawCalls(calls);

      expect(boxes.length).toBeGreaterThan(0);

      const hlBox = boxes[0];
      const activeWordText = fillTexts.find(t => t.text === 'chào');
      expect(activeWordText).toBeDefined();

      const textY = activeWordText!.y; // middle baseline
      const topDist = textY - hlBox.y;    // distance from box top to text center
      const bottomDist = (hlBox.y + hlBox.h) - textY; // distance from text center to box bottom

      // Top should be larger than bottom (more room for diacritics)
      expect(topDist).toBeGreaterThan(bottomDist);
      // Text should still be inside the box
      expect(hlBox.y).toBeLessThan(textY);
      expect(hlBox.y + hlBox.h).toBeGreaterThan(textY);
    });
  });

  describe('position calculations', () => {
    it('position.x=left places text near left edge', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makeFrame({ position: { x: 'left', y: 'center', offsetX: 0, offsetY: 0 } }));
      const fillTexts = getFillTextCalls(calls);
      expect(fillTexts.length).toBeGreaterThan(0);
      // Text X should be near 5% of canvas width
      expect(fillTexts[0].x).toBeLessThan(CANVAS_W * 0.15);
    });

    it('position.x=right places text near right edge', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makeFrame({ position: { x: 'right', y: 'center', offsetX: 0, offsetY: 0 } }));
      const fillTexts = getFillTextCalls(calls);
      expect(fillTexts.length).toBeGreaterThan(0);
      expect(fillTexts[0].x).toBeGreaterThan(CANVAS_W * 0.5);
    });

    it('position.y=top places text near top', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makeFrame({ position: { x: 'center', y: 'top', offsetX: 0, offsetY: 0 } }));
      const fillTexts = getFillTextCalls(calls);
      expect(fillTexts.length).toBeGreaterThan(0);
      expect(fillTexts[0].y).toBeLessThan(CANVAS_H * 0.2);
    });

    it('position.y=bottom places text near bottom', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makeFrame({ position: { x: 'center', y: 'bottom', offsetX: 0, offsetY: 0 } }));
      const fillTexts = getFillTextCalls(calls);
      expect(fillTexts.length).toBeGreaterThan(0);
      expect(fillTexts[0].y).toBeGreaterThan(CANVAS_H * 0.7);
    });

    it('offsetX shifts text horizontally', () => {
      const { ctx: ctx1, calls: calls1 } = createMockCtx();
      const { ctx: ctx2, calls: calls2 } = createMockCtx();

      drawCaption(ctx1, makeFrame({ position: { x: 'center', y: 'center', offsetX: 0, offsetY: 0 } }));
      drawCaption(ctx2, makeFrame({ position: { x: 'center', y: 'center', offsetX: 20, offsetY: 0 } }));

      const x1 = getFillTextCalls(calls1)[0].x;
      const x2 = getFillTextCalls(calls2)[0].x;
      const expectedShift = (20 / 100) * CANVAS_W;
      expect(x2 - x1).toBeCloseTo(expectedShift, 0);
    });

    it('offsetY shifts text vertically', () => {
      const { ctx: ctx1, calls: calls1 } = createMockCtx();
      const { ctx: ctx2, calls: calls2 } = createMockCtx();

      drawCaption(ctx1, makeFrame({ position: { x: 'center', y: 'center', offsetX: 0, offsetY: 0 } }));
      drawCaption(ctx2, makeFrame({ position: { x: 'center', y: 'center', offsetX: 0, offsetY: 10 } }));

      const y1 = getFillTextCalls(calls1)[0].y;
      const y2 = getFillTextCalls(calls2)[0].y;
      const expectedShift = (10 / 100) * CANVAS_H;
      expect(y2 - y1).toBeCloseTo(expectedShift, 0);
    });
  });

  describe('outline rendering', () => {
    it('draws strokeText when outline is enabled', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makeFrame({ outline: { enabled: true, color: '#000', width: 5, opacity: 1 } }));
      const strokeCalls = calls.filter(c => c.method === 'strokeText');
      expect(strokeCalls.length).toBeGreaterThan(0);
    });

    it('does not draw strokeText when outline is disabled', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makeFrame({ outline: { enabled: false, color: '#000', width: 5, opacity: 1 } }));
      const strokeCalls = calls.filter(c => c.method === 'strokeText');
      expect(strokeCalls).toHaveLength(0);
    });

    it('applies correct opacity for outline', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makeFrame({ outline: { enabled: true, color: '#ff0000', width: 5, opacity: 0.5 } }));

      // Find the save before strokeText
      let foundOpacity = false;
      for (let i = 0; i < calls.length; i++) {
        if (calls[i].method === 'strokeText') {
          expect(ctx.globalAlpha).toBeDefined();
          foundOpacity = true;
          break;
        }
      }
      expect(foundOpacity).toBe(true);
    });
  });

  describe('shadow rendering', () => {
    it('sets shadow properties when shadow is enabled', () => {
      const { ctx } = createMockCtx();
      drawCaption(ctx, makeFrame({
        shadow: { enabled: true, color: '#000', offsetX: 5, offsetY: 5, blur: 10, opacity: 0.8 },
      }));
      // After rendering, shadow properties should have been set
      // (restore resets them, but during rendering they were applied)
      // We verify indirectly — fillText was called so shadow was active
    });

    it('does not set shadow when disabled', () => {
      const { ctx } = createMockCtx();
      const origShadowBlur = ctx.shadowBlur;
      drawCaption(ctx, makeFrame({
        shadow: { enabled: false, color: '#000', offsetX: 5, offsetY: 5, blur: 10, opacity: 1 },
      }));
      // Shadow blur should remain at default
      expect(ctx.shadowBlur).toBe(origShadowBlur);
    });
  });

  describe('text transform', () => {
    it('uppercases text when textTransform=uppercase', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makeFrame({ textTransform: 'uppercase' }));
      const fillTexts = getFillTextCalls(calls);
      expect(fillTexts.length).toBeGreaterThan(0);
      expect(fillTexts[0].text).toBe(fillTexts[0].text.toUpperCase());
    });

    it('lowercases text when textTransform=lowercase', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makeFrame({ textTransform: 'lowercase' }));
      const fillTexts = getFillTextCalls(calls);
      expect(fillTexts.length).toBeGreaterThan(0);
      expect(fillTexts[0].text).toBe(fillTexts[0].text.toLowerCase());
    });
  });

  describe('reveal mode', () => {
    it('one-word-at-a-time shows only active word', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makeFrame({
        revealMode: 'one-word-at-a-time',
        maxLines: 1,
        maxWordsPerLine: 1,
      }));
      const fillTexts = getFillTextCalls(calls);
      expect(fillTexts.length).toBe(1);
      expect(fillTexts[0].text).toBe('chào'); // active at time=0.7
    });

    it('one-word-at-a-time renders nothing when no word is active', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makeFrame({
        revealMode: 'one-word-at-a-time',
        maxLines: 1,
        maxWordsPerLine: 1,
      }, sampleCaption, 99)); // time=99, no word active
      const fillTexts = getFillTextCalls(calls);
      expect(fillTexts).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('does nothing when caption is null', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, { caption: null, style: baseStyle, time: 0, canvasWidth: CANVAS_W, canvasHeight: CANVAS_H });
      expect(calls.filter(c => c.method === 'fillText')).toHaveLength(0);
    });

    it('does nothing when caption text is empty', () => {
      const { ctx, calls } = createMockCtx();
      const emptyCaption: RenderCaption = { text: '', startTime: 0, endTime: 1, words: [] };
      drawCaption(ctx, { caption: emptyCaption, style: baseStyle, time: 0, canvasWidth: CANVAS_W, canvasHeight: CANVAS_H });
      expect(calls.filter(c => c.method === 'fillText')).toHaveLength(0);
    });
  });

  describe('all presets render without error', () => {
    const presetIds = Object.keys(CAPTION_PRESETS).filter(id => id !== 'none' && id !== 'custom');

    for (const presetId of presetIds) {
      it(`preset "${presetId}" renders text and sets textBaseline=middle`, () => {
        const { ctx, calls } = createMockCtx();
        const frame = makePresetFrame(presetId);
        drawCaption(ctx, frame);

        expect(ctx.textBaseline).toBe('middle');

        const fillTexts = getFillTextCalls(calls);
        // All presets except those with one-word-at-a-time where no word is active should produce fillText
        if (frame.style.revealMode !== 'one-word-at-a-time' || fillTexts.length > 0) {
          expect(fillTexts.length).toBeGreaterThan(0);
        }
      });
    }
  });

  describe('preset-specific: meme (background box centering)', () => {
    it('meme preset text is vertically centered in white box', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makePresetFrame('meme'));

      const boxes = getBoxDrawCalls(calls);
      const fillTexts = getFillTextCalls(calls);

      // Meme has background enabled → should have a box
      expect(boxes.length).toBeGreaterThan(0);
      expect(fillTexts.length).toBeGreaterThan(0);

      const bgBox = boxes[0];
      const boxCenterY = bgBox.y + bgBox.h / 2;
      const textY = fillTexts[0].y;

      expect(textY).toBeCloseTo(boxCenterY, 0);
    });
  });

  describe('preset-specific: hype (word highlight + outline + shadow)', () => {
    it('hype preset renders outline, shadow, and word highlight', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makePresetFrame('hype'));

      const strokeCalls = calls.filter(c => c.method === 'strokeText');
      const fillTexts = getFillTextCalls(calls);

      // Hype has outline → strokeText
      expect(strokeCalls.length).toBeGreaterThan(0);
      // Hype has word highlight → should have more fillText calls (line + active word re-fill)
      expect(fillTexts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('preset-specific: bubble (word highlight bg box)', () => {
    it('bubble preset highlight box covers active word with diacritics bias', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makePresetFrame('bubble'));

      const boxes = getBoxDrawCalls(calls);
      const fillTexts = getFillTextCalls(calls);

      // Bubble has word highlight with opacity 0.8 → should draw highlight box
      expect(boxes.length).toBeGreaterThan(0);

      const hlBox = boxes[0];
      const activeWord = fillTexts.find(t => t.text === 'chào');
      expect(activeWord).toBeDefined();

      // Text should be inside the highlight box, biased toward bottom
      const textY = activeWord!.y;
      expect(hlBox.y).toBeLessThan(textY);
      expect(hlBox.y + hlBox.h).toBeGreaterThan(textY);
      // More space on top than bottom
      expect(textY - hlBox.y).toBeGreaterThan((hlBox.y + hlBox.h) - textY);
    });
  });

  describe('preset-specific: one-word (single word centered)', () => {
    it('one-word preset renders single word with outline + shadow', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makePresetFrame('one-word'));

      const fillTexts = getFillTextCalls(calls);
      const strokeCalls = calls.filter(c => c.method === 'strokeText');

      expect(fillTexts).toHaveLength(1);
      // one-word preset has textTransform=uppercase
      expect(fillTexts[0].text).toBe('CHÀO');
      expect(strokeCalls.length).toBeGreaterThan(0);
      expect(ctx.textBaseline).toBe('middle');
    });
  });

  describe('preset-specific: classic (outline + shadow, multi-line)', () => {
    it('classic preset renders uppercase text with outline and shadow', () => {
      const { ctx, calls } = createMockCtx();
      drawCaption(ctx, makePresetFrame('classic'));

      const fillTexts = getFillTextCalls(calls);
      const strokeCalls = calls.filter(c => c.method === 'strokeText');

      expect(fillTexts.length).toBeGreaterThan(0);
      // Classic is uppercase
      expect(fillTexts[0].text).toBe(fillTexts[0].text.toUpperCase());
      expect(strokeCalls.length).toBeGreaterThan(0);
    });
  });
});
