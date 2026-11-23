import { describe, it, expect, vi } from 'vitest';
import { drawCaptionFrame as drawFrame, type FrameData, type FrameSource } from '@vbee-holding/video-renderer/draw';
import type { RenderStyle } from '@vbee-holding/video-renderer/schema';

/* ── Mock canvas context ── */

interface RecordedCall { method: string; args: any[] }

function createMockCtx() {
  const calls: RecordedCall[] = [];
  const handler = (method: string) => (...args: any[]) => { calls.push({ method, args }); };
  return {
    calls,
    ctx: {
      fillStyle: '',
      fillRect: handler('fillRect'),
      drawImage: handler('drawImage'),
      font: '',
      textBaseline: '',
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
      measureText: vi.fn(() => ({ width: 50 })),
      beginPath: handler('beginPath'),
      moveTo: handler('moveTo'),
      lineTo: handler('lineTo'),
      arcTo: handler('arcTo'),
      closePath: handler('closePath'),
      fill: handler('fill'),
      letterSpacing: '0px',
    } as any as CanvasRenderingContext2D,
  };
}

/* ── Shared fixtures ── */

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

function fakeVideo(w: number, h: number) {
  return { videoWidth: w, videoHeight: h, width: w, height: h } as HTMLVideoElement;
}

function fakeImage(w: number, h: number) {
  return { width: w, height: h } as HTMLImageElement;
}

function getDrawImageCalls(calls: RecordedCall[]) {
  return calls.filter(c => c.method === 'drawImage').map(c => ({
    source: c.args[0],
    dx: c.args[1] as number,
    dy: c.args[2] as number,
    dw: c.args[3] as number,
    dh: c.args[4] as number,
  }));
}

function getFillTextCalls(calls: RecordedCall[]) {
  return calls.filter(c => c.method === 'fillText');
}

/* ── Tests ── */

