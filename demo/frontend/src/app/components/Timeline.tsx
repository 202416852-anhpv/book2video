import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, Volume2, Scissors } from 'lucide-react';
import KeyboardArrowUpRounded from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import type { MediaBlock, MusicBlock } from '../types/timeline-blocks';

interface VoiceBlock {
  id: number;
  startTime: number;
  duration: number;
  trimStart?: number;
  /** Source audio length in seconds — used to cap resize so the block can't be larger than its source. */
  naturalDuration?: number;
  audioUrl?: string;
  label: string;
}

type TrackType = 'voice' | 'media' | 'music';
type GenericBlock = { id: number; startTime: number; duration: number };

interface TimelineProps {
  voiceOverBlocks: VoiceBlock[];
  mediaBlocks?: MediaBlock[];
  musicBlocks?: MusicBlock[];
  videoDuration: number;
  videoUrl?: string;
  totalDuration: number;
  currentTime: number;
  isPlaying: boolean;
  isGeneratingTTS?: boolean;
  isTranscribing?: boolean;
  volumes?: { voiceover: number; media: number; audio: number };
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onAddBackgroundMusic: () => void;
  onAddMediaBlock?: () => void;
  onInsertMusicBlock?: () => void;
  timelineHeight?: number;
  onHeightChange?: (h: number) => void;
  onThumbnailsLoading?: (loading: boolean) => void;
  onVolumeChange?: (volumes: { voiceover: number; media: number; audio: number }) => void;
  onSpeedChange?: (speed: number) => void;
  onBlockChange?: (blockId: number, startTime: number, duration: number, trimStart: number) => void;
  onMediaBlockChange?: (blockId: number, startTime: number, duration: number, trimStart: number) => void;
  onMusicBlockChange?: (blockId: number, startTime: number, duration: number, trimStart: number) => void;
  onBlockDragStart?: () => void;
  onDeleteMediaBlock?: (blockId: number) => void;
  onDeleteMusicBlock?: (blockId: number) => void;
  onAddAudioBlock?: () => void;
  onStopPlayback?: () => void;
  onVoiceBlockClick?: (blockId: number) => void;
}

