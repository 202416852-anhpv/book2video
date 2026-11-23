import { useState, useRef, useCallback, useEffect } from 'react';
import { X, CloudUpload, Play, Pause, Search, ChevronDown } from 'lucide-react';
import { authFetch } from '../utils/auth';

type Tab = 'music' | 'effects' | 'uploads';

interface AudioLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert?: (item: AudioItem) => void;
}

interface AudioItem {
  id: string;
  name: string;
  artist: string;
  url: string;
  duration: number;
  tags: string[];
  thumbnail?: string;
}

interface UploadedAudio {
  id: string;
  file: File;
  name: string;
  duration: number;
  progress: number;
  done: boolean;
  serverUrl?: string;
}

// ── Stock data (local files from Speechify/Soundstripe) ──
const STOCK_MUSIC: AudioItem[] = [
  {"id":"music-1","name":"Elderflower","artist":"Midnight Daydream","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Midnight_Daydream_Elderflower.mp3","duration":103,"tags":["Fun","Happy","Quirky"]},
  {"id":"music-2","name":"Crescent","artist":"Nu Alkemi$t","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Nu_Alkemi_t_Crescent.mp3","duration":187,"tags":["Chill"]},
  {"id":"music-3","name":"Ghostfire","artist":"Alsever Lake","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Alsever_Lake_Ghostfire.mp3","duration":211,"tags":["Reflective","Hopeful","Calm"]},
  {"id":"music-4","name":"Fuchsia","artist":"Matt Wigton","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Matt_Wigton_Fuchsia.mp3","duration":202,"tags":["Fun","Happy"]},
  {"id":"music-5","name":"Going Dark","artist":"Wicked Cinema","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Wicked_Cinema_Going_Dark.mp3","duration":283,"tags":["Suspenseful"]},
  {"id":"music-6","name":"Convincing","artist":"Wayfair","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Wayfair_Convincing.mp3","duration":124,"tags":["Chill","Quirky","Fun"]},
  {"id":"music-7","name":"Still Not Over It","artist":"Adrian Walther","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Adrian_Walther_Still_Not_Over_It.mp3","duration":126,"tags":["Fun","Happy","Quirky"]},
  {"id":"music-8","name":"Sunfrost","artist":"Cody Martin","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Cody_Martin_Sunfrost.mp3","duration":150,"tags":["Romantic","Reflective","Calm"]},
  {"id":"music-9","name":"Still Enough","artist":"Alsever Lake","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Alsever_Lake_Still_Enough.mp3","duration":161,"tags":["Calm","Hopeful","Inspiring"]},
  {"id":"music-10","name":"From The Ground Up","artist":"Shimmer","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Shimmer_From_The_Ground_Up.mp3","duration":210,"tags":["Calm","Hopeful","Inspiring"]},
  {"id":"music-11","name":"Brothers","artist":"Cody Martin","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Cody_Martin_Brothers.mp3","duration":150,"tags":["Calm","Reflective"]},
  {"id":"music-12","name":"Sofa","artist":"A.G. Sully","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/A_G__Sully_Sofa.mp3","duration":210,"tags":["Chill","Reflective","Calm"]},
  {"id":"music-13","name":"Seedling","artist":"Midnight Daydream","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Midnight_Daydream_Seedling.mp3","duration":124,"tags":["Chill","Hopeful"]},
  {"id":"music-14","name":"Ronin","artist":"Neon Beach","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Neon_Beach_Ronin.mp3","duration":89,"tags":["Fun"]},
  {"id":"music-15","name":"Red Sand","artist":"Cody Martin","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/music/Cody_Martin_Red_Sand.mp3","duration":168,"tags":["Suspenseful","Scary"]},
];

