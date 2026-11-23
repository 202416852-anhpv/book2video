import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { usePlaybackEngine, type PlaybackBlock } from '../hooks/usePlaybackEngine';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Settings, Volume2, List, Save, Download, Film, Music, FileAudio, ChevronDown, Undo2, Redo2 } from 'lucide-react';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import InfoRounded from '@mui/icons-material/InfoRounded';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import VoiceoverBlock from '../components/VoiceoverBlock';
import ProjectSidebar from '../components/ProjectSidebar';
import VoiceSelectionModal from '../components/VoiceSelectionModal';
import VirtualizedBlockList from '../components/VirtualizedBlockList';
import Timeline from '../components/Timeline';
import VideoPreview, { ASPECT_RATIOS, type SlideInterval } from '../components/VideoPreview';
import AddBlockButton from '../components/AddBlockButton';
import SpeedPicker from '../components/SpeedPicker';
import CaptionStyleSelector from '../components/caption/CaptionStyleSelector';
import CaptionStyleEditor from '../components/caption/CaptionStyleEditor';
import MediaLibraryModal from '../components/MediaLibraryModal';
import AudioLibraryModal from '../components/AudioLibraryModal';
import ExportModal from '../components/ExportModal';
import type { MediaBlock, MusicBlock } from '../types/timeline-blocks';
import { CAPTION_PRESETS, PRESET_LIST } from '../components/caption/caption-presets';
import type { CaptionStyleConfig, CaptionPresetId, CaptionBlock } from '../components/caption/caption-types';
import { migrateCaptionConfig } from '../components/caption/caption-migrate';
// BlockDivider integrated into VoiceoverBlock
import { transcribeVideo, type TranscribeProgress } from '../utils/transcribeVideo';
import { DEFAULT_VOICE, generateTTS, getAudioDuration, generateTTSParallel, type TTSVoice } from '../utils/ttsService';
import { measureGain, measureGainServer } from '../utils/audioNormalize';
import { useAudioGainNodes } from '../hooks/useAudioGainNodes';
import { useAutoSave } from '../hooks/useAutoSave';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { getProject } from '../utils/projectApi';
import { splitWordsEvenly } from '../utils/splitWords';
import { analytics, EXPERIMENTS } from '../utils/analytics';
import { useFeatureFlagVariantKey } from 'posthog-js/react';

interface Voice {
  id: string;
  name: string;
  category: string;
  gender: string;
  ageGroup: string;
  badge?: string;
  language: string;
  region: string;
}

// ============================================
// AUDIO STATE TYPE DEFINITIONS
// ============================================
interface MediaPlayerState {
  isPlaying: boolean;
  currentBlockIndex: number;
  currentTime: number;  // Cumulative time across all blocks
}

interface BlockPlayerState {
  isPlaying: boolean;
  currentBlockId: number | null;
  currentTime: number;  // Time within the block
}

/**
 * Group blocks that belong to the same slide (where gap between consecutive blocks <= 0.1s)
 * into a single block per slide.
 */
