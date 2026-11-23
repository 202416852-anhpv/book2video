import { X, Play, Pause, Search, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  EDGE_TTS_VOICES,
  generateTTS,
  type TTSVoice
} from "../utils/ttsService";
import { analytics, ANALYTICS_EVENTS } from "../utils/analytics";

interface VoiceSelectionModalProps {
  onClose: () => void;
  onSelectVoice: (voice: TTSVoice) => void;
  currentVoiceId?: string;
}

// Microsoft voices have no demo clips — preview synthesises a short sample (cached server-side).
const previewText = (voice: TTSVoice) => `Xin chào, mình là ${voice.name}.`;

function VoiceAvatar({ voice }: { voice: TTSVoice }) {
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-[15px] font-semibold shrink-0 ${
        voice.gender === "Nam" ? "bg-blue-500" : "bg-pink-500"
      }`}
    >
      {voice.name.charAt(0)}
    </div>
  );
}

function VoiceRow({
  voice,
  isSelected,
  isPlaying,
  isPreviewLoading,
  onPreview,
  onSelect,
}: {
  voice: TTSVoice;
  isSelected: boolean;
  isPlaying: boolean;
  isPreviewLoading: boolean;
  onPreview: (v: TTSVoice) => void;
  onSelect: (v: TTSVoice) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-[12px] border transition-all ${
        isSelected
          ? "border-[#1e164e] bg-[#1e164e]/[0.03]"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <VoiceAvatar voice={voice} />

      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-[#1c1c1e] tracking-[-0.2px]">
          {voice.name}
        </div>
        <div className="text-[12px] text-gray-400 mt-0.5 truncate">
          {voice.gender} · {voice.region}
        </div>
      </div>

      <button
        onClick={() => onPreview(voice)}
        title={isPlaying || isPreviewLoading ? "Dừng" : "Nghe thử"}
        className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors shrink-0 cursor-pointer ${
          isPlaying
            ? "bg-[#1e164e] border-[#1e164e] text-white"
            : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        {isPreviewLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5 ml-0.5" />
        )}
      </button>

      <button
        onClick={() => onSelect(voice)}
        className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors shrink-0 cursor-pointer ${
          isSelected
            ? "bg-[#1e164e] text-white"
            : "bg-white border border-gray-200 text-[#1e164e] hover:bg-gray-50"
        }`}
      >
        {isSelected ? "Đã chọn" : "Dùng"}
      </button>
    </div>
  );
}

export default function VoiceSelectionModal({
  onClose,
  onSelectVoice,
  currentVoiceId,
}: VoiceSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewTokenRef = useRef(0); // bumps on every preview click so stale syntheses are dropped
  const resultCountRef = useRef(0); // latest visible result count, for analytics

  // Track that the voice picker was opened (once per mount)
  useEffect(() => {
    analytics.track(ANALYTICS_EVENTS.VOICE_MODAL_OPENED, {});
  }, []);

  // Track search queries — debounced so we log the settled term, not every keystroke.
  useEffect(() => {
    const term = searchQuery.trim();
    if (!term) return;
    const t = setTimeout(() => {
      analytics.track(ANALYTICS_EVENTS.VOICE_SEARCH, {
        query: term,
        query_length: term.length,
        result_count: resultCountRef.current,
      });
    }, 700);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Stop any preview when the modal closes.
  useEffect(() => () => {
    previewTokenRef.current++;
    audioRef.current?.pause();
  }, []);

  // ── Audio preview ─────────────────────────────────────────────────────────
  const stopPreview = () => {
    previewTokenRef.current++;
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingId(null);
    setPreviewLoadingId(null);
  };

  const handlePreview = async (voice: TTSVoice) => {
    const wasActive = playingId === voice.id || previewLoadingId === voice.id;
    stopPreview();
    if (wasActive) return;

    const token = previewTokenRef.current;
    setPreviewLoadingId(voice.id);
    try {
      const url = await generateTTS(previewText(voice), voice.id);
      if (token !== previewTokenRef.current) return;
      const audio = new Audio(url);
      audioRef.current = audio;
      setPreviewLoadingId(null);
      setPlayingId(voice.id);
      audio.onended = () => { setPlayingId(null); audioRef.current = null; };
      audio.onerror = () => { setPlayingId(null); audioRef.current = null; };
      await audio.play();
    } catch {
      if (token === previewTokenRef.current) stopPreview();
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const q = searchQuery.toLowerCase().trim();
  const filtered = EDGE_TTS_VOICES.filter(
    (v) => !q || v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q)
  );

  // Keep latest visible count for the debounced search event.
  resultCountRef.current = filtered.length;

  const handleSelect = (voice: TTSVoice) => {
    stopPreview();
    const rank = filtered.findIndex((v) => v.id === voice.id); // 0-based
    analytics.track(ANALYTICS_EVENTS.VOICE_SELECTED, {
      voice_id: voice.id,
      voice_name: voice.name,
      from_search: q !== "",
      search_query: q || undefined,
      selected_rank: rank >= 0 ? rank : undefined, // 0 = top of list
      total_loaded: filtered.length,               // how many voices were on screen
    });
    onSelectVoice(voice);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[16px] w-[560px] max-h-[80vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-[18px] font-semibold text-[#1c1c1e] tracking-[-0.4px]">
            Chọn giọng đọc
          </h2>
          <button
            onClick={onClose}
            title="Đóng"
            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-3 pb-3 shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-[10px] px-3 py-2 focus-within:border-[#1e164e] transition-colors">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên giọng..."
              className="flex-1 text-[13px] bg-transparent outline-none text-[#1c1c1e] placeholder:text-gray-400"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                title="Xóa tìm kiếm"
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Voice list */}
        <div className="flex-1 overflow-y-auto px-6 pb-5">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-[13px] text-gray-400">
              Không tìm thấy giọng phù hợp
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((voice) => (
                <VoiceRow
                  key={voice.id}
                  voice={voice}
                  isSelected={currentVoiceId === voice.id}
                  isPlaying={playingId === voice.id}
                  isPreviewLoading={previewLoadingId === voice.id}
                  onPreview={handlePreview}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