const SOUND_EFFECTS: AudioItem[] = [
  {"id":"sfx-1","name":"Motocross Decelerate 01","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Motocross_Decelerate_01.mp3","duration":14,"tags":["transportation","motorcycles"]},
  {"id":"sfx-2","name":"Motocross Accelerate 02","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Motocross_Accelerate_02.mp3","duration":5,"tags":["transportation","motorcycles"]},
  {"id":"sfx-3","name":"Motocross Accelerate 01","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Motocross_Accelerate_01.mp3","duration":6,"tags":["transportation","motorcycles"]},
  {"id":"sfx-4","name":"Harley Very Slow Steady 01","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Harley_Very_Slow_Steady_01.mp3","duration":10,"tags":["transportation","motorcycles"]},
  {"id":"sfx-5","name":"Harley Triple Gear Shift 01","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Harley_Triple_Gear_Shift_01.mp3","duration":6,"tags":["transportation","motorcycles"]},
  {"id":"sfx-6","name":"Harley Sequences Short Thrusts 01","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Harley_Sequences_Short_Thrusts_01.mp3","duration":120,"tags":["transportation","motorcycles"]},
  {"id":"sfx-7","name":"Harley Kickstand Extend 01","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Harley_Kickstand_Extend_01.mp3","duration":2,"tags":["transportation","motorcycles"]},
  {"id":"sfx-8","name":"Harley Ignition Start Engine Accelerate 01","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Harley_Ignition_Start_Engine_Accelerate_01.mp3","duration":21,"tags":["transportation","motorcycles"]},
  {"id":"sfx-9","name":"Harley Ignition Start Engine 01","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Harley_Ignition_Start_Engine_01.mp3","duration":7,"tags":["transportation","motorcycles"]},
  {"id":"sfx-10","name":"Harley Idle Close 01","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Harley_Idle_Close_01.mp3","duration":40,"tags":["transportation","motorcycles"]},
  {"id":"sfx-11","name":"Atmospheric Feedback Synthesizer Medium 03","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Atmospheric_Feedback_Synthesizer_Medium_03.mp3","duration":25,"tags":["cinematic"]},
  {"id":"sfx-12","name":"Harley Idle 02","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Harley_Idle_02.mp3","duration":38,"tags":["transportation","motorcycles"]},
  {"id":"sfx-13","name":"Harley Idle 01","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Harley_Idle_01.mp3","duration":31,"tags":["transportation","motorcycles"]},
  {"id":"sfx-14","name":"Harley Engine Unsteady Idle Rattle 01","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Harley_Engine_Unsteady_Idle_Rattle_01.mp3","duration":26,"tags":["transportation","motorcycles"]},
  {"id":"sfx-15","name":"Harley Engine Thrusts 01","artist":"SFX","url":"https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/sfx/Harley_Engine_Thrusts_01.mp3","duration":52,"tags":["transportation","motorcycles"]},
];

const MOOD_TAGS = ['Upbeat', 'Happy', 'Inspiring', 'Epic', 'Dramatic', 'Instrumental', 'Hip Hop', 'Cinematic', 'Mellow', 'Relaxing', 'Angry', 'Romantic', 'Calm', 'Suspenseful'];

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const WAVEFORM_BARS = 40;
const waveformCache = new Map<string, number[]>();

async function getWaveformData(url: string): Promise<number[]> {
  if (waveformCache.has(url)) return waveformCache.get(url)!;
  try {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audio = await ctx.decodeAudioData(buf);
    const raw = audio.getChannelData(0);
    const step = Math.floor(raw.length / WAVEFORM_BARS);
    const bars: number[] = [];
    for (let i = 0; i < WAVEFORM_BARS; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) sum += Math.abs(raw[i * step + j]);
      bars.push(sum / step);
    }
    const max = Math.max(...bars) || 1;
    const normalized = bars.map(b => 3 + (b / max) * 17); // 3–20px height
    waveformCache.set(url, normalized);
    ctx.close();
    return normalized;
  } catch {
    const fallback = Array.from({ length: WAVEFORM_BARS }, (_, i) => 4 + Math.sin(i * 0.7) * 6 + Math.random() * 8);
    waveformCache.set(url, fallback);
    return fallback;
  }
}

