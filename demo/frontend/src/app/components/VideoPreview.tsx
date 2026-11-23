import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';

import type { CaptionBlock, CaptionStyleConfig } from './caption/caption-types';
// Cùng engine vẽ với video xuất (electron/backend) — preview khớp pixel với render.
import type { RenderStyle, RenderCaption } from '@vbee-holding/video-renderer/schema';
import { drawCaptionFrame as drawFrame } from '@vbee-holding/video-renderer/draw';
import { splitWordsEvenly } from '../utils/splitWords';
import { ColorPickerPanel } from './ColorPickerPanel';
import lesson1SlideTexts from '../data/lesson1SlideTexts.json';

export interface SlideTextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  fontSizePt: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
  bgColor: string;
  hasBoxFill: boolean;
  borderColor: string | null;
  align: 'left' | 'center' | 'right';
  vAlign: 'top' | 'middle' | 'bottom';
}

export interface SlideInterval {
  slideNumber: number;
  startTime: number;
  endTime: number;
}

interface VideoPreviewProps {
  videoUrl: string;
  currentTime: number;
  isPlaying: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
  onLoadedMetadata?: (duration: number) => void;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isThumbnailsLoading?: boolean;
  transcriptionStatus?: { status: string; progress?: number; message?: string } | null;
  captionBlocks?: CaptionBlock[];
  captionStyle?: CaptionStyleConfig;
  captionVisible?: boolean;
  activeMediaSrc?: string | null;
  activeMediaType?: string | null;
  hasActiveMedia?: boolean;
  /** Immediately-updated ref from syncVideoLoop — bypasses React render lag for showVideo check. */
  hasActiveVideoRef?: RefObject<boolean>;
  /** Immediately-updated src of active image block — null when none active. */
  activeImageSrcRef?: RefObject<string | null>;
  /** Preloaded HTMLImageElement map keyed by src — for zero-lag image display. */
  preloadedImagesRef?: RefObject<Map<string, HTMLImageElement>>;
  /** Engine's master clock — called directly in RAF loop to avoid React render-lag on caption timing. */
  getEngineTime?: () => number;
  bgColor?: string;
  onBgColorChange?: (color: string) => void;
  aspectRatioIdx?: number;
  onAspectRatioChange?: (idx: number) => void;
  customResolution?: { w: number; h: number } | null;
  onCustomResolutionChange?: (res: { w: number; h: number } | null) => void;
  slides?: SlideInterval[];
  onSeekSlide?: (time: number) => void;
  slideTextEdits?: Record<string, string>;
  onSlideTextChange?: (elementId: string, newText: string) => void;
}

export const ASPECT_RATIOS = [
  { id: 'original',  label: 'Original',  desc: 'First video dimensions', w: 0, h: 0 },
  { id: '16:9',      label: '16:9',      desc: 'Youtube ads',            w: 16, h: 9 },
  { id: '9:16',      label: '9:16',      desc: 'Tiktok, Reels, Shorts',  w: 9, h: 16 },
  { id: '4:5',       label: '4:5',       desc: 'Linkedin, Facebook ads', w: 4, h: 5 },
  { id: '1:1',       label: '1:1',       desc: 'Instagram posts',        w: 1, h: 1 },
] as const;