const TRACK_HEIGHT = 52;
const MIN_PX_PER_SEC = 5;
const MAX_PX_PER_SEC = 120;
const BLOCK_COLORS = [
  { bg: '#dbeafe', border: '#60a5fa' },
];
const MEDIA_BLOCK_COLORS = [
  { bg: '#bbf7d0', border: '#4ade80' },
  { bg: '#a7f3d0', border: '#34d399' },
];
const MUSIC_BLOCK_COLORS = [
  { bg: '#f5d0fe', border: '#d946ef' },
];
const LABEL_WIDTH = 44;
const TRACK_LABELS = [
  { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="rgba(30,22,78,0.8)"><path d="M8 1.333c.368 0 .667.298.667.667v12a.667.667 0 0 1-1.334 0V2c0-.369.299-.667.667-.667M5.333 5.333c.369 0 .667.298.667.667v4a.667.667 0 1 1-1.333 0V6c0-.369.298-.667.666-.667M3.333 4A.667.667 0 1 0 2 4v8a.667.667 0 0 0 1.333 0zM13.333 3.333c.368 0 .667.298.667.667v8a.667.667 0 0 1-1.333 0V4c0-.369.298-.667.666-.667M11.333 6A.667.667 0 1 0 10 6v4a.667.667 0 0 0 1.333 0z"/></svg>, label: 'Voice', border: true },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(30,22,78,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>, label: 'Video', border: true },
  { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(30,22,78,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, label: 'Music', border: false },
];
const MIN_HEIGHT = 52;
const MAX_HEIGHT = 44 + 32 + TRACK_HEIGHT * 3;

function formatTimecode(s: number): string {
  if (isNaN(s)) return '00:00.0';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const t = Math.floor((s % 1) * 10);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${t}`;
}

export default function Timeline({
  voiceOverBlocks,
  mediaBlocks: mediaBlocksProp,
  musicBlocks: musicBlocksProp,
  videoDuration,
  videoUrl,
  totalDuration,
  currentTime,
  isPlaying,
  isGeneratingTTS,
  isTranscribing,
  volumes: externalVolumes,
  onPlayPause,
  onSeek,
  onAddBackgroundMusic,
  onAddMediaBlock,
  onInsertMusicBlock,
  timelineHeight: externalHeight,
  onHeightChange,
  onThumbnailsLoading,
  onVolumeChange,
  onSpeedChange,
  onBlockChange,
  onMediaBlockChange,
  onMusicBlockChange,
  onDeleteMediaBlock,
  onDeleteMusicBlock,
  onAddAudioBlock,
  onStopPlayback,
  onBlockDragStart,
  onVoiceBlockClick,
}: TimelineProps) {
  const mediaBlocks = mediaBlocksProp ?? [];
  const musicBlocks = musicBlocksProp ?? [];
  const [selectedBlock, setSelectedBlock] = useState<{ track: TrackType; id: number } | null>(null);
  const [mediaThumbsMap, setMediaThumbsMap] = useState<Record<number, { src: string; time: number }[]>>({});
  const [mediaThumbsLoading, setMediaThumbsLoading] = useState<Set<number>>(new Set());
  const [musicLoading, setMusicLoading] = useState<Set<number>>(new Set());
  const [internalHeight, setInternalHeight] = useState(200);
  const timelineHeight = externalHeight ?? internalHeight;
  const setTimelineHeight = useCallback((h: number) => {
    setInternalHeight(h);
    onHeightChange?.(h);
  }, [onHeightChange]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pixelsPerSec, setPixelsPerSec] = useState(40);
  const [showVolumeMixer, setShowVolumeMixer] = useState(false);
  const preMuteRef = useRef<Record<string, number>>({});
  const volumes = externalVolumes ?? { voiceover: 100, media: 100, audio: 100 };

  const scrollRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const isDraggingPlayhead = useRef(false);

  // Block drag/resize state
  const blockDragRef = useRef<{
    type: 'move' | 'resize-left' | 'resize-right';
    track: TrackType;
    blockId: number;
    blockIdx: number;
    startX: number;
    origStart: number;
    origDuration: number;
    origTrimStart: number;
    /** Cap on resize: block.duration + trimStart can't exceed this. Infinity = no cap (e.g. images). */
    maxContent: number;
    didPause: boolean;
  } | null>(null);
  const stopPlaybackRef = useRef(onStopPlayback);
  stopPlaybackRef.current = onStopPlayback;

  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Smooth playhead
  const [displayTime, setDisplayTime] = useState(currentTime);
  const lastPropTimeRef = useRef(currentTime);
  const lastWallTimeRef = useRef(performance.now());
  const rafRef = useRef<number>(0);

  const effectiveHeight = isCollapsed ? MIN_HEIGHT : MAX_HEIGHT;

  // Sync height with parent
  useEffect(() => {
    setTimelineHeight(effectiveHeight);
  }, [effectiveHeight, setTimelineHeight]);

  const timelineWidth = Math.max(totalDuration * pixelsPerSec, 800);
  const tickInterval = pixelsPerSec >= 60 ? 1 : pixelsPerSec >= 30 ? 2 : pixelsPerSec >= 20 ? 5 : pixelsPerSec >= 14 ? 10 : 20;
  const rulerDuration = (timelineWidth + 200) / pixelsPerSec;
  const tickCount = Math.ceil(rulerDuration / tickInterval) + 2;
  const playheadX = displayTime * pixelsPerSec;

  // Extract thumbnails for ALL media video blocks (one-time per block).
  // Use src (URL) as the dedup key instead of block.id — if a block is
  // deleted and re-added with the same id, extraction won't be skipped.
  const extractingRef = useRef(new Set<string>());
  useEffect(() => {
    const blocksToProcess = mediaBlocks.filter(b => b.type === 'video' && b.src && !mediaThumbsMap[b.id] && !extractingRef.current.has(b.src));

    blocksToProcess.forEach(block => {
      extractingRef.current.add(block.src);
      setMediaThumbsLoading(prev => new Set(prev).add(block.id));
      const vidEl = document.createElement('video');
      vidEl.src = block.src;
      vidEl.muted = true;
      vidEl.preload = 'auto';
      vidEl.crossOrigin = 'anonymous';
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');

      (async () => {
        vidEl.load();
        await new Promise<void>((res, rej) => {
          vidEl.addEventListener('loadeddata', () => res(), { once: true });
          vidEl.addEventListener('error', () => rej(), { once: true });
        });
        const dur = vidEl.duration || block.naturalDuration;
        const MAX_FRAMES = 60;
        // Adaptive interval: short videos get more detail, long videos get fewer frames
        const INTERVAL = Math.max(0.5, dur / MAX_FRAMES);
        const count = Math.min(MAX_FRAMES, Math.max(1, Math.ceil(dur / INTERVAL)));
        const thumbs: { src: string; time: number }[] = [];
        for (let i = 0; i < count; i++) {
          vidEl.currentTime = Math.max(0.01, i * INTERVAL);
          await new Promise<void>(res => vidEl.addEventListener('seeked', () => res(), { once: true }));
          ctx?.drawImage(vidEl, 0, 0, 160, 90);
          thumbs.push({ src: canvas.toDataURL('image/jpeg', 0.6), time: vidEl.currentTime });
        }
        vidEl.src = '';
        setMediaThumbsMap(prev => ({ ...prev, [block.id]: thumbs }));
        setMediaThumbsLoading(prev => { const n = new Set(prev); n.delete(block.id); return n; });
      })().catch(() => {
        vidEl.src = '';
        extractingRef.current.delete(block.src);
        setMediaThumbsLoading(prev => { const n = new Set(prev); n.delete(block.id); return n; });
      });
    });
  }, [mediaBlocks, mediaThumbsMap]);

  // Preload music blocks and track loading state
  const musicPreloadedRef = useRef(new Set<number>());
  useEffect(() => {
    musicBlocks.forEach(block => {
      if (musicPreloadedRef.current.has(block.id)) return;
      musicPreloadedRef.current.add(block.id);
      setMusicLoading(prev => new Set(prev).add(block.id));
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = block.url;
      const done = () => {
        setMusicLoading(prev => { const n = new Set(prev); n.delete(block.id); return n; });
      };
      audio.addEventListener('canplay', done, { once: true });
      audio.addEventListener('error', done, { once: true });
    });
  }, [musicBlocks]);

  // Sync displayTime on seek / pause
  useEffect(() => {
    if (!isPlaying || isDraggingPlayhead.current) setDisplayTime(currentTime);
    lastPropTimeRef.current = currentTime;
    lastWallTimeRef.current = performance.now();
  }, [currentTime, isPlaying]);

  // RAF interpolation while playing
  useEffect(() => {
    if (!isPlaying) return;
    const tick = () => {
      if (!isDraggingPlayhead.current) {
        const elapsed = (performance.now() - lastWallTimeRef.current) / 1000;
        setDisplayTime(Math.min(totalDuration, lastPropTimeRef.current + elapsed));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, totalDuration]);



  const toggleCollapse = () => setIsCollapsed(v => !v);

  // Playhead seek
  const seekFromX = useCallback((clientX: number) => {
    const el = scrollRef.current;
    if (!el || totalDuration <= 0) return;
    const t = Math.max(0, (clientX - el.getBoundingClientRect().left + el.scrollLeft) / pixelsPerSec);
    setDisplayTime(t);
    lastPropTimeRef.current = t;
    lastWallTimeRef.current = performance.now();
    onSeek(t);
  }, [totalDuration, pixelsPerSec, onSeek]);

  useEffect(() => {
    const onUp = () => { isDraggingPlayhead.current = false; };
    const onMove = (e: MouseEvent) => { if (isDraggingPlayhead.current) seekFromX(e.clientX); };
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mousemove', onMove);
    return () => { document.removeEventListener('mouseup', onUp); document.removeEventListener('mousemove', onMove); };
  }, [seekFromX]);

  // Block drag/resize helpers
  const getBlockArray = useCallback((track: TrackType): GenericBlock[] => {
    if (track === 'voice') return voiceOverBlocks;
    if (track === 'media') return mediaBlocks;
    return musicBlocks;
  }, [voiceOverBlocks, mediaBlocks, musicBlocks]);

  const getBlockCallback = useCallback((track: TrackType) => {
    if (track === 'voice') return onBlockChange;
    if (track === 'media') return onMediaBlockChange;
    return onMusicBlockChange;
  }, [onBlockChange, onMediaBlockChange, onMusicBlockChange]);

  // Block drag/resize handlers
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = blockDragRef.current;
      if (!drag || !scrollRef.current) return;
      e.preventDefault();

      const dx = e.clientX - drag.startX;
      if (Math.abs(dx) < 3) return;

      // Stop playback on first actual drag movement
      if (!drag.didPause) {
        drag.didPause = true;
        stopPlaybackRef.current?.();
      }

      const dtSec = dx / pixelsPerSec;

      const blocks = getBlockArray(drag.track);
      const cb = getBlockCallback(drag.track);
      // Find real temporal neighbors (not just array index neighbors)
      const currentBlock = blocks.find(b => b.id === drag.blockId);
      const others = blocks.filter(b => b.id !== drag.blockId).sort((a, b) => a.startTime - b.startTime);
      const leftNeighbors = others.filter(b => b.startTime + b.duration <= (currentBlock?.startTime ?? drag.origStart) + 0.01);
      const rightNeighbors = others.filter(b => b.startTime >= (currentBlock?.startTime ?? drag.origStart) + (currentBlock?.duration ?? drag.origDuration) - 0.01);
      const prevEnd = leftNeighbors.length > 0 ? Math.max(...leftNeighbors.map(b => b.startTime + b.duration)) : 0;
      const nextStart = rightNeighbors.length > 0 ? Math.min(...rightNeighbors.map(b => b.startTime)) : Infinity;
      const minDur = Math.max(0.2, 25 / pixelsPerSec); // minimum 25px visual width

      if (drag.type === 'move') {
        let newStart = drag.origStart + dtSec;
        newStart = Math.max(prevEnd, Math.min(newStart, nextStart - drag.origDuration));
        const s = Math.round(newStart * 100) / 100;
        cb?.(drag.blockId, s, Math.round(drag.origDuration * 100) / 100, drag.origTrimStart);
        onSeek(s);
      } else if (drag.type === 'resize-left') {
        // Cap leftward expansion: trimStart can't go below 0 → newStart can't go below origStart - origTrimStart.
        const minStartByTrim = drag.origStart - drag.origTrimStart;
        let newStart = drag.origStart + dtSec;
        newStart = Math.max(prevEnd, minStartByTrim, Math.min(newStart, drag.origStart + drag.origDuration - minDur));
        const delta = newStart - drag.origStart;
        const s = Math.round(newStart * 100) / 100;
        const newDur = Math.round((drag.origDuration - delta) * 100) / 100;
        // trimStart decreases when expanding (delta<0), increases when shrinking (delta>0)
        const maxTrim = (drag.origTrimStart ?? 0) + drag.origDuration - minDur;
        const newTrimStart = Math.max(0, Math.round(Math.min(maxTrim, (drag.origTrimStart ?? 0) + delta) * 100) / 100);
        cb?.(drag.blockId, s, newDur, newTrimStart);
        onSeek(s);
      } else if (drag.type === 'resize-right') {
        // Cap rightward expansion: duration + trimStart can't exceed source's natural length.
        const maxDurByContent = drag.maxContent - drag.origTrimStart;
        let newDur = drag.origDuration + dtSec;
        newDur = Math.max(minDur, Math.min(newDur, nextStart - drag.origStart, maxDurByContent));
        const s = Math.round(drag.origStart * 100) / 100;
        const d = Math.round(newDur * 100) / 100;
        cb?.(drag.blockId, s, d, drag.origTrimStart);
        onSeek(s + d);
      }
    };

    const onUp = () => { blockDragRef.current = null; document.body.style.cursor = ''; };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [pixelsPerSec, getBlockArray, getBlockCallback, onSeek]);

  const startBlockDrag = (e: React.MouseEvent, type: 'move' | 'resize-left' | 'resize-right', blockId: number, blockIdx: number, track: TrackType = 'voice') => {
    e.preventDefault();
    e.stopPropagation();
    onBlockDragStart?.();
    const blocks = getBlockArray(track);
    const block = blocks[blockIdx];
    // Resize cap: voice + video can't exceed their source; images/missing-natural have no cap.
    const natural = (block as any).naturalDuration as number | undefined;
    const blockType = (block as any).type as ('video' | 'image' | undefined);
    const noCap = track === 'music' || blockType === 'image' || !natural || !isFinite(natural);
    const maxContent = noCap ? Infinity : natural;
    blockDragRef.current = { type, track, blockId, blockIdx, startX: e.clientX, origStart: block.startTime, origDuration: block.duration, origTrimStart: (block as any).trimStart ?? 0, maxContent, didPause: false };
    document.body.style.cursor = type === 'move' ? 'grabbing' : 'col-resize';
    seekFromX(e.clientX);
  };

  // Delete selected block on Delete/Backspace
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedBlock) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBlock.track === 'media') onDeleteMediaBlock?.(selectedBlock.id);
        else if (selectedBlock.track === 'music') onDeleteMusicBlock?.(selectedBlock.id);
        setSelectedBlock(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedBlock, onDeleteMediaBlock, onDeleteMusicBlock]);

  // Close volume mixer on outside click
  useEffect(() => {
    if (!showVolumeMixer) return;
    const handler = (e: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) setShowVolumeMixer(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showVolumeMixer]);

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isDraggingPlayhead.current || blockDragRef.current) return;
    const containerWidth = el.clientWidth;
    const scrollLeft = el.scrollLeft;
    if (playheadX < scrollLeft + 60 || playheadX > scrollLeft + containerWidth - 60) {
      // Playhead stays near left edge (10% from left)
      el.scrollTo({ left: Math.max(0, playheadX - containerWidth * 0.1), behavior: isPlaying ? 'instant' : 'smooth' });
    }
  }, [playheadX, isPlaying]);

  const iconBtn = 'w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors';
  const playhead = <div className="absolute top-0 bottom-0 w-px bg-blue-500 pointer-events-none z-10" style={{ left: playheadX }} />;

  return (
    <div
      className="fixed bottom-0 left-[80px] right-0 bg-white border-t border-[rgba(0,0,0,0.06)] shadow-[0_-1px_4px_rgba(0,0,0,0.04)] z-40 flex flex-col select-none"
      style={{ height: effectiveHeight }}
    >
      {/* Toolbar */}
      <div className="relative h-11 shrink-0 border-b border-[rgba(0,0,0,0.06)] bg-white flex items-center px-3">
        {/* Left: show/hide toggle */}
        <button
          onClick={toggleCollapse}
          className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
          title={isCollapsed ? 'Show timeline' : 'Hide timeline'}
        >
          {isCollapsed
            ? <KeyboardArrowUpRounded sx={{ fontSize: 18 }} />
            : <KeyboardArrowDownRounded sx={{ fontSize: 18 }} />}
        </button>

        {/* Center: absolute — play is always pixel-perfect centered */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <div className="flex justify-end items-center pr-2 relative" style={{ width: 120 }}>
            {isGeneratingTTS ? (
              <span className="text-[11px] text-[#1e164e] font-medium whitespace-nowrap">Generate audio...</span>
            ) : (mediaThumbsLoading.size > 0 || musicLoading.size > 0) ? (
              <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">Loading media...</span>
            ) : null}
          </div>
          <button className={iconBtn}>
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onPlayPause}
            disabled={isTranscribing}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors mx-2 ${isTranscribing ? 'bg-gray-400 cursor-not-allowed' : (isGeneratingTTS || (mediaThumbsLoading.size > 0 || musicLoading.size > 0)) ? 'bg-[#1e164e] cursor-pointer' : 'bg-[#1c1c1e] hover:bg-[#333]'}`}
          >
            {(isGeneratingTTS || (mediaThumbsLoading.size > 0 || musicLoading.size > 0))
              ? <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" /></svg>
              : isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
          </button>
          <button className={iconBtn}>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <div className="flex justify-start items-center pl-2" style={{ width: 120 }}>
            <span className="text-[12px] font-mono text-[#1c1c1e] tabular-nums whitespace-nowrap">
              {formatTimecode(displayTime)}<span className="text-gray-400"> / </span>{formatTimecode(totalDuration)}
            </span>
          </div>
        </div>

        {/* Right: zoom + volume */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button onClick={() => setPixelsPerSec(p => Math.max(MIN_PX_PER_SEC, p - 10))} className={iconBtn}>
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range" min={MIN_PX_PER_SEC} max={MAX_PX_PER_SEC} step={5}
            value={pixelsPerSec}
            onChange={e => setPixelsPerSec(Number(e.target.value))}
            className="w-20 accent-[#1c1c1e] h-1"
          />
          <button onClick={() => setPixelsPerSec(p => Math.min(MAX_PX_PER_SEC, p + 10))} className={iconBtn}>
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const el = scrollRef.current;
              if (el) setPixelsPerSec(Math.max(MIN_PX_PER_SEC, Math.min(MAX_PX_PER_SEC, (el.clientWidth - LABEL_WIDTH) / Math.max(totalDuration, 1))));
            }}
            className="px-2 h-6 text-[11px] rounded border border-gray-300 text-gray-500 hover:text-gray-800 hover:border-gray-500 transition-colors"
          >
            Fit
          </button>

          {/* Volume mixer */}
          <div className="relative" ref={volumeRef}>
            <button
              onClick={() => setShowVolumeMixer(v => !v)}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${showVolumeMixer ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            {showVolumeMixer && (
              <div className="absolute bottom-full mb-2 right-0 bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-gray-100 p-5 z-50 w-max min-w-[340px]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-[15px] text-[#1c1c1e]">Bộ trộn âm lượng</span>
                  <button onClick={() => setShowVolumeMixer(false)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
                {(['voiceover', 'media', 'audio'] as const).map(key => {
                  const label = key === 'voiceover' ? 'Lồng tiếng' : key === 'audio' ? 'Nhạc nền' : 'Media';
                  return (
                    <div key={key} className="flex items-center gap-2 mb-4 last:mb-0">
                      <span className="text-[13px] text-[#1c1c1e] shrink-0 whitespace-nowrap" style={{ width: 110 }}>{label}</span>
                      <button
                        className="shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          if (volumes[key] === 0) {
                            const restored = preMuteRef.current[key] || 100;
                            onVolumeChange?.({ ...volumes, [key]: restored });
                          } else {
                            preMuteRef.current[key] = volumes[key];
                            onVolumeChange?.({ ...volumes, [key]: 0 });
                          }
                        }}
                      >
                        {volumes[key] === 0
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 9v6h4l5 5V4L5 9H1z" fill="currentColor"/><path d="M17 9.5l5 5M22 9.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="currentColor"/></svg>
                        }
                      </button>
                      <input
                        type="range" min={0} max={100}
                        value={volumes[key]}
                        onChange={e => {
                          const newVols = { ...volumes, [key]: Number(e.target.value) };
                          onVolumeChange?.(newVols);
                        }}
                        className="flex-1 accent-[#1c1c1e]" style={{ height: 3 }}
                      />
                      <span className="text-[12px] text-gray-500 font-mono text-right shrink-0" style={{ width: 36 }}>{volumes[key]}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracks area */}
      {!isCollapsed && <div className="flex flex-1 overflow-hidden">

        {/* Label column */}
        <div className="shrink-0 flex flex-col bg-white border-r border-gray-100 overflow-hidden" style={{ width: LABEL_WIDTH }}>
          <div style={{ height: 32 }} className="border-b border-gray-100 shrink-0" />
          {TRACK_LABELS.map(({ icon, label, border }) => (
            <div
              key={label}
              className={`relative group flex items-center justify-center shrink-0 ${border ? 'border-b border-gray-100' : ''}`}
              style={{ height: TRACK_HEIGHT }}
            >
              {icon}
              <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-[11px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable tracks */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden bg-white"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
        >
          <div className="relative flex flex-col" style={{ width: Math.max(timelineWidth, containerWidth) }}>

            {/* Ruler */}
            <div
              className="relative bg-gray-50 border-b border-gray-100 cursor-pointer shrink-0"
              style={{ height: 32 }}
              onMouseDown={e => { e.preventDefault(); isDraggingPlayhead.current = true; seekFromX(e.clientX); setSelectedBlock(null); }}
            >
              {Array.from({ length: tickCount }, (_, i) => {
                const t = i * tickInterval;
                if (t === 0) return null;
                const isMajor = tickInterval >= 5 || t % (tickInterval * 5) === 0;
                return (
                  <div key={i} className="absolute top-0" style={{ left: t * pixelsPerSec }}>
                    <div className={`w-px ${isMajor ? 'h-3 bg-gray-400' : 'h-2 bg-gray-300'}`} />
                    <span className="absolute text-[10px] text-gray-400 font-mono" style={{ top: 14, left: 0, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                      {Math.floor(t / 60)}:{String(Math.floor(t % 60)).padStart(2, '0')}
                    </span>
                  </div>
                );
              })}
              <div className="absolute top-0 pointer-events-none z-10" style={{ left: playheadX, transform: 'translateX(-50%)' }}>
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[8px] border-l-transparent border-r-transparent border-t-blue-500" />
              </div>
            </div>

            {/* === Shared block UI helpers === */}
            {(() => {
              // Selection highlight overlay
              const HOVER_BORDER: Record<string, string> = {
                'blue-400': 'group-hover/block:border-blue-400',
                'emerald-400': 'group-hover/block:border-emerald-400',
                'fuchsia-400': 'group-hover/block:border-fuchsia-400',
              };
              const SelectionHighlight = ({ isActive, hoverColor = 'blue-400' }: { isActive: boolean; hoverColor?: string }) => (
                <div className={`absolute inset-0 rounded border-2 pointer-events-none z-10 transition-colors ${isActive ? 'border-blue-500' : `border-transparent ${HOVER_BORDER[hoverColor!] || 'group-hover/block:border-blue-400'}`}`} />
              );
              // Resize handles (left + right)
              const ResizeHandles = ({ isActive, track, blockId, idx }: { isActive: boolean; track: TrackType; blockId: number; idx: number }) => (
                <>
                  <div className={`absolute top-0 h-full w-3 cursor-col-resize z-20 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover/block:opacity-100'}`} style={{ left: 1 }} onMouseDown={e => startBlockDrag(e, 'resize-left', blockId, idx, track)}>
                    <div className="w-[5px] h-3/5 rounded-full bg-white/90 shadow-[0_0_4px_rgba(0,0,0,0.5)]" />
                  </div>
                  <div className={`absolute top-0 h-full w-3 cursor-col-resize z-20 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover/block:opacity-100'}`} style={{ right: 1 }} onMouseDown={e => startBlockDrag(e, 'resize-right', blockId, idx, track)}>
                    <div className="w-[5px] h-3/5 rounded-full bg-white/90 shadow-[0_0_4px_rgba(0,0,0,0.5)]" />
                  </div>
                </>
              );
              // Loop markers with tooltip
              const LoopMarkers = ({ duration, naturalDuration }: { duration: number; naturalDuration: number }) => {
                if (duration <= naturalDuration) return null;
                const markers: number[] = [];
                let t = naturalDuration;
                while (t < duration) { markers.push(t * pixelsPerSec); t += naturalDuration; }
                return <>{markers.map((mx, i) => (
                  <div key={i} className="absolute top-0 h-full z-10 cursor-help" style={{ left: mx - 4, width: 8 }} title="Lặp lại từ đây">
                    <div className="absolute left-1/2 top-0 h-full border-l-[1.5px] border-dashed border-black/30" />
                  </div>
                ))}</>;
              };
              // Block label
              const BlockLabel = ({ label, w, show = true }: { label: string; w: number; show?: boolean }) => (
                show && w > 30 ? <span className="absolute inset-0 flex items-center px-1.5 text-[9px] text-[#1c1c1e]/80 font-medium truncate z-10 pointer-events-none drop-shadow-sm">{label}</span> : null
              );
              // Track container
              const trackMouseDown = (e: React.MouseEvent) => { e.preventDefault(); isDraggingPlayhead.current = true; seekFromX(e.clientX); setSelectedBlock(null); };
              // Scissors badge — shown at top-left of a block when it has been trimmed
              // (either trimStart > 0 or duration < naturalDuration).
              const TrimBadge = ({ trimStart, duration, naturalDuration }: { trimStart?: number; duration: number; naturalDuration?: number }) => {
                const ts = trimStart ?? 0;
                const nd = naturalDuration;
                const EPS = 0.05;
                const isTrimmed = nd != null && isFinite(nd) && nd > 0 && (ts > EPS || duration + ts < nd - EPS);
                if (!isTrimmed) return null;
                return (
                  <div
                    className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] border border-gray-200 flex items-center justify-center z-20 pointer-events-none"
                    title="Đã cắt từ nguồn gốc"
                  >
                    <Scissors className="w-2.5 h-2.5 text-gray-700" />
                  </div>
                );
              };
              // Add button after last block
              const AddButton = ({ blocks, label, onClick }: { blocks: GenericBlock[]; label: string; onClick?: () => void }) => (
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={onClick}
                  className="absolute top-2 flex items-center gap-1 px-2 rounded border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-500 transition-colors text-[11px] cursor-pointer whitespace-nowrap"
                  style={{ height: TRACK_HEIGHT - 16, left: blocks.length > 0 ? Math.max(...blocks.map(b => (b.startTime + b.duration) * pixelsPerSec)) + 8 : 8 }}
                >
                  {label}
                </button>
              );

              return (<>
            {/* Voice track */}
            <div className="relative border-b border-gray-100 bg-white shrink-0" style={{ height: TRACK_HEIGHT }} onMouseDown={trackMouseDown}>
              {voiceOverBlocks.map((block, idx) => {
                const x = block.startTime * pixelsPerSec;
                const w = Math.max(block.duration * pixelsPerSec, 4);
                const color = BLOCK_COLORS[idx % BLOCK_COLORS.length];
                const isActive = selectedBlock?.track === 'voice' && selectedBlock?.id === block.id;
                return (
                  <div key={block.id} className="absolute top-2 rounded overflow-visible group/block cursor-grab active:cursor-grabbing"
                    style={{ left: x, width: w, height: TRACK_HEIGHT - 16, backgroundColor: block.audioUrl ? color.bg : 'transparent', border: `1px solid ${color.border}` }}
                    onMouseDown={e => { setSelectedBlock({ track: 'voice', id: block.id }); onVoiceBlockClick?.(block.id); startBlockDrag(e, 'move', block.id, idx); }}
                  >
                    {!block.audioUrl && (
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <defs><pattern id={`s${block.id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke={color.bg} strokeWidth="5" /></pattern></defs>
                        <rect width="100%" height="100%" fill={`url(#s${block.id})`} />
                      </svg>
                    )}
                    {w > 20 && <span className="absolute inset-0 flex items-center px-1.5 text-[9px] text-[#1c1c1e]/70 font-medium truncate z-10 pointer-events-none">{idx + 1}. {block.label}</span>}
                    <TrimBadge trimStart={block.trimStart} duration={block.duration} naturalDuration={block.naturalDuration} />
                    <SelectionHighlight isActive={isActive} />
                    <ResizeHandles isActive={isActive} track="voice" blockId={block.id} idx={idx} />
                  </div>
                );
              })}
              <AddButton blocks={voiceOverBlocks} label="+ Audio" onClick={onAddAudioBlock} />
              {playhead}
            </div>

            {/* Video/Media track */}
            <div className="relative border-b border-gray-100 bg-white shrink-0" style={{ height: TRACK_HEIGHT }} onMouseDown={trackMouseDown}>
              {mediaBlocks.map((block, idx) => {
                const x = block.startTime * pixelsPerSec;
                const w = Math.max(block.duration * pixelsPerSec, 4);
                const color = MEDIA_BLOCK_COLORS[idx % MEDIA_BLOCK_COLORS.length];
                const nd = block.naturalDuration || block.duration;
                const thumbs = mediaThumbsMap[block.id] || [];
                const hasThumbs = thumbs.length > 0;
                const isBlockLoading = mediaThumbsLoading.has(block.id);
                const isActive = selectedBlock?.track === 'media' && selectedBlock?.id === block.id;
                return (
                  <div key={block.id} className="absolute top-2 rounded overflow-visible group/block cursor-grab active:cursor-grabbing"
                    style={{ left: x, width: w, height: TRACK_HEIGHT - 16 }}
                    onMouseDown={e => { setSelectedBlock({ track: 'media', id: block.id }); startBlockDrag(e, 'move', block.id, idx, 'media'); }}
                  >
                    <div className="absolute inset-0 rounded overflow-hidden" style={{ backgroundColor: 'transparent', border: `1px solid ${color.border}` }}>
                      {hasThumbs ? (
                        <div className="relative h-full">
                          {(() => {
                            const count = Math.max(1, Math.floor(w / 80));
                            const seg = block.duration / count;
                            const trimStart = block.trimStart ?? 0;
                            return Array.from({ length: count }, (_, i) => {
                              const sourceTime = trimStart + i * seg;
                              const closest = thumbs.reduce((best, th) => Math.abs(th.time - sourceTime) < Math.abs(best.time - sourceTime) ? th : best);
                              return <img key={i} src={closest.src} className="absolute top-0 h-full object-cover" style={{ left: i * seg * pixelsPerSec, width: seg * pixelsPerSec }} alt="" />;
                            });
                          })()}
                        </div>
                      ) : block.type === 'image' && (block.thumbnailUrl || block.src) ? (
                        <div className="relative h-full">
                          {(() => {
                            const imgSrc = block.thumbnailUrl || block.src;
                            const count = Math.max(1, Math.floor(w / 80));
                            const segW = w / count;
                            return Array.from({ length: count }, (_, i) => (
                              <img key={i} src={imgSrc} className="absolute top-0 h-full object-cover" style={{ left: i * segW, width: segW }} alt="" />
                            ));
                          })()}
                        </div>
                      ) : (
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                          <defs><pattern id={`ms${block.id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke={color.bg} strokeWidth="5" /></pattern></defs>
                          <rect width="100%" height="100%" fill={`url(#ms${block.id})`} />
                        </svg>
                      )}
                      <LoopMarkers duration={block.duration} naturalDuration={nd} />
                      <BlockLabel label={block.label} w={w} show={!hasThumbs && !(block.type === 'image' && (block.thumbnailUrl || block.src))} />
                    </div>
                    <TrimBadge trimStart={block.trimStart} duration={block.duration} naturalDuration={block.type === 'image' ? undefined : block.naturalDuration} />
                    <SelectionHighlight isActive={isActive} hoverColor="emerald-400" />
                    <ResizeHandles isActive={isActive} track="media" blockId={block.id} idx={idx} />
                  </div>
                );
              })}
              <AddButton blocks={mediaBlocks} label="+ Media" onClick={onAddMediaBlock} />
              {playhead}
            </div>

            {/* Music track */}
            <div className="relative bg-white shrink-0" style={{ height: TRACK_HEIGHT }} onMouseDown={trackMouseDown}>
              {musicBlocks.map((block, idx) => {
                const x = block.startTime * pixelsPerSec;
                const w = Math.max(block.duration * pixelsPerSec, 4);
                const color = MUSIC_BLOCK_COLORS[idx % MUSIC_BLOCK_COLORS.length];
                const nd = block.naturalDuration || block.duration;
                const isActive = selectedBlock?.track === 'music' && selectedBlock?.id === block.id;
                const isMusicLoading = musicLoading.has(block.id);
                return (
                  <div key={block.id} className="absolute top-2 rounded overflow-visible group/block cursor-grab active:cursor-grabbing"
                    style={{ left: x, width: w, height: TRACK_HEIGHT - 16 }}
                    onMouseDown={e => { setSelectedBlock({ track: 'music', id: block.id }); startBlockDrag(e, 'move', block.id, idx, 'music'); }}
                  >
                    <div className="absolute inset-0 rounded overflow-hidden" style={{ backgroundColor: isMusicLoading ? 'transparent' : color.bg, border: `1px solid ${color.border}` }}>
                      {isMusicLoading && (
                        <>
                          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                            <defs><pattern id={`mu${block.id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke={color.bg} strokeWidth="5" /></pattern></defs>
                            <rect width="100%" height="100%" fill={`url(#mu${block.id})`} />
                          </svg>
                        </>
                      )}
                      <LoopMarkers duration={block.duration} naturalDuration={nd} />
                      {!isMusicLoading && <BlockLabel label={block.label} w={w} />}
                    </div>
                    <TrimBadge trimStart={block.trimStart} duration={block.duration} naturalDuration={block.naturalDuration} />
                    <SelectionHighlight isActive={isActive} hoverColor="fuchsia-400" />
                    <ResizeHandles isActive={isActive} track="music" blockId={block.id} idx={idx} />
                  </div>
                );
              })}
              <AddButton blocks={musicBlocks} label="+ Nhạc nền" onClick={onInsertMusicBlock ?? onAddBackgroundMusic} />
              {playhead}
            </div>
              </>);
            })()}

          </div>
        </div>
      </div>}
    </div>
  );
}