function WaveformLoading() {
  return (
    <svg width="80" height="24" viewBox="0 0 80 24">
      {Array.from({ length: 5 }, (_, i) => (
        <circle key={i} cx={16 + i * 12} cy="12" r="2" fill="#d1d5db">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

const FALLBACK_BARS = Array.from({ length: WAVEFORM_BARS }, (_, i) => 4 + Math.sin(i * 0.7) * 6);

function WaveformSvg({ bars = FALLBACK_BARS, progress = 0, onSeek }: { bars?: number[]; progress?: number; onSeek?: (pct: number) => void }) {
  const activeIndex = Math.floor(progress * bars.length);
  const w = 80;
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  };
  return (
    <svg width={w} height="24" viewBox={`0 0 ${w} 24`} className="cursor-pointer" onClick={handleClick}>
      {bars.map((h, i) => (
        <rect key={i} x={i * (w / bars.length)} y={(24 - h) / 2} width={Math.max(1, w / bars.length - 0.8)} height={h} rx="0.75"
          fill={i <= activeIndex && progress > 0 ? '#1E164E' : '#d1d5db'} />
      ))}
    </svg>
  );
}

function AudioRow({ item, playing, currentTime, onPlay, onSeek, onInsert, onDelete }: { item: AudioItem; playing: boolean; currentTime: number; onPlay: () => void; onSeek?: (time: number) => void; onInsert?: () => void; onDelete?: () => void }) {
  const progress = item.duration > 0 ? currentTime / item.duration : 0;
  const [bars, setBars] = useState<number[] | null>(() => waveformCache.get(item.url) || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    getWaveformData(item.url).then(setBars);
  }, [item.url]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleSeek = useCallback((pct: number) => {
    if (!playing) return;
    onSeek?.(pct * item.duration);
  }, [playing, item.duration, onSeek]);

  return (
    <div className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer">
      {/* Play button */}
      <button onClick={onPlay} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center flex-shrink-0 hover:bg-gray-100 transition-colors cursor-pointer">
        {playing ? <Pause className="w-3.5 h-3.5 text-gray-600" /> : <Play className="w-3.5 h-3.5 text-gray-600 fill-gray-600 ml-0.5" />}
      </button>

      {/* Name & Artist */}
      <div className="min-w-0 flex-shrink-0" style={{ width: 160 }}>
        <p className="text-[13px] font-medium text-gray-900 truncate">{item.name}</p>
        {item.artist && <p className="text-[11px] text-gray-400 truncate">{item.artist}</p>}
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
        {item.tags.slice(0, 2).map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-500 whitespace-nowrap">{tag}</span>
        ))}
      </div>

      {/* Waveform */}
      <div className="flex-shrink-0 hidden md:block">
        {bars ? (
          <WaveformSvg bars={bars} progress={progress} onSeek={handleSeek} />
        ) : (
          <WaveformLoading />
        )}
      </div>

      {/* Duration */}
      <span className="text-[12px] text-gray-400 font-mono flex-shrink-0 whitespace-nowrap">
        {formatTime(Math.floor(playing ? currentTime : 0))} / {formatTime(item.duration)}
      </span>

      {/* Insert button */}
      <button
        onClick={e => { e.stopPropagation(); onInsert?.(); }}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0 cursor-pointer"
      >
        Thêm
      </button>

      {/* 3-dot menu */}
      {onDelete && (
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-50">
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                Xóa
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise(resolve => {
    const timeout = setTimeout(() => resolve(0), 3000);
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(audio.src);
      resolve(Math.round(audio.duration));
    };
    audio.onerror = () => { clearTimeout(timeout); resolve(0); };
  });
}

export default function AudioLibraryModal({ isOpen, onClose, onInsert }: AudioLibraryModalProps) {
  const [tab, setTab] = useState<Tab>('music');
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadedAudio[]>([]);
  const [myFiles, setMyFiles] = useState<AudioItem[]>([]);
  const [myFilesLoaded, setMyFilesLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioTime, setAudioTime] = useState(0);
  const rafRef = useRef(0);

  // RAF loop to sync currentTime
  useEffect(() => {
    if (!playingId) { setAudioTime(0); return; }
    const tick = () => {
      if (audioRef.current) setAudioTime(audioRef.current.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playingId]);

  // Seek audio
  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  // Audio playback
  const handlePlay = useCallback((item: AudioItem) => {
    if (playingId === item.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(item.url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
    audioRef.current = audio;
    setPlayingId(item.id);
  }, [playingId]);

  // Stop audio when modal closes
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
    }
  }, [isOpen]);

  // Load "my files" from server
  useEffect(() => {
    if (!isOpen || myFilesLoaded) return;
    (async () => {
      try {
        const res = await authFetch('/api/uploads/list?type=music');
        if (res.ok) {
          const data = await res.json();
          setMyFiles((data.items || []).map((m: any) => ({
            id: m.id, name: m.name, artist: '', url: m.url, duration: m.duration || 0, tags: [],
          })));
        }
      } catch { /* ignore */ }
      setMyFilesLoaded(true);
    })();
  }, [isOpen, myFilesLoaded]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleFiles = useCallback(async (files: FileList) => {
    setTab('uploads');
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isAudio = file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'wma'].includes(ext);
      if (!isAudio) continue;
      const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const name = file.name.replace(/\.[^.]+$/, '');

      // Show uploading state immediately
      setUploads(prev => [...prev, { id, file, name, duration: 0, progress: 10, done: false }]);

      // Get duration first, then upload with duration
      const dur = await getAudioDuration(file);
      setUploads(prev => prev.map(u => u.id === id ? { ...u, duration: dur, progress: 30 } : u));

      const form = new FormData();
      form.append('file', file, file.name);

      try {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: 60 } : u));
        const res = await authFetch(`/api/upload/music?duration=${dur}`, { method: 'POST', body: form });
        if (res.ok) {
          const data = await res.json();
          setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: 100, done: true, serverUrl: data.url } : u));
          setMyFiles(prev => [{ id: data.filename, name: data.name || name, artist: '', url: data.url, duration: dur, tags: [] }, ...prev]);
        } else {
          setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: 100, done: true } : u));
        }
      } catch {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: 100, done: true } : u));
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  if (!isOpen) return null;

  const q = search.toLowerCase();
  const filteredMusic = q ? STOCK_MUSIC.filter(i => i.name.toLowerCase().includes(q) || i.artist.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q))) : STOCK_MUSIC;
  const filteredEffects = q ? SOUND_EFFECTS.filter(i => i.name.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q))) : SOUND_EFFECTS;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'music', label: 'Khám phá kho nhạc' },
    { key: 'effects', label: 'Hiệu ứng âm thanh' },
    { key: 'uploads', label: 'Nhạc của tôi' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-8 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1100px] h-[85vh] flex flex-col pointer-events-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            <div className="flex items-center gap-6">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSearch(''); }}
                  className={`text-[15px] pb-3 border-b-2 transition-colors ${
                    tab === t.key
                      ? 'font-semibold text-gray-900 border-gray-900'
                      : 'font-medium text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <CloudUpload className="w-4 h-4" />
                Upload
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="border-b border-gray-100" />

          {/* Search + Filters */}
          <div className="px-6 py-3 flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={tab === 'music' ? 'Tìm bài hát, nghệ sĩ hoặc tâm trạng' : tab === 'effects' ? 'Tìm hiệu ứng âm thanh' : 'Tìm kiếm nhạc của tôi'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-[14px] outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
            {tab === 'music' && (
              <>
                <button className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">Thể loại<ChevronDown className="w-4 h-4" /></button>
                <button className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">Tâm trạng<ChevronDown className="w-4 h-4" /></button>
              </>
            )}
            {tab === 'effects' && (
              <>
                <button className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">Danh mục<ChevronDown className="w-4 h-4" /></button>
              </>
            )}
            {tab === 'uploads' && (
              <button className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">Sắp xếp<ChevronDown className="w-4 h-4" /></button>
            )}
          </div>

          {/* Mood tags for music tab */}
          {tab === 'music' && (
            <div className="px-6 pb-2 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {MOOD_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearch(tag)}
                  className={`px-3 py-1 rounded-full text-[12px] whitespace-nowrap border transition-colors cursor-pointer ${
                    search.toLowerCase() === tag.toLowerCase()
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-3 pb-6">
            {/* Music tab */}
            {tab === 'music' && (
              filteredMusic.length === 0 ? (
                <div className="flex items-center justify-center min-h-[400px] text-gray-400 text-[14px]">Không tìm thấy kết quả</div>
              ) : (
                <div className="flex flex-col">
                  {filteredMusic.map(item => (
                    <AudioRow
                      key={item.id}
                      item={item}
                      playing={playingId === item.id}
                      currentTime={playingId === item.id ? audioTime : 0}
                      onPlay={() => handlePlay(item)}
                      onSeek={handleSeek}
                      onInsert={() => onInsert?.(item)}
                    />
                  ))}
                </div>
              )
            )}

            {/* Effects tab */}
            {tab === 'effects' && (
              filteredEffects.length === 0 ? (
                <div className="flex items-center justify-center min-h-[400px] text-gray-400 text-[14px]">Không tìm thấy kết quả</div>
              ) : (
                <div className="flex flex-col">
                  {filteredEffects.map(item => (
                    <AudioRow
                      key={item.id}
                      item={item}
                      playing={playingId === item.id}
                      currentTime={playingId === item.id ? audioTime : 0}
                      onPlay={() => handlePlay(item)}
                      onSeek={handleSeek}
                      onInsert={() => onInsert?.(item)}
                    />
                  ))}
                </div>
              )
            )}

            {/* Uploads tab */}
            {tab === 'uploads' && (
              <>
                {/* Uploading items */}
                {uploads.length > 0 && (
                  <div className="flex flex-col mb-4">
                    {uploads.filter(u => !u.done).map(item => (
                      <div key={item.id} className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"/><circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" className="text-gray-400"/><circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" className="text-gray-400"/></svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-gray-900 truncate">{item.name}</p>
                          <div className="w-full h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-gray-900 rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* My files from server */}
                {myFiles.length > 0 ? (
                  <div className="flex flex-col">
                    {myFiles.map(item => (
                      <AudioRow
                        key={item.id}
                        item={item}
                        playing={playingId === item.id}
                        currentTime={playingId === item.id ? audioTime : 0}
                        onPlay={() => handlePlay(item)}
                        onSeek={handleSeek}
                        onInsert={() => onInsert?.(item)}
                        onDelete={async () => {
                          try {
                            const res = await authFetch(`/api/uploads/${item.id}`, { method: 'DELETE' });
                            if (res.ok) setMyFiles(prev => prev.filter(f => f.id !== item.id));
                          } catch { /* ignore */ }
                        }}
                      />
                    ))}
                  </div>
                ) : myFilesLoaded && uploads.length === 0 ? (
                  <div className="flex items-center justify-center min-h-[200px] text-gray-400 text-[14px]">
                    Chưa có tệp nào được tải lên
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav"
            multiple
            className="hidden"
            onChange={e => {
              if (e.target.files?.length) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </>
  );
}