function AspectIcon({ id }: { id: string }) {
  if (id === 'original') return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M6.5 3L5.5 3C4.12 3 3 4.12 3 5.5L3 6.5M3 13.5L3 14.5C3 15.88 4.12 17 5.5 17L6.5 17M13.5 17L14.5 17C15.88 17 17 15.88 17 14.5L17 13.5M17 6.5L17 5.5C17 4.12 15.88 3 14.5 3L13.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (id === '16:9') return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="5.5" width="16" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
  if (id === '9:16') return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <rect x="5.5" y="2" width="9" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
  if (id === '4:5') return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="2" width="15" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
  // 1:1
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="2.5" width="15" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

// ── Controls pill (shared between normal + fullscreen) ────────────────────────
function ControlsPill({
  aspectIdx, isCustom, aspectLabel,
  showAspectMenu, setShowAspectMenu, aspectMenuRef,
  setAspectIdx, setIsCustom,
  customW, setCustomW, customH, setCustomH,
  setAppliedCustomW, setAppliedCustomH,
  bgColor, setBgColor,
  showColorPicker, setShowColorPicker, colorPickerRef,
  isFullscreen, setIsFullscreen,
}: any) {
  return (
    <div className="flex items-center bg-white rounded-xl border border-[rgba(30,22,78,0.12)] shadow-sm">

      {/* Aspect ratio */}
      <div className="relative" ref={aspectMenuRef}>
        <button
          onClick={() => setShowAspectMenu((v: boolean) => !v)}
          className="flex items-center gap-2 px-4 py-2 text-[13px] text-[#1c1c1e] hover:bg-gray-50 rounded-l-xl transition-colors whitespace-nowrap cursor-pointer"
        >
          <AspectIcon id={ASPECT_RATIOS[aspectIdx].id} />
          {ASPECT_RATIOS[aspectIdx].label}
        </button>

        {showAspectMenu && (
          <div className="absolute top-full left-0 mt-1.5 bg-white/90 backdrop-blur rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-gray-100 p-1 z-50" style={{ minWidth: 260 }}>
            {ASPECT_RATIOS.map((ar, i) => (
              <button key={ar.id}
                onClick={() => { setAspectIdx(i); setShowAspectMenu(false); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <span className="w-5 h-5 flex items-center justify-center text-[#1c1c1e]"><AspectIcon id={ar.id} /></span>
                <span className="flex items-baseline gap-1 flex-1">
                  <span className="text-[13px] text-[#1c1c1e] font-normal tabular-nums">{ar.label}</span>
                  <span className="text-[11px] text-[rgba(28,28,30,0.5)] font-normal">{ar.desc}</span>
                </span>
                {aspectIdx === i && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8.5L6.667 11 12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-[rgba(30,22,78,0.1)]" />

      {/* Background */}
      <div className="relative" ref={colorPickerRef}>
        <button
          onClick={() => setShowColorPicker((v: boolean) => !v)}
          className="flex items-center gap-2 px-4 py-2 text-[13px] text-[#1c1c1e] hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: bgColor }} />
          Màu nền
        </button>
        {showColorPicker && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-gray-100 z-50">
            <ColorPickerPanel color={bgColor} onChange={setBgColor} />
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-[rgba(30,22,78,0.1)]" />

      {/* Fullscreen toggle */}
      <button
        onClick={() => setIsFullscreen((v: boolean) => !v)}
        className="px-3 py-2 flex items-center justify-center hover:bg-gray-50 rounded-r-xl transition-colors"
      >
        {isFullscreen ? (
          // Compress icon
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" stroke="#1c1c1e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          // Expand icon
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 2h4.5M2 2v4.5M14 2h-4.5M14 2v4.5M2 14h4.5M2 14v-4.5M14 14h-4.5M14 14v-4.5" stroke="#1c1c1e" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VideoPreview({
  videoUrl, currentTime, isPlaying,
  videoRef: externalVideoRef,
  onLoadedMetadata, onTimeUpdate, onEnded,
  isExpanded = false,
  onToggleExpand,
  isThumbnailsLoading = false,
  transcriptionStatus,
  captionBlocks,
  captionStyle,
  captionVisible,
  activeMediaSrc,
  activeMediaType,
  hasActiveMedia = true,
  hasActiveVideoRef: hasActiveVideoRefProp,
  activeImageSrcRef: activeImageSrcRefProp,
  preloadedImagesRef: preloadedImagesRefProp,
  getEngineTime,
  bgColor: propBgColor,
  onBgColorChange,
  aspectRatioIdx: propAspectIdx,
  onAspectRatioChange,
  customResolution: propCustomRes,
  onCustomResolutionChange,
  slides = [],
  onSeekSlide,
  slideTextEdits = {},
  onSlideTextChange,
}: VideoPreviewProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const metadataFiredRef = useRef(false);
  const srcSetRef = useRef(false);

  // Slide navigation state (wheel + keyboard arrows)
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(800);
  const [isPreviewFocused, setIsPreviewFocused] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextVal, setEditingTextVal] = useState<string>('');
  const lastWheelTimeRef = useRef<number>(0);

  // Track card width via ResizeObserver so font sizes scale proportionally to slide dimensions
  useEffect(() => {
    const el = cardContainerRef.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth > 0) setCardWidth(el.clientWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Determine current slide index from currentTime
  const currentSlideIdx = (() => {
    if (!slides.length) return -1;
    for (let i = slides.length - 1; i >= 0; i--) {
      if (currentTime >= slides[i].startTime - 0.05) {
        return i;
      }
    }
    return 0;
  })();

  const currentSlideNumber = currentSlideIdx >= 0 && slides[currentSlideIdx]
    ? slides[currentSlideIdx].slideNumber
    : currentSlideIdx + 1;

  const currentSlideTexts: SlideTextElement[] =
    ((lesson1SlideTexts as Record<string, SlideTextElement[]>)[String(currentSlideNumber)]) || [];

  // Close active text editor when slide changes
  useEffect(() => {
    setEditingTextId(null);
  }, [currentSlideNumber]);

  const goToSlide = useCallback((targetIdx: number) => {
    if (!slides.length || !onSeekSlide) return;
    const clampedIdx = Math.max(0, Math.min(slides.length - 1, targetIdx));
    const slide = slides[clampedIdx];
    // Offset slightly (+0.15s) past the slide start so the video lands cleanly
    // after any cross-fade transition frame between slides.
    const safeOffset = Math.min(0.15, Math.max(0, (slide.endTime - slide.startTime) * 0.1));
    onSeekSlide(slide.startTime + safeOffset);
  }, [slides, onSeekSlide]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (editingTextId) return; // Don't flip slide while editing text
    if (!slides.length || !onSeekSlide) return;
    if (Math.abs(e.deltaY) < 10) return;
    const now = performance.now();
    if (now - lastWheelTimeRef.current < 160) return;
    lastWheelTimeRef.current = now;
    if (e.deltaY > 0) {
      goToSlide(currentSlideIdx + 1);
    } else if (e.deltaY < 0) {
      goToSlide(currentSlideIdx - 1);
    }
  }, [editingTextId, slides.length, onSeekSlide, currentSlideIdx, goToSlide]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (editingTextId) return; // Let textarea handle arrow keys while editing text
    if (!slides.length || !onSeekSlide) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      e.stopPropagation();
      goToSlide(currentSlideIdx + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      e.stopPropagation();
      goToSlide(currentSlideIdx - 1);
    }
  }, [editingTextId, slides.length, onSeekSlide, currentSlideIdx, goToSlide]);

  // Set initial video src once on mount — engine manages src after this
  useEffect(() => {
    const video = videoRef.current;
    if (video && !srcSetRef.current) {
      srcSetRef.current = true;
      video.src = videoUrl;
    }
  }, [videoRef, videoUrl]);

  const [_aspectIdx, _setAspectIdx] = useState(propAspectIdx ?? 0);
  const aspectIdx = propAspectIdx ?? _aspectIdx;
  const setAspectIdx = (v: number) => { _setAspectIdx(v); onAspectRatioChange?.(v); };
  const [showAspectMenu, setShowAspectMenu] = useState(false);
  const aspectMenuRef = useRef<HTMLDivElement>(null);

  const [_bgColor, _setBgColor] = useState(propBgColor || '#000000');
  const bgColor = propBgColor ?? _bgColor;
  const setBgColor = (c: string) => { _setBgColor(c); onBgColorChange?.(c); };
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (aspectMenuRef.current && !aspectMenuRef.current.contains(e.target as Node))
        setShowAspectMenu(false);
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node))
        setShowColorPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Esc key exits expanded view
  useEffect(() => {
    if (!isExpanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onToggleExpand?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isExpanded, onToggleExpand]);

  // Engine's syncVideoLoop handles all play/pause/seek — no independent control here

  // Get video native dimensions for "Original" option
  const videoNativeW = videoRef.current?.videoWidth || 1920;
  const videoNativeH = videoRef.current?.videoHeight || 1080;

  const ar = ASPECT_RATIOS[aspectIdx];
  const aspectW = ar.id === 'original' ? videoNativeW : ar.w;
  const aspectH = ar.id === 'original' ? videoNativeH : ar.h;
  const aspectRatio = `${aspectW}/${aspectH}`;

  const pillProps = {
    aspectIdx,
    showAspectMenu, setShowAspectMenu, aspectMenuRef,
    setAspectIdx,
    bgColor, setBgColor,
    showColorPicker, setShowColorPicker, colorPickerRef,
    isFullscreen: isExpanded,
    setIsFullscreen: (_v: boolean | ((prev: boolean) => boolean)) => onToggleExpand?.(),
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const mediaOverlayRef = useRef<HTMLImageElement | null>(null);
  // On-demand image cache — keyed by src, loaded directly from RAF loop (no React lag)
  const onDemandImagesRef = useRef(new Map<string, HTMLImageElement | 'loading'>());

  // Refs for volatile props — updated every render so the RAF loop reads
  // the latest values without needing to restart when they change.
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;
  const getEngineTimeRef = useRef(getEngineTime);
  getEngineTimeRef.current = getEngineTime;
  const bgColorRef = useRef(bgColor);
  bgColorRef.current = bgColor;
  const captionBlocksRef = useRef(captionBlocks);
  captionBlocksRef.current = captionBlocks;
  const captionStyleRef = useRef(captionStyle);
  captionStyleRef.current = captionStyle;
  const captionVisibleRef = useRef(captionVisible);
  captionVisibleRef.current = captionVisible;
  const hasActiveMediaRef = useRef(hasActiveMedia);
  hasActiveMediaRef.current = hasActiveMedia;
  const activeMediaTypeRef = useRef(activeMediaType);
  activeMediaTypeRef.current = activeMediaType;
  const videoUrlRef = useRef(videoUrl);
  videoUrlRef.current = videoUrl;
  const slidesRef = useRef(slides);
  slidesRef.current = slides;
  const slideTextEditsRef = useRef(slideTextEdits);
  slideTextEditsRef.current = slideTextEdits;
  const editingTextIdRef = useRef(editingTextId);
  editingTextIdRef.current = editingTextId;

  // Load media overlay image when activeMediaSrc changes
  useEffect(() => {
    if (!activeMediaSrc || activeMediaType !== 'image') {
      mediaOverlayRef.current = null;
      return;
    }
    const img = new Image();
    img.src = activeMediaSrc;
    img.onload = () => { mediaOverlayRef.current = img; };
    img.onerror = () => { mediaOverlayRef.current = null; };
    return () => { mediaOverlayRef.current = null; };
  }, [activeMediaSrc, activeMediaType]);

  // Convert CaptionStyleConfig → RenderStyle for the renderer
  const toRenderStyle = useCallback((style: CaptionStyleConfig): RenderStyle => ({
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    sizeScale: style.sizeScale ?? 100,
    textColor: style.textColor,
    textTransform: style.textTransform,
    letterSpacing: style.letterSpacing,
    outline: style.outline,
    shadow: style.shadow,
    background: style.background,
    wordHighlight: style.wordHighlight,
    position: { x: style.position.x, y: style.position.y, offsetX: style.position.offsetX ?? 0, offsetY: style.position.offsetY ?? 0 },
    maxWidth: style.maxWidth,
    maxLines: style.maxLines,
    maxWordsPerLine: style.maxWordsPerLine ?? 100,
    autoBreak: style.autoBreak ?? true,
    textAlign: style.textAlign,
    revealMode: style.revealMode ?? 'all',
  }), []);

  // Canvas RAF render loop — uses refs for volatile props so the loop
  // never restarts due to captionBlocks / captionStyle reference changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      // Match canvas internal resolution to display size (Retina-aware)
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);

      // Skip if container not laid out yet
      if (w < 1 || h < 1) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      // Use engine's master clock directly when available — avoids React render-lag (~30ms)
      // on caption timing. Falls back to prop-derived ref when engine not provided.
      const time = getEngineTimeRef.current?.() ?? currentTimeRef.current;

      // Find active caption block using refs (no closure over props)
      let caption: RenderCaption | null = null;
      const cStyle = captionStyleRef.current;
      if (captionVisibleRef.current && captionBlocksRef.current && cStyle && cStyle.presetId !== 'none') {
        for (const b of captionBlocksRef.current) {
          if (time >= b.startTime && time < b.endTime) {
            caption = {
              text: b.text,
              startTime: b.startTime,
              endTime: b.endTime,
              words: b.words || splitWordsEvenly(b.text, b.startTime, b.endTime),
            };
            break;
          }
        }
      }

      // Show video frame if there's an active video block.
      // When hasActiveVideoRefProp is provided (media-timeline mode), use it — it's updated
      // immediately by syncVideoLoop, no React render lag. Otherwise fall back to prop-based check.
      const showVideo = video.readyState >= 2 && (
        hasActiveVideoRefProp
          ? hasActiveVideoRefProp.current
          : (!!videoUrlRef.current || (hasActiveMediaRef.current && activeMediaTypeRef.current === 'video'))
      );
      drawFrame(ctx, w, h, {
        source: {
          video: showVideo ? video : null,
          mediaOverlay: (() => {
            if (activeImageSrcRefProp !== undefined) {
              // Engine ref is authoritative — no React-lag fallback when engine is driving
              const imgSrc = activeImageSrcRefProp.current;
              if (!imgSrc) return null;

              // 1. Check preloaded map (zero-lag if already loaded)
              const preloaded = preloadedImagesRefProp?.current?.get(imgSrc);
              if (preloaded) return preloaded;

              // 2. Check on-demand cache (loaded by previous RAF frames)
              const cached = onDemandImagesRef.current.get(imgSrc);
              if (cached && cached !== 'loading') return cached;

              // 3. Start on-demand load (one-shot per unique src)
              if (!cached) {
                onDemandImagesRef.current.set(imgSrc, 'loading');
                const img = new Image();
                img.src = imgSrc;
                img.onload = () => { onDemandImagesRef.current.set(imgSrc, img); };
                img.onerror = () => { onDemandImagesRef.current.delete(imgSrc); };
              }

              // 4. Fallback to React-based ref while image is still downloading
              return mediaOverlayRef.current;
            }
            return (hasActiveMediaRef.current && activeMediaTypeRef.current === 'image') ? mediaOverlayRef.current : null;
          })(),
          bgColor: bgColorRef.current,
        },
        caption,
        captionStyle: cStyle ? toRenderStyle(cStyle) : toRenderStyle({} as CaptionStyleConfig),
        time,
      });

      // Draw edited slide text patches directly onto canvas (for smooth playback & export readiness)
      const editsMap = slideTextEditsRef.current;
      const sList = slidesRef.current;
      if (editsMap && Object.keys(editsMap).length > 0 && sList && sList.length > 0) {
        let activeSlideNum = 1;
        for (let i = sList.length - 1; i >= 0; i--) {
          if (time >= sList[i].startTime - 0.05) {
            activeSlideNum = sList[i].slideNumber;
            break;
          }
        }
        const slideElements = ((lesson1SlideTexts as Record<string, SlideTextElement[]>)[String(activeSlideNum)]) || [];
        for (const el of slideElements) {
          // If currently editing this element in the HTML textarea, HTML overlay handles drawing it
          if (editingTextIdRef.current === el.id) continue;
          const editedText = editsMap[el.id];
          if (editedText === undefined || editedText === el.text) continue;

          ctx.save();
          const bx = (el.x / 100) * w;
          const by = (el.y / 100) * h;
          const bw = (el.w / 100) * w;
          const bh = (el.h / 100) * h;

          // 1. Mask out original baked video text with the shape/slide background color
          ctx.fillStyle = el.bgColor || '#FFFFFF';
          ctx.fillRect(bx, by, bw, bh);
          if (el.borderColor) {
            ctx.strokeStyle = el.borderColor;
            ctx.lineWidth = Math.max(1, (1.25 / 960) * w);
            ctx.strokeRect(bx, by, bw, bh);
          }

          // 2. Draw new text inside padded box
          const padL = (el.padL / 100) * w;
          const padR = (el.padR / 100) * w;
          const padT = (el.padT / 100) * h;
          const padB = (el.padB / 100) * h;
          const innerX = bx + padL;
          const innerY = by + padT;
          const innerW = Math.max(10, bw - padL - padR);
          const innerH = Math.max(10, bh - padT - padB);

          const fontPx = (el.fontSizePt * (4 / 3)) * (w / 960);
          ctx.font = `${el.fontStyle === 'italic' ? 'italic ' : ''}${el.fontWeight === 'bold' ? '700' : '400'} ${fontPx}px "${el.fontFamily}", "Be Vietnam Pro", sans-serif`;
          ctx.fillStyle = el.color || '#141414';
          ctx.textAlign = el.align;
          ctx.textBaseline = 'top';

          // Word-wrap lines
          const rawLines = editedText.split('\n');
          const wrappedLines: string[] = [];
          for (const rawLine of rawLines) {
            const words = rawLine.split(' ');
            let currentLine = '';
            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              if (ctx.measureText(testLine).width > innerW && currentLine) {
                wrappedLines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            wrappedLines.push(currentLine);
          }

          const lineHeight = fontPx * 1.25;
          const totalTextH = wrappedLines.length * lineHeight;
          let startY = innerY;
          if (el.vAlign === 'middle') {
            startY = innerY + (innerH - totalTextH) / 2;
          } else if (el.vAlign === 'bottom') {
            startY = innerY + innerH - totalTextH;
          }

          const drawX = el.align === 'center'
            ? innerX + innerW / 2
            : el.align === 'right'
            ? innerX + innerW
            : innerX;

          for (let li = 0; li < wrappedLines.length; li++) {
            ctx.fillText(wrappedLines[li], drawX, startY + li * lineHeight);
          }
          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [videoRef, toRenderStyle]);

  // Hidden video element (audio + frame source for canvas).
  // Must have real dimensions so the browser decodes frames (w-0/h-0 = no decode).
  // visibility:hidden keeps it in layout + decoding but invisible to the user.
  const videoEl = (
    <video
      ref={videoRef}
      preload="auto"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ visibility: 'hidden' }}
      onLoadedMetadata={() => {
        if (!metadataFiredRef.current && videoRef.current && onLoadedMetadata) {
          metadataFiredRef.current = true;
          onLoadedMetadata(videoRef.current.duration);
        }
      }}
    />
  );

  return (
    <div
      ref={previewContainerRef}
      tabIndex={0}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsPreviewFocused(true)}
      onBlur={() => setIsPreviewFocused(false)}
      onMouseDown={(e) => {
        // Focus container when clicking inside the preview area (except buttons/inputs/textareas)
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'button' && tag !== 'input' && tag !== 'textarea') {
          previewContainerRef.current?.focus({ preventScroll: true });
        }
      }}
      className="h-full flex flex-col bg-[#e9eaf0] relative outline-none select-none"
    >
      {/* Controls pill */}
      <div className="flex items-center justify-center pt-3 px-4 shrink-0">
        <ControlsPill {...pillProps} />
      </div>

      {/* Video canvas area */}
      <div
        className="flex-1 flex items-center justify-center p-5 min-h-0 relative"
        style={{ containerType: 'size' }}
      >
        <div
          ref={cardContainerRef}
          className={`relative rounded-2xl overflow-hidden shadow-lg transition-shadow duration-200 ${
            isPreviewFocused ? 'ring-2 ring-[#1e164e]/40 shadow-xl' : ''
          }`}
          style={{
            aspectRatio,
            backgroundColor: bgColor,
            maxWidth: '100%',
            maxHeight: '100%',
            width: `min(100%, calc(100cqh * (${aspectW} / ${aspectH})))`,
            height: `min(100%, calc(100cqw * (${aspectH} / ${aspectW})))`,
          }}
        >
          {/* Hidden video — provides audio + frame source for canvas */}
          {videoEl}
          {/* Canvas renders everything: video frame + media overlay + caption */}
          <canvas
            ref={canvasRef}
            onClick={() => {
              if (editingTextId) setEditingTextId(null);
            }}
            className="absolute inset-0 w-full h-full z-[2]"
          />

          {/* Interactive Slide Text Overlay Layer — click any text on the slide to edit directly */}
          {currentSlideTexts.length > 0 && (
            <div
              className="absolute inset-0 z-[5] pointer-events-none"
            >
              {currentSlideTexts.map((el) => {
                const isEditingThis = editingTextId === el.id;
                const currentVal = slideTextEdits[el.id] !== undefined ? slideTextEdits[el.id] : el.text;
                const isModified = slideTextEdits[el.id] !== undefined && slideTextEdits[el.id] !== el.text;
                const fontPx = (el.fontSizePt * (4 / 3)) * (cardWidth / 960);

                return (
                  <div
                    key={el.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isEditingThis) {
                        setEditingTextId(el.id);
                        setEditingTextVal(currentVal);
                      }
                    }}
                    title="Click để sửa chữ trên slide"
                    className={`absolute pointer-events-auto transition-all duration-150 group/slidetext ${
                      isEditingThis
                        ? 'z-30 ring-2 ring-[#007aff] shadow-md rounded-[3px]'
                        : 'hover:ring-1 hover:ring-dashed hover:ring-[#007aff]/70 hover:bg-[#007aff]/[0.04] rounded-[2px] cursor-text'
                    }`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.w}%`,
                      height: `${el.h}%`,
                      backgroundColor: isEditingThis ? el.bgColor : 'transparent',
                      border: isEditingThis && el.borderColor ? `1.5px solid ${el.borderColor}` : undefined,
                      paddingLeft: `${el.padL}%`,
                      paddingRight: `${el.padR}%`,
                      paddingTop: `${el.padT}%`,
                      paddingBottom: `${el.padB}%`,
                      display: 'flex',
                      alignItems:
                        el.vAlign === 'middle'
                          ? 'center'
                          : el.vAlign === 'bottom'
                          ? 'flex-end'
                          : 'flex-start',
                      justifyContent:
                        el.align === 'center'
                          ? 'center'
                          : el.align === 'right'
                          ? 'flex-end'
                          : 'flex-start',
                    }}
                  >
                    {isEditingThis ? (
                      <textarea
                        autoFocus
                        value={editingTextVal}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingTextVal(val);
                          onSlideTextChange?.(el.id, val);
                        }}
                        onBlur={() => setEditingTextId(null)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Escape') {
                            setEditingTextId(null);
                          }
                        }}
                        className="w-full h-full bg-transparent border-none outline-none resize-none p-0 m-0 overflow-hidden select-text"
                        style={{
                          fontFamily: `"${el.fontFamily}", "Be Vietnam Pro", sans-serif`,
                          fontSize: `${fontPx}px`,
                          fontWeight: el.fontWeight === 'bold' ? 700 : 400,
                          fontStyle: el.fontStyle,
                          color: el.color,
                          textAlign: el.align,
                          lineHeight: 1.25,
                        }}
                      />
                    ) : (
                      isModified && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSlideTextChange?.(el.id, el.text);
                          }}
                          title="Khôi phục chữ gốc"
                          className="opacity-0 group-hover/slidetext:opacity-100 absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#1e164e] text-white flex items-center justify-center shadow hover:bg-red-600 transition-all cursor-pointer z-40"
                        >
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {(isThumbnailsLoading || (transcriptionStatus && transcriptionStatus.status !== 'done')) && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3 max-w-[80%]">
                {transcriptionStatus?.status === 'error' ? (
                  <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                ) : (
                  <svg className="animate-spin w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                )}
                <span className={`text-[13px] font-medium text-center ${transcriptionStatus?.status === 'error' ? 'text-red-300' : 'text-white'}`}>
                  {transcriptionStatus?.status === 'uploading'
                    ? 'Đang tải video lên server...'
                    : transcriptionStatus?.status === 'transcribing'
                    ? 'Đang phiên âm video...'
                    : transcriptionStatus?.status === 'error'
                    ? `Lỗi phiên âm: ${transcriptionStatus.message}`
                    : 'Đang xử lý video...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