function mergeBlocksBySlide(rawBlocks: any[]): any[] {
  if (!rawBlocks || rawBlocks.length <= 1) return rawBlocks || [];
  // Only group if blocks have startSeconds / endSeconds timestamps
  const hasTimestamps = rawBlocks.every(b => typeof b.startSeconds === 'number' && typeof b.endSeconds === 'number');
  if (!hasTimestamps) return rawBlocks;

  // Check if any consecutive pair has gap <= 0.1s (i.e. unmerged sub-slide blocks)
  const needsMerge = rawBlocks.some((b, idx) => idx > 0 && (b.startSeconds - rawBlocks[idx - 1].endSeconds) <= 0.1);
  if (!needsMerge) return rawBlocks;

  const formatMmSs = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const groups: any[][] = [];
  for (const b of rawBlocks) {
    if (groups.length === 0) {
      groups.push([b]);
    } else {
      const prevGroup = groups[groups.length - 1];
      const prevEnd = prevGroup[prevGroup.length - 1].endSeconds;
      if (b.startSeconds - prevEnd > 0.1) {
        groups.push([b]);
      } else {
        prevGroup.push(b);
      }
    }
  }

  return groups.map((group, idx) => {
    const first = group[0];
    const last = group[group.length - 1];
    const slideId = idx + 1;
    const startSec = first.startSeconds;
    const endSec = last.endSeconds;
    const content = group.map(b => (b.content || '').trim()).filter(Boolean).join('\n');
    const words = group.flatMap(b => Array.isArray(b.words) ? b.words : []);
    return {
      ...first,
      id: slideId,
      uid: first.uid || `block_${slideId}`,
      title: `Khối ${slideId}`,
      content,
      startTime: formatMmSs(startSec),
      endTime: formatMmSs(endSec),
      startSeconds: startSec,
      endSeconds: endSec,
      words: words.length > 0 ? words : undefined,
      audioUrl: group.length === 1 ? first.audioUrl : undefined,
    };
  });
}

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  // A-B experiment: 'bold' renders a higher-emphasis export CTA. Undefined until
  // flags load or when PostHog is disabled → falls back to control.
  const exportCtaVariant = useFeatureFlagVariantKey(EXPERIMENTS.EXPORT_CTA);
  const isBoldExportCta = exportCtaVariant === 'bold';
  
  // ============================================
  // PERSIST PROJECT DATA - Save to state immediately to prevent loss
  // ============================================
  // Use location.state only for brand-new projects (navigate from create, not reload)
  const [projectData, setProjectData] = useState<any>(() => {
    const state = location.state;
    if (state && state.blocks && state.type) {
      // Clear location.state so reload won't reuse stale data
      window.history.replaceState({}, '');
      return state;
    }
    return null; // Will load from API
  });
  const [loadingProject, setLoadingProject] = useState(!projectData);

  // Load project from API
  useEffect(() => {
    if (projectData || !projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const project = await getProject(projectId);
        if (cancelled) return;
        const data = project.data || {};
        const loaded = {
          blocks: data.blocks || [],
          type: data.type || project.type || 'video',
          videoUrl: data.videoUrl,
          fileName: data.fileName,
          voice: data.voice,
          readingSpeed: data.readingSpeed,
          mediaBlocks: data.mediaBlocks || [],
          musicBlocks: data.musicBlocks || [],
          captionStyle: data.captionStyle,
          captionVisible: data.captionVisible,
          volumes: data.volumes,
          exportBgColor: data.exportBgColor,
          exportAspectIdx: data.exportAspectIdx,
          exportCustomRes: data.exportCustomRes,
          slideTextEdits: data.slideTextEdits || {},
        };
        setProjectData(loaded);
        // Hydrate all state from saved data (auto-merge blocks belonging to the same slide)
        const mergedLoadedBlocks = mergeBlocksBySlide(loaded.blocks || []);
        const newBlocks = mergedLoadedBlocks.map((block: any) => ({
          ...block,
          uid: block.uid || crypto.randomUUID(),
          voice: loaded.voice || block.voice,
          speed: loaded.readingSpeed || block.speed || '1.0x',
        }));
        setBlocks(newBlocks);
        blocksRef.current = newBlocks; // sync ref immediately to prevent auto-transcribe race
        const alreadyTranscribed = newBlocks.some((b: any) => b.content?.trim());
        if (alreadyTranscribed) hasTranscribed.current = true;
        // Open the transcribeDone gate for projects that don't need transcription:
        // non-video projects, or video projects already transcribed.
        if (loaded.type !== 'video' || alreadyTranscribed) {
          setTranscribeDone(true);
        }
        if (loaded.mediaBlocks?.length) setMediaBlocks(loaded.mediaBlocks);
        if (loaded.musicBlocks?.length) setMusicBlocks(loaded.musicBlocks);
        if (loaded.captionStyle) setCaptionStyle(migrateCaptionConfig(loaded.captionStyle));
        if (loaded.captionVisible !== undefined) setCaptionVisible(loaded.captionVisible);
        if (loaded.volumes) setVolumes(loaded.volumes);
        if (loaded.exportBgColor) setExportBgColor(loaded.exportBgColor);
        if (loaded.exportAspectIdx != null) setExportAspectIdx(loaded.exportAspectIdx);
        if (loaded.exportCustomRes) setExportCustomRes(loaded.exportCustomRes);
        if (loaded.slideTextEdits) setSlideTextEdits(loaded.slideTextEdits);
      } catch (err) {
        console.error('Failed to load project:', err);
        if (!cancelled) navigate('/');
      } finally {
        if (!cancelled) setLoadingProject(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const projectType = projectData?.type || 'video';


  // Video refs
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize blocks from location.state (sync, for new projects only)
  const initialBlocks = projectData
    ? mergeBlocksBySlide(projectData?.blocks || []).map((block: any, i: number) => ({
        ...block,
        uid: block.uid || crypto.randomUUID(),
        voice: projectData?.voice || block.voice,
        speed: projectData?.readingSpeed || block.speed || '1.0x',
      }))
    : [];

  const [blocks, setBlocks] = useState(initialBlocks);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks; // sync on every render, not via useEffect (avoids stale ref after await)
  const [selectedBlocks, setSelectedBlocks] = useState<number[]>([]);
  const [highlightedBlock, setHighlightedBlock] = useState<number | null>(null);
  
  const [selectAll, setSelectAll] = useState(false);
  
  // Voice and Speed selection
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);
  const speedDropdownRef = useRef<HTMLDivElement>(null);
  const [currentEditingBlockId, setCurrentEditingBlockId] = useState<number | null>(null);
  
  // ============================================
  // AUDIO REFS
  // ============================================
  const audioRef = useRef<HTMLAudioElement | null>(null);         // For media player (block type)
  // Persistent Audio elements — created once, never remounted by React
  const blockAudioRef = useRef<HTMLAudioElement | null>(null);    // For block TTS playback (video type)
  
  // ============================================
  // AUDIO STATES - COMPLETELY SEPARATE
  // ============================================
  const [mediaPlayerState, setMediaPlayerState] = useState<MediaPlayerState>({
    isPlaying: false,
    currentBlockIndex: 0,
    currentTime: 0,
  });
  
  
  const [blockPlayerState, setBlockPlayerState] = useState<BlockPlayerState>({
    isPlaying: false,
    currentBlockId: null,
    currentTime: 0,
  });
  
  // Audio durations (for progress calculation)
  const [blockDurations, setBlockDurations] = useState<{ [key: number]: number }>({});
  const [totalDuration, setTotalDuration] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [timelineHeight, setTimelineHeight] = useState(200);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);

  // Video export settings
  const [exportBgColor, setExportBgColor] = useState('#000000');
  const [exportAspectIdx, setExportAspectIdx] = useState(0);
  const [exportCustomRes, setExportCustomRes] = useState<{ w: number; h: number } | null>(null);
  const [slideTextEdits, setSlideTextEdits] = useState<Record<string, string>>(() => {
    return (location.state as any)?.slideTextEdits || {};
  });
  const slideTextEditsRef = useRef(slideTextEdits);
  slideTextEditsRef.current = slideTextEdits;

  const handleSlideTextChange = useCallback((elementId: string, newText: string) => {
    setSlideTextEdits(prev => ({ ...prev, [elementId]: newText }));
  }, []);

  // (isVideoExpanded effect moved below engine/gainNodes declarations)
  const [activeTab, setActiveTab] = useState<'text' | 'caption'>('text');
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showAudioLibrary, setShowAudioLibrary] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [mediaBlocks, setMediaBlocks] = useState<MediaBlock[]>(() => {
    return (location.state as any)?.mediaBlocks || [];
  });
  const [musicBlocks, setMusicBlocks] = useState<MusicBlock[]>(() => {
    return (location.state as any)?.musicBlocks || [];
  });
  const nextBlockId = useRef(1000);
  const videoBlockCreated = useRef(false);

  // Auto-create first media block from imported video.
  // Note: loudness measurement is intentionally deferred to the effect below,
  // which waits for transcribeDone — running ffmpeg loudnorm in parallel with
  // the transcribe pipeline on the same file causes contention.
  useEffect(() => {
    if (projectType !== 'video' || !projectData?.videoUrl || videoDuration <= 0 || videoBlockCreated.current) return;
    videoBlockCreated.current = true;
    const mediaBlockId = nextBlockId.current++;
    setMediaBlocks(prev => {
      if (prev.length > 0) return prev;
      return [{
        id: mediaBlockId,
        startTime: 0,
        duration: videoDuration,
        naturalDuration: videoDuration,
        type: 'video',
        src: projectData?.videoUrl,
        thumbnailUrl: '',
        label: projectData?.fileName || 'Video',
      }];
    });
    // videoUrl is always a same-origin server URL (/api/uploads/videos/...)
    // so we can always connect it to the GainNode — no CORS taint.
    if (videoRef.current) {
      gainNodes.connectElement(videoRef.current);
    }
  }, [projectType, projectData?.videoUrl, projectData?.fileName, videoDuration]);

  const initialVideoLoudnessMeasured = useRef(false);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyleConfig>(CAPTION_PRESETS['none']);
  const [captionVisible, setCaptionVisible] = useState(false);
  const [captionEditorOpen, setCaptionEditorOpen] = useState(false);
  const [isThumbnailsLoading, setIsThumbnailsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>(DEFAULT_VOICE);
  const selectedVoiceRef = useRef(selectedVoice);
  selectedVoiceRef.current = selectedVoice;
  const [transcriptionStatus, setTranscriptionStatus] = useState<TranscribeProgress | null>(null);
  // `hasTranscribed` is flipped to true only AFTER a successful transcribe (or when
  // we load a project that already has transcribed blocks). On error we leave it
  // false so the effect can retry when deps change / on reload.
  const hasTranscribed = useRef(initialBlocks.some((b: any) => b.content?.trim()));
  // Prevents the transcribe effect from firing again while a call is in-flight
  // (the effect re-runs on dependency changes like videoDuration updates).
  const transcribeInProgress = useRef(false);
  // Gate for "expensive downstream work that depends on transcription":
  // auto-save and initial-video loudness measurement. Flipped true once
  // transcribe has settled (success or error) OR when we load a project that
  // doesn't need transcription (non-video, or already transcribed).
  const [transcribeDone, setTranscribeDone] = useState<boolean>(() => {
    const state = location.state as any;
    if (state && state.type && state.type !== 'video') return true;
    if (state && state.blocks?.some((b: any) => b.content?.trim())) return true;
    return false;
  });
  const [ttsLoadingBlockIds, setTtsLoadingBlockIds] = useState<Set<number>>(new Set());
  const [isTtsGenerating, setIsTtsGenerating] = useState(false);
  const [volumes, setVolumes] = useState({ voiceover: 100, media: 100, audio: 100 });
  const volumesRef = useRef(volumes);
  volumesRef.current = volumes; // sync on every render


  // ── Auto-save (read from refs to avoid stale closures) ──
  const captionStyleRef = useRef(captionStyle);
  captionStyleRef.current = captionStyle;
  const captionVisibleRef = useRef(captionVisible);
  captionVisibleRef.current = captionVisible;

  useAutoSave(
    projectId,
    useCallback(() => ({
      blocks: blocksRef.current,
      mediaBlocks: mediaBlocksRef.current,
      musicBlocks: musicBlocksRef.current,
      captionStyle: captionStyleRef.current,
      captionVisible: captionVisibleRef.current,
      volumes: volumesRef.current,
      type: projectType,
      videoUrl: projectData?.videoUrl,
      fileName: projectData?.fileName,
      exportBgColor,
      exportAspectIdx,
      exportCustomRes,
      slideTextEdits: slideTextEditsRef.current,
    }), [projectType, projectData?.videoUrl, projectData?.fileName, exportBgColor, exportAspectIdx, exportCustomRes]),
    [blocks, mediaBlocks, musicBlocks, captionStyle, captionVisible, volumes, exportBgColor, exportAspectIdx, exportCustomRes, slideTextEdits],
    // Only fire PUT /api/projects/:id after project is loaded AND transcription
    // has settled — this prevents noisy saves while transcribe is still running.
    !loadingProject && transcribeDone,
    // Capture the baseline snapshot as soon as the project is loaded, even if
    // saves are still gated. This way the transcribe-generated state change
    // (different from the baseline) will correctly trigger one save once the
    // enable gate opens.
    !loadingProject,
  );

  // ── Undo / Redo ──
  const { push: pushToHistory, undo: undoHistory, redo: redoHistory, canUndo, canRedo } = useUndoRedo();

  const getSnapshot = useCallback(() => ({
    blocks: blocksRef.current,
    mediaBlocks: mediaBlocksRef.current,
    musicBlocks: musicBlocksRef.current,
  }), []);

  const pushHistory = useCallback(() => {
    pushToHistory(getSnapshot());
  }, [pushToHistory, getSnapshot]);

  const handleUndo = useCallback(() => {
    const prev = undoHistory(getSnapshot());
    if (!prev) return;
    setBlocks(prev.blocks);
    setMediaBlocks(prev.mediaBlocks);
    setMusicBlocks(prev.musicBlocks);
  }, [undoHistory, getSnapshot]);

  const handleRedo = useCallback(() => {
    const next = redoHistory(getSnapshot());
    if (!next) return;
    setBlocks(next.blocks);
    setMediaBlocks(next.mediaBlocks);
    setMusicBlocks(next.musicBlocks);
  }, [redoHistory, getSnapshot]);

  // ── Loudness normalization (Web Audio GainNode middleware) ──
  const gainNodes = useAudioGainNodes();

  // Measure initial video loudness ONLY after transcription has settled,
  // so we don't run two ffmpeg pipelines on the same file simultaneously
  // (transcribe's audio-extract + loudnorm would fight over the same file).
  useEffect(() => {
    if (!transcribeDone || projectType !== 'video' || !projectData?.videoUrl) return;
    if (initialVideoLoudnessMeasured.current) return;
    const videoBlock = mediaBlocks.find(mb => mb.src === projectData.videoUrl);
    if (!videoBlock) return;
    initialVideoLoudnessMeasured.current = true;
    measureGainServer(projectData.videoUrl).then(g => gainNodes.setMediaGain(videoBlock.id, g));
  }, [transcribeDone, projectType, projectData?.videoUrl, mediaBlocks]);

  // ── Playback Engine (video type only) ──
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaBlocksRef = useRef(mediaBlocks);
  mediaBlocksRef.current = mediaBlocks; // sync on every render
  const musicBlocksRef = useRef(musicBlocks);
  musicBlocksRef.current = musicBlocks; // sync on every render

  const engine = usePlaybackEngine({
    videoRef, blockAudioRef, musicAudioRef, volumesRef, mediaBlocksRef, musicBlocksRef,
    musicGainsRef: gainNodes.musicGainsRef,
    onComplete: (endTime) => {
      analytics.videoPlayCompleted({ project_id: projectId, project_type: projectType, duration: Math.round(endTime) });
    },
  });

  // Preload all image-block images so VideoPreview can show them without React render lag
  const preloadedImagesRef = useRef(new Map<string, HTMLImageElement>());
  useEffect(() => {
    for (const block of mediaBlocks) {
      if (block.type === 'image' && block.src && !preloadedImagesRef.current.has(block.src)) {
        const img = new Image();
        img.src = block.src;
        img.onload = () => { preloadedImagesRef.current.set(block.src, img); };
      }
    }
  }, [mediaBlocks]);

  // Create persistent Audio elements once — outside React lifecycle
  useEffect(() => {
    if (!blockAudioRef.current) {
      const el = new Audio();
      el.preload = 'metadata';
      blockAudioRef.current = el;
      gainNodes.connectElement(el);
    }
    if (!musicAudioRef.current) {
      const el = new Audio();
      el.preload = 'metadata';
      musicAudioRef.current = el;
    }
    if (!audioRef.current) {
      const el = new Audio();
      el.preload = 'metadata';
      audioRef.current = el;
      gainNodes.connectElement(el);
    }
    return () => {
      [blockAudioRef, musicAudioRef, audioRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.src = '';
          gainNodes.disconnectElement(ref.current);
          ref.current = null;
        }
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // #6: When toggling expanded/normal, video element remounts — re-sync via engine
  const prevVideoElRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (projectType !== 'video') return;
    const video = videoRef.current;
    if (!video) return;
    // Disconnect old element if remounted, reconnect the new one.
    // videoUrl is always a same-origin /api/uploads/... URL, so GainNode
    // connection is safe (no CORS taint).
    if (prevVideoElRef.current && prevVideoElRef.current !== video) {
      gainNodes.disconnectElement(prevVideoElRef.current);
    }
    gainNodes.connectElement(video);
    prevVideoElRef.current = video;
    const time = engine.getCurrentTime();
    const wasPlaying = engine.stateRef.current.isPlaying;
    if (wasPlaying) {
      const engineBlocks: PlaybackBlock[] = blocksRef.current.map((s: any) => ({
        id: s.id, startTime: s.startSeconds ?? 0,
        endTime: s.endSeconds ?? (s.startSeconds ?? 0) + 5,
        trimStart: s.trimStart ?? 0,
        audioUrl: s.audioUrl,
      }));
      engine.play(engineBlocks, time);
    } else {
      video.currentTime = Math.min(time, video.duration || Infinity);
    }
  }, [isVideoExpanded]);

  // Apply normalization gains when active blocks change
  useEffect(() => {
    if (engine.state.activeBlockId != null) {
      gainNodes.applyVoiceGain(blockAudioRef.current, engine.state.activeBlockId);
    }
  }, [engine.state.activeBlockId]);

  // Apply media gain only when active media block changes (not every tick)
  // Music gain NOT applied in preview — CDN URLs can't go through createMediaElementSource
  // (tainted media = silence). Music gain applied server-side during export.
  const lastMediaGainBlockRef = useRef<number | null>(null);
  useEffect(() => {
    if (projectType !== 'video') return;
    const t = engine.state.currentTime;
    const activeMedia = mediaBlocks.find(b => t >= b.startTime && t < b.startTime + b.duration);
    if (activeMedia && activeMedia.id !== lastMediaGainBlockRef.current) {
      lastMediaGainBlockRef.current = activeMedia.id;
      gainNodes.applyMediaGain(videoRef.current, activeMedia.id);
    } else if (!activeMedia) {
      lastMediaGainBlockRef.current = null;
    }
  }, [engine.state.currentTime, projectType, mediaBlocks]);

  // Sync engine state → mediaPlayerState (debounced for currentTime, immediate for isPlaying/activeBlock)
  useEffect(() => {
    if (projectType !== 'video') return;
    setMediaPlayerState(prev => {
      if (prev.isPlaying === engine.state.isPlaying && Math.abs(prev.currentTime - engine.state.currentTime) < 0.03) return prev;
      return { ...prev, isPlaying: engine.state.isPlaying, currentTime: engine.state.currentTime };
    });
  }, [engine.state.isPlaying, engine.state.currentTime, projectType]);

  useEffect(() => {
    if (projectType !== 'video') return;
    if (engine.state.activeBlockId != null) {
      setHighlightedBlock(engine.state.activeBlockId);
      setBlockPlayerState({ isPlaying: true, currentBlockId: engine.state.activeBlockId, currentTime: 0 });
    } else if (!engine.state.isPlaying) {
      setBlockPlayerState({ isPlaying: false, currentBlockId: null, currentTime: 0 });
    }
  }, [engine.state.isPlaying, engine.state.activeBlockId, projectType]);

  // ============================================
  // LOAD AUDIO DURATIONS ON MOUNT
  // ============================================
  const measuredUrlsRef = useRef(new Map<string, number>());
  useEffect(() => {
    if (blocks.length === 0) return;
    let cancelled = false;

    setBlockDurations(prev => {
      const next: { [key: number]: number } = {};
      for (const block of blocks) {
        if (!block.audioUrl) { next[block.id] = 0; continue; }
        const cached = measuredUrlsRef.current.get(block.audioUrl);
        if (cached && cached > 0) { next[block.id] = cached; continue; }
        // Preserve previously-measured value (set by ensureTTS or earlier load);
        // fall back to 30s placeholder until async measurement completes.
        const existing = prev[block.id];
        next[block.id] = existing && existing > 0 ? existing : 30;
      }
      return next;
    });
    setTotalDuration(blocks.reduce((sum, b) => sum + (measuredUrlsRef.current.get(b.audioUrl ?? '') ?? (b.audioUrl ? 30 : 0)), 0));

    // Measure actual audio duration for any unmeasured audioUrl (resize cap accuracy).
    (async () => {
      for (const block of blocks) {
        if (cancelled) return;
        if (!block.audioUrl) continue;
        if (measuredUrlsRef.current.has(block.audioUrl)) continue;
        try {
          const dur = await getAudioDuration(block.audioUrl);
          if (cancelled) return;
          if (dur > 0) {
            measuredUrlsRef.current.set(block.audioUrl, dur);
            setBlockDurations(prev => ({ ...prev, [block.id]: dur }));
          }
        } catch { /* ignore */ }
      }
    })();

    return () => { cancelled = true; };
  }, [blocks]);

  // ============================================
  // FORMAT TIME (seconds to mm:ss)
  // ============================================
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================
  // STOP MEDIA PLAYER (helper function)
  // ============================================
  const stopMediaPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setMediaPlayerState({
      isPlaying: false,
      currentBlockIndex: 0,
      currentTime: 0,
    });
  };

  // ============================================
  // STOP BLOCK PLAYER (helper function)
  // ============================================
  const stopBlockPlayer = () => {
    if (blockAudioRef.current) {
      blockAudioRef.current.pause();
      blockAudioRef.current.currentTime = 0;
    }
    setBlockPlayerState({
      isPlaying: false,
      currentBlockId: null,
      currentTime: 0,
    });
  };

  // ============================================
  // ENSURE TTS: generate if missing, return audioUrl
  // ============================================
  const ensureTTS = async (block: any): Promise<string | null> => {
    if (block.audioUrl) return block.audioUrl;
    if (!block.content?.trim()) return null;

    const voiceId = block.voice?.id || selectedVoice.id;
    const speed = block.speed?.replace('x', '') || '1.0';
    setTtsLoadingBlockIds(prev => new Set(prev).add(block.id));
    try {
      const audioUrl = await generateTTS(block.content, voiceId, speed);
      const duration = await getAudioDuration(audioUrl);
      setBlocks(prev => prev.map(s => s.id === block.id ? { ...s, audioUrl } : s));
      if (duration > 0) setBlockDurations(prev => ({ ...prev, [block.id]: duration }));
      // Measure loudness for normalization (non-blocking)
      measureGain(audioUrl).then(g => gainNodes.setVoiceGain(block.id, g));
      return audioUrl;
    } catch {
      return null;
    } finally {
      setTtsLoadingBlockIds(prev => { const next = new Set(prev); next.delete(block.id); return next; });
    }
  };

  // ============================================
  // HANDLE BLOCK CLICK (not play button)
  // ============================================
  const handleSelectBlock = (id: number) => {
    gainNodes.resumeContext();
    // Check if media player is ACTUALLY playing (from audio element, not state)
    const isMediaPlayerPlaying = audioRef.current && !audioRef.current.paused;
    
    
    // If media player is playing, SEEK to this block
    if (isMediaPlayerPlaying) {
      const blockIndex = blocks.findIndex((s: any) => s.id === id);
      if (blockIndex === -1) return;


      // Stop block player first (only one audio at a time)
      stopBlockPlayer();

      // Highlight immediately
      setHighlightedBlock(id);
      
      // Auto-scroll
      setTimeout(() => {
        const blockElement = document.getElementById(`text-block-${id}`);
        if (blockElement) {
          blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // Seek and play media player
      const block = blocks[blockIndex];
      if (block?.audioUrl && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = block.audioUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.load();
        audioRef.current.volume = volumesRef.current.voiceover / 100;
        gainNodes.applyVoiceGain(audioRef.current, block.id);

        audioRef.current.play()
          .then(() => {
            setMediaPlayerState({
              isPlaying: true,
              currentBlockIndex: blockIndex,
              currentTime: getCumulativeTime(blockIndex),
            });
          })
          .catch((error) => {
            if (error.name !== 'AbortError') {
            }
          });
      }
      
      return;
    }

    // If media player is NOT playing, set highlight and seek video preview to this block/slide
    if (projectType === 'video') {
      const targetBlock = blocks.find((s: any) => s.id === id);
      if (targetBlock && targetBlock.startSeconds != null) {
        if (!engine.stateRef.current.isPlaying) {
          const dur = (targetBlock.endSeconds ?? targetBlock.startSeconds + 5) - targetBlock.startSeconds;
          const safeTime = targetBlock.startSeconds + Math.min(0.15, Math.max(0, dur * 0.1));
          engine.seek(safeTime);
          setMediaPlayerState(prev => ({ ...prev, currentTime: safeTime }));
        }
      }
    }

    if (highlightedBlock !== id) {
      setHighlightedBlock(id);
      
      setTimeout(() => {
        const blockElement = document.getElementById(`text-block-${id}`);
        if (blockElement) {
          blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // ============================================
  // HANDLE PLAY BLOCK (play button inside block)
  // ============================================
  const handlePlayBlock = async (textBlockId: number) => {
    gainNodes.resumeContext(); // User gesture — ensure AudioContext active
    const block = blocks.find((s: any) => s.id === textBlockId);
    if (!block) return;

    // Toggle off if already playing this block — #5: also pause engine
    if (blockPlayerState.isPlaying && blockPlayerState.currentBlockId === textBlockId) {
      stopBlockPlayer();
      if (projectType === 'video') {
        if (engine.stateRef.current.isPlaying) engine.pause();
        videoRef.current?.pause();
      }
      return;
    }

    // Stop media player first
    if (projectType !== 'video') stopMediaPlayer();

    // For video blocks: TTS overlay on video
    if (projectType === 'video') {
      // Stop any ongoing engine playback
      if (engine.stateRef.current.isPlaying) engine.pause();

      const video = videoRef.current;
      if (!video) return;

      // Ensure TTS audio (generate if missing)
      const audioUrl = await ensureTTS(block);
      if (!audioUrl) return;

      // Seek video to block start, apply user volume, play
      video.currentTime = block.startSeconds ?? 0;
      video.volume = volumesRef.current.media / 100;
      video.muted = volumesRef.current.media === 0;
      video.play().catch(() => {});

      const blockAudio = blockAudioRef.current;
      if (blockAudio) {
        blockAudio.src = audioUrl;
        blockAudio.currentTime = 0;
        blockAudio.volume = volumesRef.current.voiceover / 100;
        gainNodes.applyVoiceGain(blockAudio, textBlockId);
        const segDur = (block.endSeconds ?? 0) - (block.startSeconds ?? 0);
        const globalRate = video.playbackRate;
        const applyBlockRate = () => {
          const dur = blockAudio.duration;
          if (dur && isFinite(dur) && segDur > 0) {
            blockAudio.playbackRate = Math.min(dur / segDur, 3.0) * globalRate;
          } else {
            blockAudio.playbackRate = globalRate;
          }
        };
        // #5: use assignment instead of addEventListener — auto-replaces, no leak
        blockAudio.onloadedmetadata = () => applyBlockRate();
        blockAudio.play().then(() => {
          if (blockAudio.duration && isFinite(blockAudio.duration)) applyBlockRate();
        }).catch(() => {});
      }

      setBlockPlayerState({ isPlaying: true, currentBlockId: textBlockId, currentTime: 0 });
      setHighlightedBlock(textBlockId);
      // Update timeline cursor to block start (mediaPlayerState.isPlaying stays false)
      setMediaPlayerState(prev => ({ ...prev, currentTime: block.startSeconds ?? 0 }));
      return;
    }

    // For blocks with audio
    const audioUrl = await ensureTTS(block);
    if (!audioUrl) return;

    setBlockPlayerState({ isPlaying: true, currentBlockId: textBlockId, currentTime: 0 });
  };

  // ============================================
  // BLOCK AUDIO: ended → stop video + seek back (single block play only)
  // ============================================
  useEffect(() => {
    const blockAudio = blockAudioRef.current;
    if (!blockAudio) return;

    const handleEnded = () => {
      // Skip if engine is driving playback
      if (engine.stateRef.current.isPlaying) return;

      const blockId = blockPlayerState.currentBlockId;
      const block = blockId != null ? blocks.find((s: any) => s.id === blockId) : null;

      stopBlockPlayer();

      // #4: Stop video, seek back, sync engine time
      if (projectType === 'video' && videoRef.current) {
        videoRef.current.pause();
        if (block?.startSeconds != null) {
          videoRef.current.currentTime = block.startSeconds;
          engine.syncTime(block.startSeconds);
          setMediaPlayerState(prev => ({ ...prev, currentTime: block.startSeconds, isPlaying: false }));
        }
      }
    };

    blockAudio.addEventListener('ended', handleEnded);
    return () => blockAudio.removeEventListener('ended', handleEnded);
  }, [blockPlayerState.currentBlockId, blocks, projectType]);

  // ============================================
  // ============================================
  // LEGACY: playSessionRef kept for handlePlayBlock (single-block play)
  // ============================================
  const playSessionRef = useRef(0);

  // #7: stopVideoPlayback delegates to engine
  const stopVideoPlayback = () => {
    playSessionRef.current++;
    engine.pause();
    setMediaPlayerState(prev => ({ ...prev, isPlaying: false }));
    stopBlockPlayer();
  };

  // ============================================
  // HANDLE PLAY MEDIA PLAYER (bottom player / timeline)
  // ============================================
  const handlePlayMediaPlayer = async () => {
    gainNodes.resumeContext(); // Ensure AudioContext is active on user gesture
    // For VIDEO type — generate all TTS first, then play via engine
    if (projectType === 'video' && videoRef.current) {
      if (engine.stateRef.current.isPlaying) {
        engine.pause();
        analytics.videoPause({ project_id: projectId, project_type: projectType, at: Math.round(engine.getCurrentTime()) });
        setMediaPlayerState(prev => ({ ...prev, isPlaying: false, currentTime: engine.getCurrentTime() }));
        stopBlockPlayer();
        return;
      }

      if (isTtsGenerating) {
        playSessionRef.current++;
        setIsTtsGenerating(false);
        return;
      }

      stopBlockPlayer();

      // Generate TTS for blocks that need it
      const cancelToken = ++playSessionRef.current;
      const blocksNeedTTS = blocksRef.current.filter((s: any) => !s.audioUrl && s.content?.trim());
      if (blocksNeedTTS.length > 0) {
        setIsTtsGenerating(true);
        await generateAllTTS(blocksNeedTTS, selectedVoice.id);
        setIsTtsGenerating(false);
        // Wait for React to flush all setBlocks updates into blocksRef
        await new Promise(r => setTimeout(r, 50));
        if (playSessionRef.current !== cancelToken) return;
      }

      // Map blocks → engine blocks (blocksRef now has all audioUrls)
      const engineBlocks: PlaybackBlock[] = blocksRef.current.map((s: any) => ({
        id: s.id,
        startTime: s.startSeconds ?? 0,
        endTime: s.endSeconds ?? (s.startSeconds ?? 0) + 5,
        trimStart: s.trimStart ?? 0,
        audioUrl: s.audioUrl,
      }));

      engine.play(engineBlocks, engine.getCurrentTime());
      analytics.videoPlay({ project_id: projectId, project_type: projectType, block_count: engineBlocks.length });
      return;
    }

    // For legacy type with audio
    // If playing, PAUSE
    if (mediaPlayerState.isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setMediaPlayerState(prev => ({ ...prev, isPlaying: false }));
      return;
    }

    // STOP BLOCK PLAYER first
    stopBlockPlayer();

    // Determine start index
    let startIndex = 0;
    
    if (highlightedBlock !== null) {
      startIndex = blocks.findIndex((s: any) => s.id === highlightedBlock);
    } else if (selectedBlocks.length > 0) {
      startIndex = blocks.findIndex((s: any) => s.id === selectedBlocks[0]);
    }

    if (startIndex === -1) startIndex = 0;

    const block = blocks[startIndex];
    if (!block || !block.audioUrl) return;

    // SET STATE FIRST (immediately)
    setMediaPlayerState({
      isPlaying: true,
      currentBlockIndex: startIndex,
      currentTime: getCumulativeTime(startIndex),
    });

    // Play from media player
    if (audioRef.current) {
      audioRef.current.src = block.audioUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.load();
      audioRef.current.volume = volumesRef.current.voiceover / 100;
      gainNodes.applyVoiceGain(audioRef.current, block.id);

      audioRef.current.play()
        .then(() => {
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            // If error, revert state
            setMediaPlayerState(prev => ({ ...prev, isPlaying: false }));
          }
        });
    }
  };

  // ============================================
  // GET CUMULATIVE TIME (for a given block index)
  // ============================================
  const getCumulativeTime = (blockIndex: number) => {
    let cumulative = 0;
    for (let i = 0; i < blockIndex; i++) {
      cumulative += blockDurations[blocks[i]?.id] || 0;
    }
    return cumulative;
  };

  // ============================================
  // MEDIA PLAYER: Auto-play next block when ended
  // ============================================
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (!mediaPlayerState.isPlaying) return;

      const nextIndex = mediaPlayerState.currentBlockIndex + 1;
      if (nextIndex < blocks.length) {
        const nextBlock = blocks[nextIndex];
        if (nextBlock?.audioUrl) {
          audio.src = nextBlock.audioUrl;
          audio.load();
          audio.volume = volumesRef.current.voiceover / 100;
          gainNodes.applyVoiceGain(audio, nextBlock.id);
          audio.play()
            .then(() => {
              setMediaPlayerState({
                isPlaying: true,
                currentBlockIndex: nextIndex,
                currentTime: getCumulativeTime(nextIndex),
              });
            });
        } else {
          stopMediaPlayer();
        }
      } else {
        // Reached end
        stopMediaPlayer();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [mediaPlayerState.isPlaying, mediaPlayerState.currentBlockIndex, blocks, blockDurations]);

  // ============================================
  // MEDIA PLAYER: Update current time
  // ============================================
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (mediaPlayerState.isPlaying) {
        const cumulativeTime = getCumulativeTime(mediaPlayerState.currentBlockIndex) + audio.currentTime;
        setMediaPlayerState(prev => ({ ...prev, currentTime: cumulativeTime }));
        
        // Auto-highlight current block
        const currentBlock = blocks[mediaPlayerState.currentBlockIndex];
        if (currentBlock && highlightedBlock !== currentBlock.id) {
          setHighlightedBlock(currentBlock.id);
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (!mediaPlayerState.isPlaying) return;
      
      const currentBlockId = blocks[mediaPlayerState.currentBlockIndex]?.id;
      if (currentBlockId && audio.duration && !isNaN(audio.duration)) {
        const actualDuration = audio.duration;
        const storedDuration = blockDurations[currentBlockId];
        
        if (Math.abs(storedDuration - actualDuration) > 1) {
          setBlockDurations(prev => {
            const updated = { ...prev, [currentBlockId]: actualDuration };
            const newTotal = Object.values(updated).reduce((sum, d) => sum + d, 0);
            setTotalDuration(newTotal);
            return updated;
          });
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [mediaPlayerState.isPlaying, mediaPlayerState.currentBlockIndex, blocks, blockDurations]);

  // ============================================
  // HANDLE PROGRESS BAR CLICK (seek)
  // ============================================
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !mediaPlayerState.isPlaying) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetCumulativeTime = percentage * totalDuration;

    // Find which block this time belongs to
    let cumulative = 0;
    let targetBlockIndex = 0;
    let timeWithinBlock = 0;

    for (let i = 0; i < blocks.length; i++) {
      const blockDur = blockDurations[blocks[i]?.id] || 0;
      if (targetCumulativeTime >= cumulative && targetCumulativeTime < cumulative + blockDur) {
        targetBlockIndex = i;
        timeWithinBlock = targetCumulativeTime - cumulative;
        break;
      }
      cumulative += blockDur;
    }

    const targetBlock = blocks[targetBlockIndex];
    if (!targetBlock) return;

    // Seek to target block and time
    const audio = audioRef.current;
    audio.src = targetBlock.audioUrl;
    audio.currentTime = timeWithinBlock;
    audio.load();
    audio.volume = volumesRef.current.voiceover / 100;
    gainNodes.applyVoiceGain(audio, targetBlock.id);

    if (mediaPlayerState.isPlaying) {
      audio.play();
    }

    setMediaPlayerState({
      isPlaying: mediaPlayerState.isPlaying,
      currentBlockIndex: targetBlockIndex,
      currentTime: targetCumulativeTime,
    });

    setHighlightedBlock(targetBlock.id);

    setTimeout(() => {
      const blockElement = document.getElementById(`text-block-${targetBlock.id}`);
      if (blockElement) {
        blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // ============================================
  // CHECKBOX CHANGE
  // ============================================
  const handleCheckboxChange = (id: number) => {
    if (selectedBlocks.includes(id)) {
      setSelectedBlocks(selectedBlocks.filter(textBlockId => textBlockId !== id));
    } else {
      setSelectedBlocks([...selectedBlocks, id]);
    }
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedBlocks([]);
    } else {
      setSelectedBlocks(blocks.map((b: any) => b.id));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = () => {
    pushHistory();
    setBlocks((prev: any[]) => reindex(prev.filter((block) => !selectedBlocks.includes(block.id))));
    setSelectedBlocks([]);
    setSelectAll(false);
  };


  const handleContentChange = (textBlockId: number, newContent: string) => {
    pushHistory();
    setBlocks((prev: any[]) =>
      prev.map((block) =>
        block.id === textBlockId ? { ...block, content: newContent, audioUrl: undefined, words: undefined } : block
      )
    );
  };

  const handleSelectVoice = (voice: Voice | TTSVoice) => {
    if ('id' in voice) setSelectedVoice(voice as TTSVoice);
    pushHistory();
    if (currentEditingBlockId !== null) {
      setBlocks((prev: any[]) =>
        prev.map((block) =>
          block.id === currentEditingBlockId
            ? { ...block, voice: voice, audioUrl: undefined }
            : block
        )
      );
      setCurrentEditingBlockId(null);
    } else {
      setBlocks((prev: any[]) =>
        prev.map((block) => {
          if (selectedBlocks.includes(block.id)) {
            return { ...block, voice: voice, audioUrl: undefined };
          }
          return block;
        })
      );
    }
    setShowVoiceModal(false);
  };

  const handleDeleteFromHere = useCallback((textBlockId: number) => {
    const idx = blocks.findIndex((s: any) => s.id === textBlockId);
    if (idx === -1) return;
    pushHistory();
    setBlocks((prev: any[]) => reindex(prev.slice(0, idx)));
  }, [blocks, pushHistory]);

  const handleVoiceClick = (textBlockId: number) => {
    setCurrentEditingBlockId(textBlockId);
    setShowVoiceModal(true);
  };

  const handleSelectSpeed = (speed: string) => {
    pushHistory();
    setBlocks((prev: any[]) =>
      prev.map((block) => {
        if (selectedBlocks.includes(block.id) && block.speed !== speed) {
          return { ...block, speed, audioUrl: undefined };
        }
        return block;
      })
    );
    setShowSpeedDropdown(false);
  };

  const handleBlockSpeedChange = (blockId: number, speed: string) => {
    pushHistory();
    setBlocks((prev: any[]) =>
      prev.map((block) => {
        if (block.id === blockId && block.speed !== speed) {
          return { ...block, speed, audioUrl: undefined };
        }
        return block;
      })
    );
  };

  // ============================================
  // HANDLE DELETE BLOCK (for video type)
  // ============================================
  // Re-index blocks: sequential IDs and titles
  const nextUid = () => crypto.randomUUID();

  const reindex = (arr: any[]) => {
    const oldGains = new Map<string, number>(); // audioUrl → gain
    arr.forEach(s => {
      if (s.audioUrl) {
        const g = gainNodes.voiceGainsRef.current.get(s.id);
        if (g != null) oldGains.set(s.audioUrl, g);
      }
    });
    const result = arr.map((s, i) => ({
      ...s,
      id: i + 1,
      title: `Khối ${i + 1}`,
      uid: s.uid || nextUid(), // preserve existing uid, assign new for fresh blocks
    }));
    // Rebuild gain map with new IDs
    gainNodes.voiceGainsRef.current.clear();
    result.forEach(s => {
      if (s.audioUrl && oldGains.has(s.audioUrl)) {
        gainNodes.voiceGainsRef.current.set(s.id, oldGains.get(s.audioUrl)!);
      }
    });
    return result;
  };

  const handleDeleteBlock = (id: number) => {
    pushHistory();
    setBlocks((prev: any[]) => reindex(prev.filter((s) => s.id !== id)));
  };

  // ============================================
  // HANDLE ADD NEW BLOCK (for video type)
  // ============================================
  const [autoEditBlockId, setAutoEditBlockId] = useState<number | null>(null);

  /** Scroll + focus a newly created block after React renders it. */
  const focusNewBlock = useCallback((blockId: number) => {
    // Immediately blur whatever has focus (e.g. AddBlockButton) to prevent
    // spacebar from re-triggering button click while we wait for the textarea.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setHighlightedBlock(blockId);
    setAutoEditBlockId(blockId);
  }, []);

  const handleAddBlock = () => {
    pushHistory();
    stopVideoPlayback();
    let newBlockId: number;
    setBlocks((prev: any[]) => {
      const lastBlock = prev[prev.length - 1];
      const startSec = lastBlock?.endSeconds ?? 0;
      const updated = reindex([...prev, {
        id: 0,
        title: '',
        content: '',
        imageUrl: null,
        previewUrl: undefined,
        audioUrl: undefined,
        selected: false,
        type: 'video' as const,
        startTime: formatTime(startSec),
        endTime: formatTime(startSec + 5),
        startSeconds: startSec,
        endSeconds: startSec + 5,
        voice: lastBlock?.voice || selectedVoiceRef.current,
        speed: lastBlock?.speed || '1.0x',
      }]);
      newBlockId = updated[updated.length - 1].id;
      return updated;
    });
    focusNewBlock(newBlockId!);
  };

  // Insert a new block after the given index
  const handleInsertBlock = (afterIndex: number) => {
    pushHistory();
    stopVideoPlayback();
    let newBlockId: number;
    setBlocks((prev: any[]) => {
      const prevBlock = prev[afterIndex];
      const nextBlock = prev[afterIndex + 1];
      const startSec = prevBlock?.endSeconds ?? 0;
      const endSec = nextBlock?.startSeconds ?? startSec + 5;
      const next = [...prev];
      next.splice(afterIndex + 1, 0, {
        id: 0,
        title: '',
        content: '',
        imageUrl: null,
        previewUrl: undefined,
        audioUrl: undefined,
        selected: false,
        type: 'video' as const,
        startTime: formatTime(startSec),
        endTime: formatTime(endSec),
        startSeconds: startSec,
        endSeconds: endSec,
        voice: prevBlock?.voice || selectedVoiceRef.current,
        speed: prevBlock?.speed || '1.0x',
      });
      const updated = reindex(next);
      newBlockId = updated[afterIndex + 1].id;
      return updated;
    });
    focusNewBlock(newBlockId!);
  };

  // ── Cmd+Enter / Ctrl+Enter → create new block ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Blur textarea first so content is saved before creating new block
        const active = document.activeElement;
        if (active instanceof HTMLTextAreaElement) {
          active.blur();
        }
        if (highlightedBlock != null) {
          // Insert after the highlighted (active) block
          const idx = blocksRef.current.findIndex((b: any) => b.id === highlightedBlock);
          if (idx >= 0) {
            handleInsertBlock(idx);
            return;
          }
        }
        // No active block → add at end
        handleAddBlock();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [highlightedBlock]); // eslint-disable-line react-hooks/exhaustive-deps

  // Undo / Redo keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  // Merge block[index] and block[index+1] into one
  const handleMergeBlocks = (index: number) => {
    pushHistory();
    setBlocks((prev: any[]) => {
      if (index < 0 || index + 1 >= prev.length) return prev;
      const blockA = prev[index];
      const blockB = prev[index + 1];
      const merged = {
        ...blockA,
        content: [blockA.content, blockB.content].filter(Boolean).join(' '),
        endTime: blockB.endTime,
        endSeconds: blockB.endSeconds,
        audioUrl: undefined,
        words: undefined,
      };
      const next = [...prev];
      next.splice(index, 2, merged);
      return reindex(next);
    });
  };

  // ============================================
  // HANDLE ADD BACKGROUND MUSIC
  // ============================================
  const handleAddBackgroundMusic = () => {
    // TODO: Implement background music upload
  };

  const handleVolumeChange = useCallback((vols: { voiceover: number; media: number; audio: number }) => {
    volumesRef.current = vols;
    setVolumes(vols);
    // Apply immediately to DOM elements (single source, no useEffect race)
    if (projectType === 'video') {
      engine.setVolume('media', vols.media);
      engine.setVolume('voiceover', vols.voiceover);
      engine.setVolume('audio', vols.audio);
    } else {
      if (videoRef.current) {
        videoRef.current.volume = vols.media / 100;
        videoRef.current.muted = vols.media === 0;
      }
      if (audioRef.current) {
        audioRef.current.volume = vols.voiceover / 100;
        audioRef.current.muted = vols.voiceover === 0;
      }
      if (musicAudioRef.current) {
        musicAudioRef.current.volume = vols.audio / 100;
        musicAudioRef.current.muted = vols.audio === 0;
      }
    }
  }, [projectType, engine]);

  const handlePlaybackSpeedChange = useCallback((speed: number) => {
    if (projectType === 'video') {
      engine.setPlaybackRate(speed);
    } else {
      if (videoRef.current) videoRef.current.playbackRate = speed;
      if (audioRef.current) audioRef.current.playbackRate = speed;
    }
  }, [projectType, engine]);

  // Close download menu on outside click
  useEffect(() => {
    if (!showDownloadMenu) return;
    const handler = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) setShowDownloadMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDownloadMenu]);

  const handleExportSRT = useCallback(() => {
    setShowDownloadMenu(false);
    const formatSrtTime = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      const ms = Math.round((sec % 1) * 1000);
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
    };
    const srt = blocks
      .filter((s: any) => s.content?.trim())
      .map((s: any, i: number) => {
        const start = formatSrtTime(s.startSeconds ?? 0);
        const end = formatSrtTime(s.endSeconds ?? (s.startSeconds ?? 0) + 5);
        return `${i + 1}\n${start} --> ${end}\n${s.content.trim()}`;
      })
      .join('\n\n');
    const blob = new Blob([srt], { type: 'text/srt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectData?.fileName?.replace(/\.[^.]+$/, '') || 'export'}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [blocks, projectData?.fileName]);

  const handleBlockChange = useCallback((blockId: number, startTime: number, duration: number, trimStart: number) => {
    setBlocks((prev: any[]) =>
      prev.map(s => s.id === blockId ? {
        ...s,
        startSeconds: startTime,
        endSeconds: startTime + duration,
        startTime: formatTime(startTime),
        endTime: formatTime(startTime + duration),
        trimStart,
        words: undefined,
      } : s)
    );
    engine.resetTracking();
  }, [engine]);

  const handleMediaBlockChange = useCallback((blockId: number, startTime: number, duration: number, trimStart: number) => {
    setMediaBlocks(prev => prev.map(b => b.id === blockId ? { ...b, startTime, duration, trimStart } : b));
    engine.resetTracking();
  }, [engine]);

  const handleMusicBlockChange = useCallback((blockId: number, startTime: number, duration: number, trimStart: number) => {
    setMusicBlocks(prev => prev.map(b => b.id === blockId ? { ...b, startTime, duration, trimStart } : b));
    engine.resetTracking();
  }, [engine]);

  const handleDeleteMediaBlock = useCallback((blockId: number) => {
    pushHistory();
    setMediaBlocks(prev => prev.filter(b => b.id !== blockId));
    engine.resetTracking();
  }, [engine, pushHistory]);

  const handleDeleteMusicBlock = useCallback((blockId: number) => {
    pushHistory();
    setMusicBlocks(prev => prev.filter(b => b.id !== blockId));
    engine.resetTracking();
  }, [engine, pushHistory]);

  const handleAddMediaBlock = useCallback((item: any) => {
    pushHistory();
    stopVideoPlayback();
    const isVideo = item.type === 'video' || (item.durationMs != null && item.durationMs > 0);
    const naturalDuration = item.durationMs ? item.durationMs / 1000 : 5;
    const id = nextBlockId.current++;
    setMediaBlocks(prev => {
      const lastEnd = prev.length > 0 ? Math.max(...prev.map(b => b.startTime + b.duration)) : 0;
      return [...prev, {
        id, startTime: lastEnd, duration: naturalDuration, naturalDuration, trimStart: 0,
        type: isVideo ? 'video' : 'image',
        src: item.cdnUrl, thumbnailUrl: item.thumbnailUrl || item.previewUrl || item.cdnUrl,
        label: item.name,
      }];
    });
    // Measure media audio loudness (non-blocking)
    if (isVideo && item.cdnUrl) {
      measureGainServer(item.cdnUrl).then(g => gainNodes.setMediaGain(id, g));
    }
    setShowMediaLibrary(false);
  }, [pushHistory]);

  const handleInsertMusicBlock = useCallback((item: any) => {
    pushHistory();
    stopVideoPlayback();
    const dur = item.duration && item.duration > 0 ? item.duration : 10; // fallback 10s
    const id = nextBlockId.current++;
    setMusicBlocks(prev => {
      const lastEnd = prev.length > 0 ? Math.max(...prev.map(b => b.startTime + b.duration)) : 0;
      return [...prev, {
        id, startTime: lastEnd, duration: dur, naturalDuration: dur, trimStart: 0,
        url: item.url, label: item.name, artist: item.artist,
      }];
    });
    // Measure loudness for normalization (non-blocking, bypass CORS)
    measureGainServer(item.url).then(g => gainNodes.setMusicGain(id, g));
    setShowAudioLibrary(false);
  }, [pushHistory]);

  // ============================================
  // EXPORT PAYLOAD
  // ============================================
  // No dimension calculation here — backend detects from source video

  const getExportPayload = useCallback(() => {
    // Use TTS audio duration (if generated) as a better fallback than the
    // fixed 5s default — this keeps captions in sync with actual audio length.
    const endOf = (s: any) => s.endSeconds ?? (s.startSeconds ?? 0) + (blockDurations[s.id] || 5);
    const voiceBlocks = blocks.map((s: any) => ({
      id: s.id,
      startTime: s.startSeconds ?? 0,
      endTime: endOf(s),
      audioUrl: s.audioUrl || null,
      gain: gainNodes.voiceGainsRef.current.get(s.id) ?? 1,
    }));
    const capBlocks = blocks.map((s: any) => {
      const text = s.content || '';
      const startTime = s.startSeconds ?? 0;
      const endTime = endOf(s);
      return {
        id: s.id,
        text,
        startTime,
        endTime,
        words: s.words || (text ? splitWordsEvenly(text, startTime, endTime) : []),
      };
    });
    const lastVoiceEnd = voiceBlocks.length > 0 ? Math.max(...voiceBlocks.map((b: any) => b.endTime || 0)) : 0;
    const lastMediaEnd = mediaBlocks.length > 0 ? Math.max(...mediaBlocks.map(b => b.startTime + b.duration)) : 0;
    const lastMusicEnd = musicBlocks.length > 0 ? Math.max(...musicBlocks.map(b => b.startTime + b.duration)) : 0;
    const exportDuration = Math.max(lastVoiceEnd, lastMediaEnd, lastMusicEnd, 1);

    return {
      mediaBlocks,
      musicBlocks,
      voiceBlocks,
      captions: captionVisible ? capBlocks : [],
      captionStyle,
      totalDuration: exportDuration,
      volumes,
      musicGains: Object.fromEntries(gainNodes.musicGainsRef.current),
      mediaGains: Object.fromEntries(gainNodes.mediaGainsRef.current),
      aspectRatio: ASPECT_RATIOS[exportAspectIdx].id,  // 'original' | '16:9' | '9:16' | '4:5' | '1:1'
      bgColor: exportBgColor,
      fps: 30,
    };
  }, [blocks, blockDurations, mediaBlocks, musicBlocks, captionStyle, captionVisible, volumes, exportBgColor, exportAspectIdx]);

  // ============================================
  // AUTO-TRANSCRIBE VIDEO ON LOAD
  // ============================================
  useEffect(() => {
    if (projectType !== 'video' || !projectData?.videoUrl || !videoDuration) return;
    if (hasTranscribed.current || transcribeInProgress.current) return;
    // Skip if blocks already loaded from saved project (already transcribed before)
    if (blocksRef.current.some((b: any) => b.content?.trim())) {
      hasTranscribed.current = true;
      setTranscribeDone(true);
      return;
    }

    let cancelled = false;
    const currentProjectId = projectId;
    transcribeInProgress.current = true;
    transcribeVideo(projectData.videoUrl, (progress) => {
      if (!cancelled) setTranscriptionStatus(progress);
    }).then(segments => {
      if (cancelled || projectId !== currentProjectId) return;
      hasTranscribed.current = true;
      if (segments.length === 0) return;
      const newBlocks = segments.map((seg, i) => ({
        id: i + 1,
        uid: crypto.randomUUID(),
        title: `Khối ${i + 1}`,
        content: seg.text,
        imageUrl: null,
        audioUrl: undefined,
        selected: false,
        type: 'video' as const,
        startTime: formatTime(seg.startSeconds),
        endTime: formatTime(seg.endSeconds),
        startSeconds: seg.startSeconds,
        endSeconds: seg.endSeconds,
        words: seg.words,
        voice: selectedVoiceRef.current,
      }));
      setBlocks(newBlocks);

      const durations: { [key: number]: number } = {};
      newBlocks.forEach(s => { durations[s.id] = (s.endSeconds ?? 0) - (s.startSeconds ?? 0); });
      setBlockDurations(durations);
    }).catch(() => {
      // Leave hasTranscribed=false so a future reload / deps-change can retry.
    }).finally(() => {
      transcribeInProgress.current = false;
      if (!cancelled) setTranscribeDone(true);
    });

    return () => { cancelled = true; };
  }, [projectType, projectData?.videoUrl, videoDuration]);

  // Generate TTS for all blocks in parallel (concurrency = 5)
  const generateAllTTS = async (blocksToProcess: any[], voiceId: string) => {
    // Mark all blocks as loading
    const blockIds = blocksToProcess.map((s: any) => s.id);
    setTtsLoadingBlockIds(new Set(blockIds));

    await generateTTSParallel(
      blocksToProcess,
      voiceId,
      5,
      (blockId, audioUrl, duration) => {
        setBlocks(prev => {
          const updated = prev.map(s => s.id === blockId ? { ...s, audioUrl } : s);
          blocksRef.current = updated; // sync ref immediately, don't wait for render
          return updated;
        });
        if (duration > 0) setBlockDurations(prev => ({ ...prev, [blockId]: duration }));
        // Measure loudness for normalization (non-blocking)
        measureGain(audioUrl).then(g => gainNodes.setVoiceGain(blockId, g));
        // Remove from loading set as each block completes
        setTtsLoadingBlockIds(prev => { const next = new Set(prev); next.delete(blockId); return next; });
      },
    );

    // Clear all loading
    setTtsLoadingBlockIds(new Set());
  };

  // ============================================
  // HANDLE TIMELINE SEEK
  // ============================================
  const handleTimelineSeek = (time: number) => {
    if (projectType === 'video') {
      engine.seek(time);
      setMediaPlayerState(prev => ({ ...prev, currentTime: time }));
    } else {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.min(time, videoRef.current.duration || Infinity);
      }
      setMediaPlayerState(prev => ({ ...prev, currentTime: time }));
    }

    // Find block at this time for highlight
    const blockAtTime = blocks.find((s: any) =>
      s.startSeconds != null && s.endSeconds != null &&
      time >= s.startSeconds && time < s.endSeconds
    );

    if (!engine.stateRef.current.isPlaying) {
      setHighlightedBlock(blockAtTime?.id ?? null);
      if (blockAtTime) {
        setTimeout(() => {
          const el = document.getElementById(`text-block-${blockAtTime.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  };
  
  const handleVoiceBlockClick = (id: number) => {
    if (mediaPlayerState.isPlaying || (audioRef.current && !audioRef.current.paused)) return;
    const targetBlock = blocks.find((s: any) => s.id === id);
    if (projectType === 'video' && targetBlock?.startSeconds != null && !engine.stateRef.current.isPlaying) {
      const dur = (targetBlock.endSeconds ?? targetBlock.startSeconds + 5) - targetBlock.startSeconds;
      const safeTime = targetBlock.startSeconds + Math.min(0.15, Math.max(0, dur * 0.1));
      engine.seek(safeTime);
      setMediaPlayerState(prev => ({ ...prev, currentTime: safeTime }));
    }
    setHighlightedBlock(id);
    setTimeout(() => {
      const el = document.getElementById(`text-block-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  // ============================================
  // RENDER LAYOUT BASED ON PROJECT TYPE
  // ============================================

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <p className="text-gray-500">Đang tải dự án...</p>
      </div>
    );
  }

  // For VIDEO type - Split layout with timeline
  if (projectType === 'video') {
    // Compute voice track blocks — use video segment timestamps for position/size
    const voiceOverBlocks = blocks.map((block: any) => {
      const segDur = (block.endSeconds - block.startSeconds) || 5;
      return {
        id: block.id,
        startTime: block.startSeconds ?? 0,
        duration: segDur,
        trimStart: block.trimStart ?? 0,
        naturalDuration: blockDurations[block.id],
        audioUrl: block.audioUrl,
        label: block.content || '',
      };
    });

    // Total duration = max(video, last voiceover end)
    const lastVoiceEnd = voiceOverBlocks.length > 0
      ? Math.max(...voiceOverBlocks.map(b => b.startTime + b.duration))
      : 0;
    const lastMediaEnd = mediaBlocks.length > 0 ? Math.max(...mediaBlocks.map(b => b.startTime + b.duration)) : 0;
    const lastMusicEnd = musicBlocks.length > 0 ? Math.max(...musicBlocks.map(b => b.startTime + b.duration)) : 0;
    const effectiveTotalDuration = Math.max(lastVoiceEnd, lastMediaEnd, lastMusicEnd, 10);

    // Active media block at current time (for video preview switching)
    const ct = mediaPlayerState.currentTime;
    const activeMedia = mediaBlocks.find(b => ct >= b.startTime && ct < b.startTime + b.duration);
    const activeMediaSrc = activeMedia?.src || null;
    const activeMediaType = activeMedia?.type || null;
    const hasActiveMedia = !!activeMedia;

    // Caption blocks derived from blocks (with word-level timing for v2)
    const captionBlocks: CaptionBlock[] = blocks.map((block: any) => {
      const startTime = block.startSeconds ?? 0;
      const endTime = block.endSeconds ?? startTime + (blockDurations[block.id] || 5);
      const text = block.content || '';
      return {
        id: block.id,
        text,
        startTime,
        endTime,
        words: block.words || (text ? splitWordsEvenly(text, startTime, endTime) : undefined),
      };
    });

    // Each block now corresponds 1-to-1 with a slide
    const effectiveSlides: SlideInterval[] = blocks.map((b: any, idx: number) => ({
      slideNumber: idx + 1,
      startTime: b.startSeconds ?? 0,
      endTime: b.endSeconds ?? (b.startSeconds ?? 0) + (blockDurations[b.id] || 5),
    }));

    return (
      <div className="h-screen bg-[#f6f6f6] flex overflow-hidden">
        {/* Sidebar */}
        <div className="fixed top-0 left-0 h-screen z-20">
          <ProjectSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 ml-[80px] overflow-hidden" style={{ paddingBottom: timelineHeight }}>
          {/* Header — 3 zones: left / center / right */}
          <div className="shrink-0 h-[64px] bg-white/80 backdrop-blur-xl border-b border-[rgba(60,60,67,0.16)] shadow-[0_1px_3px_rgba(30,22,78,0.04)] z-10">
            <div className="px-4 flex items-center gap-2 h-full">
              {/* Left: Back + Project name + Undo/Redo */}
              <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                <button
                  onClick={() => navigate('/')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-[#1c1c1e]" />
                </button>
                <h1
                  className="font-['SF_Pro_Text:Semibold',sans-serif] text-[15px] text-[#1c1c1e] truncate max-w-[200px]"
                  title={projectData?.fileName || 'Untitled Project'}
                >
                  {projectData?.fileName || 'Untitled Project'}
                </h1>
                <div className="w-px h-5 bg-[rgba(60,60,67,0.16)] mx-1 flex-shrink-0" />
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title="Hoàn tác (Ctrl+Z)"
                  className="p-1.5 rounded-lg transition-colors flex-shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 enabled:hover:bg-gray-100"
                >
                  <Undo2 className="w-4 h-4 text-[#1c1c1e]" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  title="Làm lại (Ctrl+Y)"
                  className="p-1.5 rounded-lg transition-colors flex-shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 enabled:hover:bg-gray-100"
                >
                  <Redo2 className="w-4 h-4 text-[#1c1c1e]" />
                </button>
              </div>

              {/* Center: Feature buttons (flex-1, centered, hidden on small screens) */}
              <div className="flex-1 flex items-center justify-center gap-3 min-w-0 overflow-hidden">
                {/* Nhạc nền */}
                <button
                  onClick={() => setShowAudioLibrary(true)}
                  className="flex flex-col items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-gray-50 transition-colors text-[rgba(30,22,78,0.8)] hover:text-[#1E164E] flex-shrink-0 cursor-pointer"
                >
                  <Music className="w-5 h-5" />
                  <span className="text-[11px] font-medium whitespace-nowrap hidden xl:block">Nhạc nền</span>
                </button>
                {/* Từ điển cách đọc - disabled */}
                <div className="relative group/disabled flex-shrink-0">
                  <button disabled title="Bản demo không hỗ trợ tính năng này" className="flex flex-col items-center gap-1 px-1.5 py-1 rounded-lg text-[rgba(30,22,78,0.3)] flex-shrink-0 cursor-not-allowed">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <g clipPath="url(#hdr-dict)">
                        <path d="M4.04484 4.04484C6.16969 1.92 8.99484 0.75 12 0.75C15.0052 0.75 17.8303 1.92 19.9552 4.04484C22.08 6.16969 23.25 8.99484 23.25 12C23.25 15.0047 22.08 17.8298 19.9552 19.9547C17.8303 22.0795 15.0052 23.25 12 23.25C8.99484 23.25 6.16969 22.0795 4.04484 19.9547C1.92 17.8298 0.75 15.0047 0.75 12C0.75 8.99484 1.92 6.16969 4.04484 4.04484ZM12 22.3125C12.5203 22.3125 13.0312 22.2736 13.5309 22.1991C13.7733 19.8558 13.0219 18.4613 13.0219 18.4613C12.8391 18.4673 12.6478 18.4777 12.4472 18.4917C9.15141 18.7237 9.18469 17.1005 9.18469 17.1005V16.0561C9.18469 15.9062 9.27372 15.7708 9.41021 15.7089C9.90781 15.4832 11.0559 14.9351 11.0559 14.6827C11.0559 14.2635 8.37375 15.2287 8.87016 13.3411C9.36656 11.4534 7.92609 10.9566 7.92609 10.9566C6.08766 10.6584 6.88266 9.41625 6.88266 9.41625L9.26719 6.88266C9.05203 3.55547 10.7648 2.22141 12.097 1.68797C12.0647 1.6875 12.0323 1.6875 12 1.6875C6.31359 1.6875 1.6875 6.31359 1.6875 12C1.6875 17.6864 6.31359 22.3125 12 22.3125ZM7.10789 16.3075C7.22789 16.3075 7.3478 16.2618 7.43934 16.1702C7.62239 15.9872 7.62239 15.6904 7.43934 15.5073C6.9847 15.0526 6.9847 14.3129 7.43934 13.8582C7.62239 13.6752 7.62239 13.3784 7.43934 13.1953C7.25625 13.0123 6.95953 13.0123 6.77639 13.1953C5.95622 14.0155 5.95622 15.35 6.77639 16.1702C6.86798 16.2618 6.98789 16.3075 7.10789 16.3075ZM5.1458 17.2515C5.2658 17.2515 5.3857 17.2057 5.47725 17.1142C5.6603 16.9312 5.6603 16.6343 5.47725 16.4513C5.00484 15.9788 4.74469 15.3508 4.74469 14.6827C4.74469 14.0147 5.00484 13.3866 5.47725 12.9142C5.6603 12.7312 5.6603 12.4343 5.47725 12.2512C5.29416 12.0682 4.99744 12.0682 4.8143 12.2512C4.16489 12.9007 3.80719 13.7642 3.80719 14.6827C3.80719 15.6012 4.16489 16.4647 4.8143 17.1142C4.90589 17.2057 5.02584 17.2515 5.1458 17.2515Z" fill="currentColor"/>
                      </g>
                      <defs><clipPath id="hdr-dict"><rect width="24" height="24" fill="white" transform="matrix(-1 0 0 1 24 0)"/></clipPath></defs>
                    </svg>
                    <span className="text-[11px] font-medium whitespace-nowrap hidden xl:block">Từ điển</span>
                  </button>
                  <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-gray-800 text-white text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover/disabled:opacity-100 transition-opacity z-50">
                    Bản demo không hỗ trợ tính năng này
                  </div>
                </div>
                {/* Ngắt nghỉ - disabled */}
                <div className="relative group/disabled flex-shrink-0">
                  <button disabled title="Bản demo không hỗ trợ tính năng này" className="flex flex-col items-center gap-1 px-1.5 py-1 rounded-lg text-[rgba(30,22,78,0.3)] flex-shrink-0 cursor-not-allowed">
                    <svg width="20" height="20" viewBox="0 0 14 9" fill="none" className="mt-0.5">
                      <path d="M2.64167 8.33333C3.06667 8.33333 3.45833 8.09167 3.64167 7.71667L4.825 5.35C4.94167 5.11667 5 4.86667 5 4.60833V0.833333C5 0.375 4.625 0 4.16667 0H0.833333C0.375 0 0 0.375 0 0.833333V4.16667C0 4.625 0.375 5 0.833333 5H2.5L1.64167 6.71667C1.26667 7.45833 1.80833 8.33333 2.64167 8.33333ZM10.975 8.33333C11.4 8.33333 11.7917 8.09167 11.975 7.71667L13.1583 5.35C13.275 5.11667 13.3333 4.86667 13.3333 4.60833V0.833333C13.3333 0.375 12.9583 0 12.5 0H9.16667C8.70833 0 8.33333 0.375 8.33333 0.833333V4.16667C8.33333 4.625 8.70833 5 9.16667 5H10.8333L9.975 6.71667C9.6 7.45833 10.1417 8.33333 10.975 8.33333Z" fill="currentColor"/>
                    </svg>
                    <span className="text-[11px] font-medium whitespace-nowrap hidden xl:block">Ngắt nghỉ</span>
                  </button>
                  <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-gray-800 text-white text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover/disabled:opacity-100 transition-opacity z-50">
                    Bản demo không hỗ trợ tính năng này
                  </div>
                </div>
                {/* Định dạng - disabled */}
                <div className="relative group/disabled flex-shrink-0">
                  <button disabled title="Bản demo không hỗ trợ tính năng này" className="flex flex-col items-center gap-1 px-1.5 py-1 rounded-lg text-[rgba(30,22,78,0.3)] flex-shrink-0 cursor-not-allowed">
                    <FileAudio className="w-5 h-5" />
                    <span className="text-[11px] font-medium whitespace-nowrap hidden xl:block">Định dạng</span>
                  </button>
                  <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-gray-800 text-white text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover/disabled:opacity-100 transition-opacity z-50">
                    Bản demo không hỗ trợ tính năng này
                  </div>
                </div>
              </div>

              {/* Right: Save + Download + Credits */}
              <div className="flex items-center gap-2.5 ml-auto flex-shrink-0">
                <div className="relative" ref={downloadMenuRef}>
                  <button
                    onClick={() => setShowDownloadMenu(v => !v)}
                    className={
                      isBoldExportCta
                        ? "px-4 py-1.5 bg-[#16a34a] rounded-[8px] font-['SF_Pro_Text:Semibold',sans-serif] text-[13px] text-white hover:bg-[#15803d] transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_2px_8px_rgba(22,163,74,0.4)]"
                        : "px-3 py-1.5 bg-[#ffd60a] rounded-[8px] font-['SF_Pro_Text:Semibold',sans-serif] text-[13px] text-[#1e164e] hover:bg-[#ffc107] transition-colors flex items-center gap-1.5 cursor-pointer"
                    }
                  >
                    <Download className="w-4 h-4" />
                    {isBoldExportCta ? 'Xuất video ngay' : 'Tải xuống'}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {showDownloadMenu && (
                    <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-gray-100 py-1.5 z-[100] min-w-[180px]">
                      <button
                        onClick={() => { analytics.exportClicked({ project_id: projectId, project_type: projectType, ab_variant: exportCtaVariant ?? 'control' }); setShowDownloadMenu(false); setShowExportModal(true); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                      >
                        <Film className="w-4 h-4 text-[#1e164e]" />
                        <span className="text-[13px] text-[#1c1c1e]">Tải video</span>
                      </button>
                      <button
                        onClick={handleExportSRT}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                      >
                        <FileAudio className="w-4 h-4 text-[#1e164e]" />
                        <span className="text-[13px] text-[#1c1c1e]">Tải SRT</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="w-px h-6 bg-[rgba(60,60,67,0.16)] mx-1" />

                {/* Credits — y nguyên từ HomeHeader */}
                <div className="flex items-center gap-3">
                  {/* Trophy */}
                  <div className="relative w-9 h-9 bg-white rounded-xl border border-[rgba(30,22,78,0.16)] flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0.5 left-1 w-1 h-1 rounded-full bg-[#FFD60A] opacity-70" />
                      <div className="absolute top-1 right-1.5 w-0.5 h-0.5 rounded-full bg-[#FF3B30] opacity-70" />
                      <div className="absolute bottom-1 left-1.5 w-0.5 h-1 rounded bg-[#34C759] opacity-70" />
                      <div className="absolute bottom-0.5 right-1 w-1 h-0.5 rounded bg-[#007AFF] opacity-70" />
                    </div>
                    <EmojiEventsRounded sx={{ fontSize: 20, color: '#1e164e', position: 'relative', zIndex: 10 }} />
                  </div>
                  {/* Gift / Subscription */}
                  <div className="relative w-9 h-9 bg-white rounded-xl border border-[rgba(30,22,78,0.16)] flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#667eea] to-[#764ba2] opacity-20" />
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="relative z-10">
                      <path d="M5.9375 2.15625C5.71875 1.75 5.28125 1.5 4.8125 1.5H4.75C4.03125 1.5 3.5 2.0625 3.5 2.75C3.5 3.46875 4.03125 4 4.75 4H7.03125L5.9375 2.15625ZM2 2.75C2 1.25 3.21875 0 4.75 0H4.8125C5.8125 0 6.71875 0.53125 7.21875 1.40625L8 2.6875L8.75 1.40625C9.25 0.53125 10.1562 0 11.1562 0H11.25C12.75 0 14 1.25 14 2.75C14 3.21875 13.875 3.625 13.6875 4H15C15.5312 4 16 4.46875 16 5V7C16 7.5625 15.5312 8 15 8H1C0.4375 8 0 7.5625 0 7V5C0 4.46875 0.4375 4 1 4H2.28125C2.09375 3.625 2 3.21875 2 2.75ZM12.5 2.75C12.5 2.0625 11.9375 1.5 11.25 1.5H11.1562C10.6875 1.5 10.2812 1.75 10.0312 2.15625L8.9375 4H11.25C11.9375 4 12.5 3.46875 12.5 2.75ZM1 9H7V16H2.5C1.65625 16 1 15.3438 1 14.5V9ZM9 16V9H15V14.5C15 15.3438 14.3125 16 13.5 16H9Z" fill="#1E164E" fillOpacity="0.8"/>
                    </svg>
                  </div>
                  {/* Notification bell */}
                  <div className="relative w-9 h-9 bg-white rounded-xl border border-[rgba(30,22,78,0.16)] flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-50 transition-colors">
                    <NotificationsRounded sx={{ fontSize: 20, color: '#1e164e' }} />
                    <div className="absolute top-[5px] right-[5px] w-[8px] h-[8px] rounded-full bg-[#FF3B30] border-[1.5px] border-white" />
                  </div>
                  {/* AI credit sparkle */}
                  <div className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #F38B71 0%, #F1414D 50%, #563EFA 100%)' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8.75 0.5L10.8929 5.10714L15.5 7.25C15.7857 7.39286 16 7.67857 16 8C16 8.35714 15.7857 8.64286 15.5 8.78571L10.8929 10.9286L8.75 15.5357C8.60714 15.8214 8.32143 16 8 16C7.64286 16 7.35714 15.8214 7.21429 15.5357L5.07143 10.9286L0.464286 8.78571C0.178571 8.64286 0 8.35714 0 8C0 7.67857 0.178571 7.39286 0.464286 7.25L5.07143 5.10714L7.21429 0.5C7.35714 0.214286 7.64286 0 8 0C8.32143 0 8.60714 0.214286 8.75 0.5Z" fill="white"/>
                    </svg>
                  </div>
                  {/* Points display — hidden on small screens */}
                  <div className="hidden xl:flex flex-col gap-0.5 rounded-lg px-2 py-1 justify-center shrink-0 cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-1">
                      <span className="font-['SF_Pro_Text:Regular',sans-serif] text-[12px] leading-4 text-[rgba(28,28,30,0.64)] whitespace-nowrap">
                        Tổng số điểm
                      </span>
                      <InfoRounded sx={{ fontSize: 14, color: 'rgba(30,22,78,0.64)' }} />
                    </div>
                    <span className="font-['SF_Pro_Text:Bold',sans-serif] font-bold text-[14px] leading-5 text-[#1c1c1e] whitespace-nowrap">
                      295.838 điểm
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blocks left | Video right — horizontal resizable */}
          {isVideoExpanded ? (
            // Expanded: full width video, blocks hidden
            <div className="flex-1 overflow-hidden">
              {projectData?.videoUrl
                ? <VideoPreview
                    videoUrl={projectData?.videoUrl}
                    currentTime={mediaPlayerState.currentTime}
                    isPlaying={(isThumbnailsLoading || (transcriptionStatus && transcriptionStatus.status !== 'done')) ? false : mediaPlayerState.isPlaying}
                    videoRef={videoRef}
                    isExpanded={true}
                    onToggleExpand={() => setIsVideoExpanded(false)}
                    onLoadedMetadata={(dur) => { setVideoDuration(dur); setTotalDuration(prev => Math.max(prev, dur)); setTimelineHeight(44 + 32 + 52 * 3); }}
                    onTimeUpdate={() => {}}
                    onEnded={() => {}}
                    isThumbnailsLoading={isThumbnailsLoading}
                    transcriptionStatus={transcriptionStatus}
                    captionBlocks={captionBlocks}
                    captionStyle={captionStyle}
                    captionVisible={captionVisible}
                    activeMediaSrc={activeMediaSrc}
                    activeMediaType={activeMediaType}
                    hasActiveMedia={hasActiveMedia}
                    hasActiveVideoRef={engine.hasActiveVideoRef}
                    activeImageSrcRef={engine.activeImageSrcRef}
                    preloadedImagesRef={preloadedImagesRef}
                    getEngineTime={engine.getCurrentTime}
                    bgColor={exportBgColor}
                    onBgColorChange={setExportBgColor}
                    aspectRatioIdx={exportAspectIdx}
                    onAspectRatioChange={setExportAspectIdx}
                    customResolution={exportCustomRes}
                    onCustomResolutionChange={setExportCustomRes}
                    slides={effectiveSlides}
                    onSeekSlide={handleTimelineSeek}
                    slideTextEdits={slideTextEdits}
                    onSlideTextChange={handleSlideTextChange}
                  />
                : <div className="h-full flex items-center justify-center text-gray-400 text-[14px]">Không có video</div>
              }
            </div>
          ) : (
            <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
              {/* Left: Block list or Caption panel (50%) */}
              <Panel defaultSize={50} minSize={25}>
                {activeTab === 'text' ? (
                  <div className="h-full overflow-y-auto bg-[#f6f6f6] p-4 space-y-4 relative">
                    {(transcriptionStatus && transcriptionStatus.status !== 'done' && transcriptionStatus.status !== 'error') ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-10 h-10 border-4 border-[#1e164e] border-t-transparent rounded-full animate-spin" />
                        <div className="flex flex-col items-center gap-1.5">
                          <p className="text-[15px] font-medium text-[#1c1c1e]">
                            {!transcriptionStatus || transcriptionStatus.status === 'uploading'
                              ? 'Đang tải video lên server...'
                              : 'Đang phiên âm video...'}
                          </p>
                          <p className="text-[12px] text-gray-400 mt-1">
                            Giọng đọc: <span className="text-[#1c1c1e] font-medium">{selectedVoice.name}</span> sẽ được gán tự động
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {blocks.map((block: any, index: number) => (
                          <VoiceoverBlock
                            key={block.uid || block.id}
                            block={block}
                            index={index}
                            isSelected={selectedBlocks.includes(block.id)}
                            isHighlighted={highlightedBlock === block.id}
                            isTtsLoading={ttsLoadingBlockIds.has(block.id)}
                            autoEdit={autoEditBlockId === block.id}
                            onAutoEditConsumed={() => setAutoEditBlockId(null)}
                            onBlockClick={handleSelectBlock}
                            onCheckboxChange={handleCheckboxChange}
                            onContentChange={handleContentChange}
                            onPlayBlock={handlePlayBlock}
                            currentPlayingBlockId={blockPlayerState.currentBlockId}
                            onVoiceClick={handleVoiceClick}
                            onDelete={handleDeleteBlock}
                            onDeleteFromHere={handleDeleteFromHere}
                            onMergeWithPrev={index > 0 ? () => handleMergeBlocks(index - 1) : undefined}
                            onInsertBefore={index > 0 ? () => handleInsertBlock(index - 1) : undefined}
                            onSpeedChange={handleBlockSpeedChange}
                          />
                        ))}
                        <AddBlockButton onClick={handleAddBlock} />
                        {/* Extra padding so the last block can scroll to center */}
                        <div className="h-[50vh]" />
                      </>
                    )}
                  </div>
                ) : (
                  <div className="h-full bg-white">
                    {captionEditorOpen ? (
                      <CaptionStyleEditor
                        style={captionStyle}
                        presetName={PRESET_LIST.find(p => p.id === captionStyle.presetId)?.label || 'Custom'}
                        onChange={(s) => { setCaptionStyle(s); setCaptionVisible(true); }}
                        onBack={() => setCaptionEditorOpen(false)}
                        onReset={() => {
                          const original = CAPTION_PRESETS[captionStyle.presetId];
                          if (original) { setCaptionStyle(original); }
                        }}
                      />
                    ) : (
                      <CaptionStyleSelector
                        activePresetId={captionStyle.presetId}
                        activeStyle={captionStyle}
                        onSelectPreset={(id, config) => { setCaptionStyle(config); setCaptionVisible(id !== 'none'); }}
                        onEditPreset={(id) => {
                          if (id !== captionStyle.presetId) setCaptionStyle(CAPTION_PRESETS[id]);
                          setCaptionVisible(id !== 'none');
                          setCaptionEditorOpen(true);
                        }}
                        onResetPreset={(id) => {
                          setCaptionStyle(CAPTION_PRESETS[id]);
                        }}
                        onUpdatePresetColor={(id, field, color) => {
                          const base = id === captionStyle.presetId ? captionStyle : CAPTION_PRESETS[id];
                          if (field === 'textColor') {
                            setCaptionStyle({ ...base, presetId: id, textColor: color });
                          } else if (field === 'highlightBg') {
                            setCaptionStyle({ ...base, presetId: id, wordHighlight: { ...base.wordHighlight, backgroundColor: color } });
                          }
                          setCaptionVisible(true);
                        }}
                      />
                    )}
                  </div>
                )}
              </Panel>

              {/* Resize handle */}
              <PanelResizeHandle className="w-1.5 bg-transparent hover:bg-gray-200 transition-colors cursor-col-resize flex items-center justify-center group">
                <div className="w-[3px] h-8 rounded-full bg-gray-300 group-hover:bg-[#ffd60a] transition-colors" />
              </PanelResizeHandle>

              {/* Right: Video preview (50%) */}
              <Panel defaultSize={50} minSize={25}>
                {projectData?.videoUrl
                  ? <VideoPreview
                      videoUrl={projectData?.videoUrl}
                      currentTime={mediaPlayerState.currentTime}
                      isPlaying={(isThumbnailsLoading || (transcriptionStatus && transcriptionStatus.status !== 'done')) ? false : mediaPlayerState.isPlaying}
                      videoRef={videoRef}
                      isExpanded={false}
                      onToggleExpand={() => setIsVideoExpanded(true)}
                      onLoadedMetadata={(dur) => { setVideoDuration(dur); setTotalDuration(prev => Math.max(prev, dur)); setTimelineHeight(44 + 32 + 52 * 3); }}
                      onTimeUpdate={() => {}}
                      onEnded={() => {}}
                      isThumbnailsLoading={isThumbnailsLoading}
                      transcriptionStatus={transcriptionStatus}
                      captionBlocks={captionBlocks}
                      captionStyle={captionStyle}
                      captionVisible={captionVisible}
                      activeMediaSrc={activeMediaSrc}
                      activeMediaType={activeMediaType}
                      hasActiveMedia={hasActiveMedia}
                      hasActiveVideoRef={engine.hasActiveVideoRef}
                      activeImageSrcRef={engine.activeImageSrcRef}
                      preloadedImagesRef={preloadedImagesRef}
                      bgColor={exportBgColor}
                      onBgColorChange={setExportBgColor}
                      aspectRatioIdx={exportAspectIdx}
                      onAspectRatioChange={setExportAspectIdx}
                      customResolution={exportCustomRes}
                      onCustomResolutionChange={setExportCustomRes}
                      slides={effectiveSlides}
                      onSeekSlide={handleTimelineSeek}
                      slideTextEdits={slideTextEdits}
                      onSlideTextChange={handleSlideTextChange}
                    />
                  : <div className="h-full flex items-center justify-center text-gray-400 text-[14px]">Không có video</div>
                }
              </Panel>
            </PanelGroup>
          )}
        </div>

        {/* Selection toolbar — fixed above timeline */}
        {selectedBlocks.length > 0 && (
          <div className="fixed left-[80px] right-0 z-30 px-4 py-2 flex items-center justify-between bg-[#1c1c1e] rounded-tl-xl rounded-tr-xl" style={{ bottom: timelineHeight }}>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-white font-medium">
                Đã chọn {selectedBlocks.length}
              </span>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 text-[13px] text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.3 4.7L6.5 11.5L2.7 7.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {selectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowVoiceModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
                Giọng đọc
              </button>
              {/* Speed */}
              <div className="relative" ref={speedDropdownRef}>
                <button
                  onClick={() => setShowSpeedDropdown(p => !p)}
                  title="Tốc độ đọc"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {(() => {
                    const speeds = selectedBlocks.map((id: number) => blocks.find((b: any) => b.id === id)?.speed).filter(Boolean);
                    const unique = [...new Set(speeds)];
                    return unique.length === 1 ? unique[0] : unique.length > 1 ? 'Đa tốc độ' : '1.0x';
                  })()}
                </button>
                {showSpeedDropdown && (
                  <SpeedPicker
                    currentSpeed={(() => {
                      const speeds = selectedBlocks.map((id: number) => blocks.find((b: any) => b.id === id)?.speed).filter(Boolean);
                      const unique = [...new Set(speeds)];
                      return unique.length === 1 ? (unique[0] as string) : undefined;
                    })()}
                    onSelect={handleSelectSpeed}
                    onClose={() => setShowSpeedDropdown(false)}
                    position="top"
                    containerRef={speedDropdownRef}
                  />
                )}
              </div>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
                Xóa
              </button>
            </div>
            <button
              onClick={() => setSelectedBlocks([])}
              className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18"/>
                <path d="M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}

        {/* Timeline — fixed bottom */}
        <Timeline
          voiceOverBlocks={voiceOverBlocks}
          mediaBlocks={mediaBlocks}
          musicBlocks={musicBlocks}
          videoDuration={videoDuration}
          videoUrl={projectData?.videoUrl}
          totalDuration={effectiveTotalDuration}
          currentTime={mediaPlayerState.currentTime}
          isPlaying={mediaPlayerState.isPlaying}
          isGeneratingTTS={isTtsGenerating}
          isTranscribing={!!transcriptionStatus && transcriptionStatus.status !== 'done' && transcriptionStatus.status !== 'error'}
          volumes={volumes}
          onPlayPause={handlePlayMediaPlayer}
          onSeek={handleTimelineSeek}
          onAddBackgroundMusic={handleAddBackgroundMusic}
          onAddMediaBlock={() => setShowMediaLibrary(true)}
          onInsertMusicBlock={() => setShowAudioLibrary(true)}
          timelineHeight={timelineHeight}
          onHeightChange={setTimelineHeight}
          onThumbnailsLoading={setIsThumbnailsLoading}
          onVolumeChange={handleVolumeChange}
          onSpeedChange={handlePlaybackSpeedChange}
          onBlockChange={handleBlockChange}
          onMediaBlockChange={handleMediaBlockChange}
          onMusicBlockChange={handleMusicBlockChange}
          onDeleteMediaBlock={handleDeleteMediaBlock}
          onDeleteMusicBlock={handleDeleteMusicBlock}
          onAddAudioBlock={handleAddBlock}
          onStopPlayback={stopVideoPlayback}
          onBlockDragStart={pushHistory}
          onVoiceBlockClick={handleVoiceBlockClick}
        />

        {/* Modals */}
        {showVoiceModal && (
          <VoiceSelectionModal
            onClose={() => { setShowVoiceModal(false); setCurrentEditingBlockId(null); }}
            onSelectVoice={handleSelectVoice}
            currentVoiceId={(() => {
              // Editing a single block
              if (currentEditingBlockId !== null) {
                return blocks.find((s: any) => s.id === currentEditingBlockId)?.voice?.id || selectedVoice.id;
              }
              // Multiple selected blocks — show "Đã chọn" only if all same voice
              if (selectedBlocks.length > 0) {
                const voiceIds = selectedBlocks.map(id => blocks.find((s: any) => s.id === id)?.voice?.id).filter(Boolean);
                const allSame = voiceIds.length > 0 && voiceIds.every(v => v === voiceIds[0]);
                return allSame ? voiceIds[0] : undefined;
              }
              return selectedVoice.id;
            })()}
          />
        )}

        {/* Audio elements created via new Audio() in useEffect — not in JSX */}

        <MediaLibraryModal
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onAddToProject={handleAddMediaBlock}
        />
        <AudioLibraryModal
          isOpen={showAudioLibrary}
          onClose={() => setShowAudioLibrary(false)}
          onInsert={handleInsertMusicBlock}
        />
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          getPayload={getExportPayload}
        />
      </div>
    );
  }

  // For legacy type - Original layout with media player

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-screen z-20">
        <ProjectSidebar
          audioFormat={projectData?.audioFormat}
          voice={projectData?.voice?.name}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 ml-[80px]">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          {/* Top Row */}
          <div className="px-4 py-3 flex items-center justify-between gap-4 border-b border-gray-100">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="font-['SF_Pro_Text:Semibold',sans-serif] text-[16px] text-[#1c1c1e] truncate">
                  Vbee AIVoice - Nền tảng chuyển văn bản thành giọng nói
                </h1>
                <p className="font-['SF_Pro_Text:Regular',sans-serif] text-[12px] text-[rgba(28,28,30,0.64)]">
                  {blocks.length} blocks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="px-3 py-1.5 border border-[rgba(30,22,78,0.16)] rounded-[8px] font-['SF_Pro_Text:Medium',sans-serif] text-[13px] text-[#1c1c1e] hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                Lưu
              </button>
              <div className="relative" ref={downloadMenuRef}>
                <button
                  onClick={() => setShowDownloadMenu(v => !v)}
                  className={
                    isBoldExportCta
                      ? "px-4 py-1.5 bg-[#16a34a] rounded-[8px] font-['SF_Pro_Text:Semibold',sans-serif] text-[13px] text-white hover:bg-[#15803d] transition-colors cursor-pointer flex items-center gap-1.5 shadow-[0_2px_8px_rgba(22,163,74,0.4)]"
                      : "px-3 py-1.5 bg-[#ffd60a] rounded-[8px] font-['SF_Pro_Text:Semibold',sans-serif] text-[13px] text-[#1e164e] hover:bg-[#ffc107] transition-colors cursor-pointer flex items-center gap-1.5"
                  }
                >
                  <Download className="w-4 h-4" />
                  {isBoldExportCta ? 'Xuất video ngay' : 'Tải xuống'}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showDownloadMenu && (
                  <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-gray-100 py-1.5 z-[100] min-w-[180px]">
                    <button
                      onClick={() => { setShowDownloadMenu(false); setShowExportModal(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                    >
                      <Film className="w-4 h-4 text-[#1e164e]" />
                      <span className="text-[13px] text-[#1c1c1e]">Tải video</span>
                    </button>
                    <button
                      onClick={handleExportSRT}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                    >
                      <FileAudio className="w-4 h-4 text-[#1e164e]" />
                      <span className="text-[13px] text-[#1c1c1e]">Tải SRT</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Control Bar — selection toolbar */}
          {selectedBlocks.length > 0 ? (
            <div className="px-4 py-2.5 flex items-center justify-between bg-[#1c1c1e] min-h-[48px]">
              {/* Left: count + select all */}
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-white font-medium">
                  Đã chọn {selectedBlocks.length}
                </span>
                <div className="w-px h-4 bg-white/20" />
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-1.5 text-[13px] text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.3 4.7L6.5 11.5L2.7 7.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {selectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>

              {/* Center: actions */}
              <div className="flex items-center gap-1">
                {/* Voice */}
                {(() => {
                  const voiceNames = selectedBlocks.map(id => blocks.find((b: any) => b.id === id)?.voice?.name).filter(Boolean);
                  const commonVoice = voiceNames.length > 0 && voiceNames.every(v => v === voiceNames[0]) ? voiceNames[0] : null;
                  return (
                    <button
                      onClick={() => setShowVoiceModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" x2="12" y1="19" y2="22"/>
                      </svg>
                      {commonVoice || 'Giọng đọc'}
                    </button>
                  );
                })()}

                {/* Speed */}
                <div className="relative" ref={speedDropdownRef}>
                  <button
                    onClick={() => setShowSpeedDropdown(p => !p)}
                    title="Tốc độ đọc"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {(() => {
                      const speeds = selectedBlocks.map((id: number) => blocks.find((b: any) => b.id === id)?.speed).filter(Boolean);
                      const unique = [...new Set(speeds)];
                      return unique.length === 1 ? unique[0] : unique.length > 1 ? 'Đa tốc độ' : '1.0x';
                    })()}
                  </button>
                  {showSpeedDropdown && (
                    <SpeedPicker
                      currentSpeed={(() => {
                        const speeds = selectedBlocks.map((id: number) => blocks.find((b: any) => b.id === id)?.speed).filter(Boolean);
                        const unique = [...new Set(speeds)];
                        return unique.length === 1 ? (unique[0] as string) : undefined;
                      })()}
                      onSelect={handleSelectSpeed}
                      onClose={() => setShowSpeedDropdown(false)}
                      position="top"
                      containerRef={speedDropdownRef}
                    />
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                  Xóa
                </button>
              </div>

              {/* Right: close */}
              <button
                onClick={() => setSelectedBlocks([])}
                className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18"/>
                  <path d="M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ) : null}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full">
            <VirtualizedBlockList
              blocks={blocks}
              selectedBlocks={selectedBlocks}
              highlightedBlock={highlightedBlock}
              currentPlayingBlockId={blockPlayerState.currentBlockId}
              onBlockClick={handleSelectBlock}
              onCheckboxChange={handleCheckboxChange}
              onContentChange={handleContentChange}
              onPlayBlock={handlePlayBlock}
              onVoiceClick={handleVoiceClick}
              containerHeight={window.innerHeight - 240}
            />
          </div>
        </div>

        {/* Media Player - Fixed Bottom */}
        <div className="fixed bottom-0 left-[80px] right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-[1400px] mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Album Art */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-[8px] flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              
              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="font-['SF_Pro_Text:Semibold',sans-serif] text-[14px] text-[#1c1c1e] truncate">
                  {mediaPlayerState.isPlaying && blocks[mediaPlayerState.currentBlockIndex]
                    ? blocks[mediaPlayerState.currentBlockIndex].title
                    : 'Vbee AIVoice - Nền tảng chuyển văn bn thành giọng nói'}
                </p>
                <p className="font-['SF_Pro_Text:Regular',sans-serif] text-[12px] text-[rgba(28,28,30,0.64)]">
                  {formatTime(mediaPlayerState.currentTime)} / {formatTime(totalDuration)}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePlayMediaPlayer}
                  className="p-3 bg-[#ffd60a] hover:bg-[#ffc107] rounded-full transition-colors"
                >
                  {mediaPlayerState.isPlaying ? (
                    <Pause className="w-6 h-6 text-[#1e164e]" />
                  ) : (
                    <Play className="w-6 h-6 text-[#1e164e]" />
                  )}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Additional Controls */}
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Volume2 className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-2">
              <div 
                className="h-1 bg-gray-200 rounded-full overflow-hidden cursor-pointer" 
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-[#ffd60a] transition-all duration-100"
                  style={{ width: `${totalDuration > 0 ? (mediaPlayerState.currentTime / totalDuration) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showVoiceModal && (
        <VoiceSelectionModal
          onClose={() => setShowVoiceModal(false)}
          onSelectVoice={handleSelectVoice}
        />
      )}

      {/* Audio elements created via new Audio() in useEffect — not in JSX */}
    </div>
  );
}
