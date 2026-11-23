export interface TTSVoice {
  id: string;        // = Vbee voice code, e.g. 'hn_male_manhdung_full_24k-st'
  name: string;
  gender: string;    // 'Nam' | 'Nữ'
  region: string;    // 'Miền Bắc' | 'Miền Nam' | 'Miền Trung' | 'Giọng cộng đồng' | 'Edge TTS'
  level?: 'PREMIUM' | 'BASIC';
  demo?: string;     // direct S3 URL for instant preview playback
  avatarUrl?: string;
  ownership?: 'VBEE' | 'COMMUNITY' | 'PERSONAL';
}

// Microsoft (Edge TTS) voices — the only voices offered in the picker.
// Ids are the server's Edge aliases (server/routes/tts.py _EDGE_VOICES).
export const EDGE_TTS_VOICES: TTSVoice[] = [
  { id: 'hoai-my',  name: 'Hoài My',  gender: 'Nữ',  region: 'Microsoft' },
  { id: 'nam-minh', name: 'Nam Minh', gender: 'Nam', region: 'Microsoft' },
];

export const DEFAULT_VOICE: TTSVoice = EDGE_TTS_VOICES[0];

let _voicesCache: TTSVoice[] | null = null;

export function clearVoicesCache() {
  _voicesCache = null;
}

const LOCALE_MAP: Record<string, string> = {
  northern: 'Miền Bắc',
  southern: 'Miền Nam',
  central: 'Miền Trung',
};

function mapDetailedVoice(v: any): TTSVoice {
  return {
    id: v.code,
    name: v.name,
    gender: v.gender === 'male' ? 'Nam' : 'Nữ',
    region: LOCALE_MAP[v.locale as string] ?? 'Khác',
    level: v.level as 'PREMIUM' | 'BASIC',
    demo: v.demo,
    avatarUrl: v.round_image,
    ownership: 'VBEE',
  };
}

function mapPublicVoice(v: any, ownership: TTSVoice['ownership']): TTSVoice {
  return {
    id: v.code,
    name: v.name,
    gender: v.gender === 'male' ? 'Nam' : 'Nữ',
    region: ownership === 'COMMUNITY' ? 'Giọng cộng đồng' : 'Giọng cá nhân',
    demo: v.demo,
    avatarUrl: v.round_image,
    ownership,
  };
}

export async function fetchVbeeVoices(): Promise<TTSVoice[]> {
  if (_voicesCache) return _voicesCache;
  const { authFetch } = await import('./auth');
  const resp = await authFetch('/api/vbee-voices');
  if (!resp.ok) throw new Error('Failed to fetch voices');
  const data = await resp.json();
  const voices = (data.result?.voices ?? [])
    .filter((v: any) => v.active)
    .map(mapDetailedVoice);
  _voicesCache = voices;
  return voices;
}

export interface CommunityVoicesPage {
  voices: TTSVoice[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export async function fetchCommunityVoices(cursor: string | null, limit = 20, search?: string): Promise<CommunityVoicesPage> {
  const { authFetch } = await import('./auth');
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  if (search?.trim()) params.set('search', search.trim());
  const resp = await authFetch(`/api/vbee-voices/community?${params}`);
  if (!resp.ok) throw new Error('Failed to fetch community voices');
  const data = await resp.json();
  const voices = (data.result?.voices ?? []).map((v: any) => mapPublicVoice(v, 'COMMUNITY'));
  return {
    voices,
    nextCursor: data.result?.next_cursor ?? null,
    hasNextPage: data.result?.has_next_page ?? false,
  };
}

// Generate TTS audio, returns a persistent server URL
export async function generateTTS(text: string, voiceId: string = DEFAULT_VOICE.id, speed: string = '1.0'): Promise<string> {
  const { authFetch } = await import('./auth');
  const params = new URLSearchParams({ text, voice: voiceId, speed });
  const response = await authFetch(`/api/tts?${params}`);
  if (!response.ok) throw new Error(`TTS failed: ${response.statusText}`);
  const data = await response.json();
  return data.url;
}

// Get audio duration from a URL
export function getAudioDuration(audioUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio(audioUrl);
    audio.onloadedmetadata = () => resolve(audio.duration && isFinite(audio.duration) ? audio.duration : 0);
    audio.onerror = () => resolve(0);
  });
}

// Generate TTS for multiple blocks in parallel with concurrency limit
export async function generateTTSParallel(
  blocks: { id: number; content: string; speed?: string }[],
  voiceId: string,
  concurrency: number = 5,
  onBlockDone?: (blockId: number, audioUrl: string, duration: number) => void,
): Promise<void> {
  const queue = blocks.filter(b => b.content?.trim());
  let index = 0;

  async function worker() {
    while (index < queue.length) {
      const block = queue[index++];
      const speed = block.speed?.replace('x', '') || '1.0';
      try {
        const audioUrl = await generateTTS(block.content, voiceId, speed);
        const duration = await getAudioDuration(audioUrl);
        onBlockDone?.(block.id, audioUrl, duration);
      } catch (err) {
        console.warn(`[TTS] block ${block.id} failed:`, err);
        try {
          const audioUrl = await generateTTS(block.content, voiceId, speed);
          const duration = await getAudioDuration(audioUrl);
          onBlockDone?.(block.id, audioUrl, duration);
        } catch (retryErr) {
          console.error(`[TTS] block ${block.id} retry also failed:`, retryErr);
        }
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker());
  await Promise.all(workers);
}