describe('drawFrame', () => {

  describe('background', () => {
    it('fills background color first', () => {
      const { ctx, calls } = createMockCtx();
      drawFrame(ctx, 1920, 1080, {
        source: { video: null, mediaOverlay: null, bgColor: '#111111' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      expect(calls[0].method).toBe('fillRect');
      expect((ctx as any).fillStyle).toBe('#111111');
    });

    it('fills background even when video and overlay are present', () => {
      const { ctx, calls } = createMockCtx();
      drawFrame(ctx, 1920, 1080, {
        source: { video: fakeVideo(1920, 1080), mediaOverlay: fakeImage(800, 600), bgColor: '#ff0000' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      expect(calls[0].method).toBe('fillRect');
    });
  });

  describe('video rendering', () => {
    it('draws video when provided', () => {
      const { ctx, calls } = createMockCtx();
      const video = fakeVideo(1920, 1080);
      drawFrame(ctx, 1920, 1080, {
        source: { video, mediaOverlay: null, bgColor: '#000' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      const imgs = getDrawImageCalls(calls);
      expect(imgs).toHaveLength(1);
      expect(imgs[0].source).toBe(video);
      expect(imgs[0].dx).toBeCloseTo(0);
      expect(imgs[0].dy).toBeCloseTo(0);
    });

    it('does not draw image when video is null', () => {
      const { ctx, calls } = createMockCtx();
      drawFrame(ctx, 1920, 1080, {
        source: { video: null, mediaOverlay: null, bgColor: '#000' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      expect(getDrawImageCalls(calls)).toHaveLength(0);
    });

    it('object-contain: wide video in square canvas → letterbox top/bottom', () => {
      const { ctx, calls } = createMockCtx();
      const video = fakeVideo(1920, 1080);
      drawFrame(ctx, 1080, 1080, {
        source: { video, mediaOverlay: null, bgColor: '#000' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      const [img] = getDrawImageCalls(calls);
      expect(img.dw).toBe(1080);
      expect(img.dh).toBe(1080 / (1920 / 1080));
      expect(img.dy).toBeGreaterThan(0); // top padding
      expect(img.dx).toBe(0);
    });

    it('object-contain: tall video in wide canvas → pillarbox left/right', () => {
      const { ctx, calls } = createMockCtx();
      const video = fakeVideo(1080, 1920); // 9:16 in 16:9 canvas
      drawFrame(ctx, 1920, 1080, {
        source: { video, mediaOverlay: null, bgColor: '#000' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      const [img] = getDrawImageCalls(calls);
      expect(img.dh).toBe(1080);
      expect(img.dw).toBe(1080 * (1080 / 1920));
      expect(img.dx).toBeGreaterThan(0); // left padding
      expect(img.dy).toBe(0);
    });

    it('object-contain: square video in 16:9 → pillarbox', () => {
      const { ctx, calls } = createMockCtx();
      drawFrame(ctx, 1920, 1080, {
        source: { video: fakeVideo(1080, 1080), mediaOverlay: null, bgColor: '#000' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      const [img] = getDrawImageCalls(calls);
      expect(img.dh).toBe(1080);
      expect(img.dw).toBe(1080); // square → height matches, width = 1080
      expect(img.dx).toBeCloseTo((1920 - 1080) / 2);
      expect(img.dy).toBe(0);
    });
  });

  describe('media overlay rendering', () => {
    it('draws media overlay when provided', () => {
      const { ctx, calls } = createMockCtx();
      const overlay = fakeImage(800, 600);
      drawFrame(ctx, 1920, 1080, {
        source: { video: null, mediaOverlay: overlay, bgColor: '#000' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      const imgs = getDrawImageCalls(calls);
      expect(imgs).toHaveLength(1);
      expect(imgs[0].source).toBe(overlay);
    });

    it('does not draw overlay when null', () => {
      const { ctx, calls } = createMockCtx();
      drawFrame(ctx, 1920, 1080, {
        source: { video: null, mediaOverlay: null, bgColor: '#000' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      expect(getDrawImageCalls(calls)).toHaveLength(0);
    });

    it('overlay uses object-contain independently from video', () => {
      const { ctx, calls } = createMockCtx();
      const overlay = fakeImage(400, 400); // square image in 16:9 canvas
      drawFrame(ctx, 1920, 1080, {
        source: { video: null, mediaOverlay: overlay, bgColor: '#000' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      const [img] = getDrawImageCalls(calls);
      expect(img.dh).toBe(1080);
      expect(img.dw).toBe(1080); // square → h matches
      expect(img.dx).toBeCloseTo((1920 - 1080) / 2);
    });
  });

  describe('video + overlay compositing', () => {
    it('draws video first, then overlay on top', () => {
      const { ctx, calls } = createMockCtx();
      const video = fakeVideo(1920, 1080);
      const overlay = fakeImage(800, 600);
      drawFrame(ctx, 1920, 1080, {
        source: { video, mediaOverlay: overlay, bgColor: '#000' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      const imgs = getDrawImageCalls(calls);
      expect(imgs).toHaveLength(2);
      expect(imgs[0].source).toBe(video);   // video first
      expect(imgs[1].source).toBe(overlay); // overlay on top
    });

    it('overlay covers video (z-order correct)', () => {
      const { ctx, calls } = createMockCtx();
      const video = fakeVideo(1920, 1080);
      const overlay = fakeImage(1920, 1080);
      drawFrame(ctx, 1920, 1080, {
        source: { video, mediaOverlay: overlay, bgColor: '#000' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      const imgs = getDrawImageCalls(calls);
      // Both fill the full canvas
      expect(imgs[0].dw).toBe(1920);
      expect(imgs[1].dw).toBe(1920);
      // Overlay drawn after video → on top
      const videoIdx = calls.findIndex(c => c.method === 'drawImage' && c.args[0] === video);
      const overlayIdx = calls.findIndex(c => c.method === 'drawImage' && c.args[0] === overlay);
      expect(overlayIdx).toBeGreaterThan(videoIdx);
    });
  });

  describe('video + overlay + caption compositing', () => {
    it('draw order: bgColor → video → overlay → caption', () => {
      const { ctx, calls } = createMockCtx();
      const video = fakeVideo(1920, 1080);
      const overlay = fakeImage(800, 600);
      const caption = {
        text: 'Hello world',
        startTime: 0,
        endTime: 2,
        words: [{ text: 'Hello', start: 0, end: 1 }, { text: 'world', start: 1, end: 2 }],
      };
      drawFrame(ctx, 1920, 1080, {
        source: { video, mediaOverlay: overlay, bgColor: '#000' },
        caption,
        captionStyle: baseStyle,
        time: 0.5,
      });

      // Verify z-order
      const fillRectIdx = calls.findIndex(c => c.method === 'fillRect');
      const videoIdx = calls.findIndex(c => c.method === 'drawImage' && c.args[0] === video);
      const overlayIdx = calls.findIndex(c => c.method === 'drawImage' && c.args[0] === overlay);
      const fillTextIdx = calls.findIndex(c => c.method === 'fillText');

      expect(fillRectIdx).toBeLessThan(videoIdx);     // bg before video
      expect(videoIdx).toBeLessThan(overlayIdx);       // video before overlay
      expect(overlayIdx).toBeLessThan(fillTextIdx);    // overlay before caption
    });

    it('caption renders on top of everything', () => {
      const { ctx, calls } = createMockCtx();
      drawFrame(ctx, 1920, 1080, {
        source: { video: fakeVideo(1920, 1080), mediaOverlay: fakeImage(800, 600), bgColor: '#000' },
        caption: {
          text: 'Test caption',
          startTime: 0,
          endTime: 2,
          words: [{ text: 'Test', start: 0, end: 1 }, { text: 'caption', start: 1, end: 2 }],
        },
        captionStyle: baseStyle,
        time: 0.5,
      });

      const lastDrawImage = calls.map((c, i) => ({ ...c, i })).filter(c => c.method === 'drawImage').pop();
      const firstFillText = calls.findIndex(c => c.method === 'fillText');
      expect(firstFillText).toBeGreaterThan(lastDrawImage!.i);
    });
  });

  describe('different aspect ratio scenarios', () => {
    const scenarios = [
      { name: '16:9 video in 16:9 canvas', vw: 1920, vh: 1080, cw: 1920, ch: 1080 },
      { name: '16:9 video in 1:1 canvas',  vw: 1920, vh: 1080, cw: 1080, ch: 1080 },
      { name: '16:9 video in 9:16 canvas', vw: 1920, vh: 1080, cw: 608,  ch: 1080 },
      { name: '9:16 video in 16:9 canvas', vw: 1080, vh: 1920, cw: 1920, ch: 1080 },
      { name: '9:16 video in 9:16 canvas', vw: 1080, vh: 1920, cw: 608,  ch: 1080 },
      { name: '1:1 video in 16:9 canvas',  vw: 1080, vh: 1080, cw: 1920, ch: 1080 },
      { name: '4:3 video in 16:9 canvas',  vw: 1440, vh: 1080, cw: 1920, ch: 1080 },
    ];

    for (const s of scenarios) {
      it(`${s.name}: video fits within canvas bounds`, () => {
        const { ctx, calls } = createMockCtx();
        drawFrame(ctx, s.cw, s.ch, {
          source: { video: fakeVideo(s.vw, s.vh), mediaOverlay: null, bgColor: '#000' },
          caption: null,
          captionStyle: baseStyle,
          time: 0,
        });
        const [img] = getDrawImageCalls(calls);
        // Video should not exceed canvas bounds
        expect(img.dx).toBeGreaterThanOrEqual(0);
        expect(img.dy).toBeGreaterThanOrEqual(0);
        expect(img.dx + img.dw).toBeLessThanOrEqual(s.cw + 0.01);
        expect(img.dy + img.dh).toBeLessThanOrEqual(s.ch + 0.01);
        // At least one dimension should fill the canvas
        const fillsW = Math.abs(img.dw - s.cw) < 1;
        const fillsH = Math.abs(img.dh - s.ch) < 1;
        expect(fillsW || fillsH).toBe(true);
      });
    }
  });

  describe('no video, only overlay (image-only project)', () => {
    it('renders overlay without video', () => {
      const { ctx, calls } = createMockCtx();
      const overlay = fakeImage(1920, 1080);
      drawFrame(ctx, 1920, 1080, {
        source: { video: null, mediaOverlay: overlay, bgColor: '#222' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      const imgs = getDrawImageCalls(calls);
      expect(imgs).toHaveLength(1);
      expect(imgs[0].source).toBe(overlay);
    });

    it('renders overlay + caption without video', () => {
      const { ctx, calls } = createMockCtx();
      drawFrame(ctx, 1920, 1080, {
        source: { video: null, mediaOverlay: fakeImage(1920, 1080), bgColor: '#222' },
        caption: {
          text: 'Slide caption',
          startTime: 0,
          endTime: 5,
          words: [{ text: 'Slide', start: 0, end: 2 }, { text: 'caption', start: 2, end: 5 }],
        },
        captionStyle: baseStyle,
        time: 1,
      });
      expect(getDrawImageCalls(calls)).toHaveLength(1);
      expect(getFillTextCalls(calls).length).toBeGreaterThan(0);
    });
  });

  describe('no media at all (bgColor only + caption)', () => {
    it('renders bgColor + caption only', () => {
      const { ctx, calls } = createMockCtx();
      drawFrame(ctx, 1920, 1080, {
        source: { video: null, mediaOverlay: null, bgColor: '#ff6600' },
        caption: {
          text: 'Background text',
          startTime: 0,
          endTime: 3,
          words: [{ text: 'Background', start: 0, end: 1.5 }, { text: 'text', start: 1.5, end: 3 }],
        },
        captionStyle: baseStyle,
        time: 0.5,
      });

      expect(getDrawImageCalls(calls)).toHaveLength(0); // no video/overlay
      expect(calls[0].method).toBe('fillRect');          // bg drawn
      expect(getFillTextCalls(calls).length).toBeGreaterThan(0); // caption drawn
    });
  });

  describe('caption absent scenarios', () => {
    it('no caption = no fillText', () => {
      const { ctx, calls } = createMockCtx();
      drawFrame(ctx, 1920, 1080, {
        source: { video: fakeVideo(1920, 1080), mediaOverlay: null, bgColor: '#000' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      expect(getFillTextCalls(calls)).toHaveLength(0);
    });

    it('video + overlay but no caption = 2 drawImage, 0 fillText', () => {
      const { ctx, calls } = createMockCtx();
      drawFrame(ctx, 1920, 1080, {
        source: { video: fakeVideo(1920, 1080), mediaOverlay: fakeImage(800, 600), bgColor: '#000' },
        caption: null,
        captionStyle: baseStyle,
        time: 0,
      });
      expect(getDrawImageCalls(calls)).toHaveLength(2);
      expect(getFillTextCalls(calls)).toHaveLength(0);
    });
  });
});
