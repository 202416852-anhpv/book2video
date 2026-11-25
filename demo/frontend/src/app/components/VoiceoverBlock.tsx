import { Play, Pause, Loader2, Plus, MoreVertical, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import SpeedPicker from './SpeedPicker';
import type { SentenceData } from '../types/block';

interface SentenceRowProps {
  sentence: SentenceData;
  sentenceIndex: number;
  totalSentences: number;
  blockId: number;
  blockVoice: any;
  blockSpeed: string;
  isSelected: boolean;
  isHighlighted: boolean;
  isTtsLoading?: boolean;
  isPlaying?: boolean;
  autoFocus?: boolean;
  onAutoFocusConsumed?: () => void;
  onCheckboxChange: () => void;
  onSentenceClick: () => void;
  onContentChange: (newContent: string) => void;
  onPlaySentence: () => void;
  onVoiceClick: () => void;
  onSpeedChange: (speed: string) => void;
  onAddSentenceAfter: () => void;
  onDeleteSentence?: () => void;
  onDeleteBlock?: () => void;
  onDeleteFromHere?: () => void;
}

function SentenceRow({
  sentence,
  totalSentences,
  blockVoice,
  blockSpeed,
  isSelected,
  isHighlighted,
  isTtsLoading,
  isPlaying,
  autoFocus,
  onAutoFocusConsumed,
  onCheckboxChange,
  onSentenceClick,
  onContentChange,
  onPlaySentence,
  onVoiceClick,
  onSpeedChange,
  onAddSentenceAfter,
  onDeleteSentence,
  onDeleteBlock,
  onDeleteFromHere,
}: SentenceRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(sentence.content || '');
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const [showRowMenu, setShowRowMenu] = useState(false);
  const speedRef = useRef<HTMLDivElement>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) setEditedContent(sentence.content || '');
  }, [sentence.content, isEditing]);

  useEffect(() => {
    if (autoFocus) {
      setIsEditing(true);
      onAutoFocusConsumed?.();
    }
  }, [autoFocus, onAutoFocusConsumed]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.selectionStart = el.selectionEnd = el.value.length;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [isEditing]);

  useEffect(() => {
    if (!showRowMenu) return;
    const handler = (e: MouseEvent) => {
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) {
        setShowRowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRowMenu]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editedContent !== sentence.content) {
      onContentChange(editedContent);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const effectiveVoice = sentence.voice || blockVoice;
  const effectiveSpeed = sentence.speed || blockSpeed || '1.0x';
  const charCount = isEditing ? editedContent.length : (sentence.content || '').length;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSentenceClick();
        setIsEditing(true);
      }}
      className={`group/sentence rounded-[10px] border transition-all flex flex-col ${
        isEditing || isPlaying
          ? 'bg-white border-[#1E164E]/40 shadow-[0_2px_10px_rgba(30,22,78,0.08)]'
          : isSelected
          ? 'bg-white border-[#1E164E]/30 shadow-[0_1px_4px_rgba(30,22,78,0.06)]'
          : 'bg-[#f8f8fa]/70 hover:bg-white border-[rgba(30,22,78,0.1)] hover:border-[rgba(30,22,78,0.24)] hover:shadow-[0_2px_8px_rgba(30,22,78,0.05)]'
      }`}
    >
      {/* Header row: Checkbox | Divider | Speaker info | Speed | Play | Menu */}
      <div className="flex items-center px-3.5 py-2.5">
        {/* Checkbox (replaced "Câu 1" / "Câu 2") */}
        <div
          className="flex items-center flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onCheckboxChange();
          }}
        >
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
              isSelected ? 'bg-[#1e164e] border-[#1e164e]' : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            {isSelected && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="sr-only"
          />
        </div>

        {/* Vertical divider */}
        <div className="w-px h-5 bg-[rgba(60,60,67,0.16)] mx-3 flex-shrink-0" />

        {/* Speaker info for this sentence */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex-shrink-0" />
          <button
            className="font-['SF_Pro_Text:Medium',sans-serif] text-[14px] text-[rgba(30,22,78,0.8)] hover:text-[#007aff] transition-colors truncate max-w-[180px] cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onVoiceClick();
            }}
            title={effectiveVoice?.name || 'Henry (M)'}
          >
            {effectiveVoice?.name || 'Henry (M)'}
          </button>
          <button
            className="flex items-center flex-shrink-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onVoiceClick();
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3.26 5.76L5.42 7.92C5.74 8.24 6.27 8.24 6.59 7.92L8.75 5.76C9.28 5.23 8.9 4.33 8.16 4.33H3.84C3.1 4.33 2.73 5.23 3.26 5.76Z" fill="rgba(30,22,78,0.8)"/>
            </svg>
          </button>

          {/* Speed indicator */}
          <div className="relative" ref={speedRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowSpeedPicker(p => !p); }}
              title="Tốc độ đọc câu này"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[12px] text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {effectiveSpeed}
            </button>
            {showSpeedPicker && (
              <SpeedPicker
                currentSpeed={effectiveSpeed}
                onSelect={(s) => { onSpeedChange(s); setShowSpeedPicker(false); }}
                onClose={() => setShowSpeedPicker(false)}
                position="top"
                containerRef={speedRef}
              />
            )}
          </div>
        </div>

        {/* Play sentence button */}
        <button
          className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          disabled={isTtsLoading}
          title="Nghe thử câu này"
          onClick={(e) => {
            e.stopPropagation();
            onPlaySentence();
          }}
        >
          {isTtsLoading
            ? <Loader2 className="w-5 h-5 text-[rgba(30,22,78,0.8)] animate-spin" />
            : isPlaying
              ? <Pause className="w-5 h-5 text-[rgba(30,22,78,0.8)]" />
              : <Play className="w-5 h-5 text-[rgba(30,22,78,0.8)]" />}
        </button>

        {/* Sentence row menu (Add / Delete sentence / Delete block) */}
        <div className="relative flex-shrink-0" ref={rowMenuRef}>
          <button
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowRowMenu((v) => !v);
            }}
          >
            <MoreVertical className="w-5 h-5 text-[rgba(30,22,78,0.8)]" />
          </button>

          {showRowMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-[10px] shadow-lg border border-gray-100 py-1 min-w-[200px] z-50">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#1c1c1e] hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRowMenu(false);
                  onAddSentenceAfter();
                }}
              >
                <Plus className="w-4 h-4 flex-shrink-0 text-gray-500" />
                Thêm câu bên dưới
              </button>
              {totalSentences > 1 && onDeleteSentence && (
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRowMenu(false);
                    onDeleteSentence();
                  }}
                >
                  <Trash2 className="w-4 h-4 flex-shrink-0" />
                  Xoá câu này
                </button>
              )}
              {onDeleteBlock && (
                <>
                  <div className="my-1 h-px bg-gray-100" />
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRowMenu(false);
                      onDeleteBlock();
                    }}
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    Xoá block
                  </button>
                </>
              )}
              {onDeleteFromHere && (
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRowMenu(false);
                    onDeleteFromHere();
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  Xoá từ đây trở về sau
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sentence text content + character count */}
      <div className="flex flex-col px-3.5 pb-2.5 flex-1 overflow-hidden">
        <div className="flex">
          <div className={`w-px rounded-full flex-shrink-0 mr-4 self-stretch ${isHighlighted || isEditing ? 'bg-[#1C1C1E]' : 'bg-[rgba(28,28,30,0.24)]'}`} />
          <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={editedContent}
                onChange={handleTextareaChange}
                onBlur={handleBlur}
                onClick={() => onSentenceClick()}
                autoFocus
                rows={1}
                className={`w-full font-['SF_Pro_Text:Regular',sans-serif] text-[14px] leading-[20px] bg-transparent border-none outline-none resize-none min-h-[20px] ${
                  isHighlighted || isEditing ? 'text-[rgba(30,22,78,0.8)]' : 'text-[rgba(28,28,30,0.48)]'
                }`}
                placeholder="Nhập văn bản..."
              />
            ) : (
              <p
                onClick={() => {
                  setIsEditing(true);
                  onSentenceClick();
                }}
                className={`w-full font-['SF_Pro_Text:Regular',sans-serif] text-[14px] leading-[20px] cursor-text hover:bg-white/60 rounded px-1 -mx-1 transition-colors min-h-[20px] whitespace-pre-wrap ${
                  isHighlighted ? 'text-[rgba(30,22,78,0.8)]' : 'text-[rgba(28,28,30,0.48)]'
                }`}
              >
                {sentence.content || ''}
              </p>
            )}
          </div>
        </div>

        {/* Character count for this sentence */}
        <div className="flex justify-end mt-1.5">
          <span className="font-['SF_Pro_Text:Regular',sans-serif] text-[12px] text-[#007aff]">
            {charCount}
          </span>
          <span className="font-['SF_Pro_Text:Regular',sans-serif] text-[12px] text-[rgba(28,28,30,0.64)]">
            /500
          </span>
        </div>
      </div>
    </div>
  );
}

interface VoiceoverBlockProps {
  block: any;
  index: number;
  isSelected: boolean;
  selectedSentenceIds?: string[];
  isHighlighted: boolean;
  isTtsLoading?: boolean;
  ttsLoadingSentenceIds?: Set<string>;
  autoEdit?: boolean;
  onAutoEditConsumed?: () => void;
  onBlockClick: (id: number, seekSeconds?: number) => void;
  onCheckboxChange: (id: number) => void;
  onSentenceCheckboxChange?: (blockId: number, sentenceId: string) => void;
  onContentChange?: (id: number, newContent: string) => void;
  onSentenceContentChange?: (blockId: number, sentenceId: string, newContent: string) => void;
  onPlayBlock?: (id: number) => void;
  onPlaySentence?: (blockId: number, sentenceId: string) => void;
  currentPlayingBlockId?: number | null;
  currentPlayingSentenceId?: string | null;
  onVoiceClick?: (blockId: number, sentenceId?: string) => void;
  onDelete?: (id: number) => void;
  onDeleteFromHere?: (id: number) => void;
  onMergeWithPrev?: () => void;
  onInsertBefore?: () => void;
  onSpeedChange?: (id: number, speed: string) => void;
  onSentenceSpeedChange?: (blockId: number, sentenceId: string, speed: string) => void;
  onAddSentence?: (blockId: number, afterSentenceId?: string) => void;
  onDeleteSentence?: (blockId: number, sentenceId: string) => void;
}

export default function VoiceoverBlock({
  block,
  index,
  isSelected,
  selectedSentenceIds,
  isHighlighted,
  isTtsLoading,
  ttsLoadingSentenceIds,
  autoEdit,
  onAutoEditConsumed,
  onBlockClick,
  onCheckboxChange,
  onSentenceCheckboxChange,
  onContentChange,
  onSentenceContentChange,
  onPlayBlock,
  onPlaySentence,
  currentPlayingBlockId,
  currentPlayingSentenceId,
  onVoiceClick,
  onDelete,
  onDeleteFromHere,
  onMergeWithPrev,
  onInsertBefore,
  onSpeedChange,
  onSentenceSpeedChange,
  onAddSentence,
  onDeleteSentence,
}: VoiceoverBlockProps) {
  const [newlyAddedSentenceId, setNewlyAddedSentenceId] = useState<string | null>(null);

  // Derive normalized sentences list from block.sentences or fallback to splitting block.content by newline
  const sentences: SentenceData[] = useMemo(() => {
    if (Array.isArray(block.sentences) && block.sentences.length > 0) {
      return block.sentences;
    }
    const rawLines = (block.content || '').split('\n').map((s: string) => s.trim()).filter(Boolean);
    if (rawLines.length === 0) {
      return [{
        id: `b${block.id}_s1`,
        content: '',
        voice: block.voice,
        speed: block.speed || '1.0x',
        startSeconds: block.startSeconds,
        endSeconds: block.endSeconds,
      }];
    }
    const startSec = block.startSeconds ?? 0;
    const endSec = block.endSeconds ?? startSec + 5;
    const totalDur = Math.max(0.5, endSec - startSec);
    const totalChars = Math.max(1, rawLines.reduce((acc: number, l: string) => acc + l.length, 0));
    let cursor = startSec;
    return rawLines.map((line: string, idx: number) => {
      const dur = idx === rawLines.length - 1
        ? Math.max(0.2, endSec - cursor)
        : Math.max(0.2, (line.length / totalChars) * totalDur);
      const sStart = Math.round(cursor * 100) / 100;
      const sEnd = Math.round((cursor + dur) * 100) / 100;
      cursor = sEnd;
      return {
        id: `b${block.id}_s${idx + 1}`,
        content: line,
        voice: block.voice,
        speed: block.speed || '1.0x',
        startSeconds: sStart,
        endSeconds: sEnd,
      };
    });
  }, [block.sentences, block.content, block.id, block.voice, block.speed, block.startSeconds, block.endSeconds]);

  // Auto-scroll when autoEdit is triggered on new block
  useEffect(() => {
    if (autoEdit) {
      const blockEl = document.getElementById(`text-block-${block.id}`);
      if (blockEl) blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [autoEdit, block.id]);

  const handleFallbackSentenceContentChange = (sentenceId: string, newText: string) => {
    if (onSentenceContentChange) {
      onSentenceContentChange(block.id, sentenceId, newText);
    } else if (onContentChange) {
      const updated = sentences.map((s) => (s.id === sentenceId ? newText : s.content)).join('\n');
      onContentChange(block.id, updated);
    }
  };

  const hasAnySelectedSentence = selectedSentenceIds
    ? sentences.some((s) => selectedSentenceIds.includes(s.id))
    : isSelected;

  return (
    <div className="relative mt-10" id={`text-block-${block.id}`}>
      {/* Block label + divider row */}
      <div className="absolute -top-8 left-0 right-0 z-10 flex items-center gap-2 group/divider">
        <span className="font-['SF_Pro_Text:Semibold',sans-serif] text-[14px] text-[rgba(28,28,30,0.64)] shrink-0">
          {index + 1}. Block {index + 1}
        </span>
        {onMergeWithPrev && onInsertBefore && (
          <div className="flex-1 flex items-center gap-1.5 opacity-0 group-hover/divider:opacity-100 transition-opacity duration-150">
            <div className="flex-1 h-px bg-gray-300" />
            <button
              onClick={onMergeWithPrev}
              title="Hợp nhất khối"
              className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 2L8 6L12 2M4 14L8 10L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={onInsertBefore}
              title="Thêm khối mới"
              className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-3 h-3 text-gray-500" />
            </button>
            <div className="flex-1 h-px bg-gray-300" />
          </div>
        )}
      </div>

      {/* Outer Block Border (1 Block = 1 Slide) — no top block-level header */}
      <div
        onClick={() => onBlockClick(block.id)}
        className={`rounded-[12px] transition-all cursor-pointer border flex flex-col p-3.5 gap-2.5 ${
          isHighlighted
            ? 'bg-white border-[#1E164E] shadow-[0_4px_20px_rgba(30,22,78,0.12)]'
            : hasAnySelectedSentence
            ? 'bg-white border-[#1E164E]/30 shadow-[0_1px_4px_rgba(30,22,78,0.06)]'
            : 'bg-white/90 border-[rgba(30,22,78,0.12)] shadow-[0_1px_4px_rgba(30,22,78,0.06)] hover:shadow-[0_4px_16px_rgba(30,22,78,0.1)] hover:bg-white'
        }`}
      >
        {sentences.map((sentence, sIdx) => {
          const isSentenceSelected = selectedSentenceIds
            ? selectedSentenceIds.includes(sentence.id)
            : isSelected;
          return (
            <SentenceRow
              key={sentence.id}
              sentence={sentence}
              sentenceIndex={sIdx}
              totalSentences={sentences.length}
              blockId={block.id}
              blockVoice={block.voice}
              blockSpeed={block.speed || '1.0x'}
              isSelected={isSentenceSelected}
              isHighlighted={isHighlighted}
              isTtsLoading={ttsLoadingSentenceIds?.has(sentence.id) || isTtsLoading}
              isPlaying={
                currentPlayingBlockId === block.id &&
                (currentPlayingSentenceId === sentence.id || !currentPlayingSentenceId)
              }
              autoFocus={
                (autoEdit && sIdx === 0) ||
                newlyAddedSentenceId === sentence.id
              }
              onAutoFocusConsumed={() => {
                if (autoEdit && sIdx === 0) onAutoEditConsumed?.();
                if (newlyAddedSentenceId === sentence.id) setNewlyAddedSentenceId(null);
              }}
              onCheckboxChange={() => {
                if (onSentenceCheckboxChange) {
                  onSentenceCheckboxChange(block.id, sentence.id);
                } else {
                  onCheckboxChange(block.id);
                }
              }}
              onSentenceClick={() => onBlockClick(block.id)}
              onContentChange={(newText) => handleFallbackSentenceContentChange(sentence.id, newText)}
              onPlaySentence={() => {
                if (onPlaySentence) {
                  onPlaySentence(block.id, sentence.id);
                } else {
                  onPlayBlock?.(block.id);
                }
              }}
              onVoiceClick={() => onVoiceClick?.(block.id, sentence.id)}
              onSpeedChange={(speed) => {
                if (onSentenceSpeedChange) {
                  onSentenceSpeedChange(block.id, sentence.id, speed);
                } else {
                  onSpeedChange?.(block.id, speed);
                }
              }}
              onAddSentenceAfter={() => {
                onAddSentence?.(block.id, sentence.id);
              }}
              onDeleteSentence={
                sentences.length > 1 && onDeleteSentence
                  ? () => onDeleteSentence(block.id, sentence.id)
                  : undefined
              }
              onDeleteBlock={onDelete ? () => onDelete(block.id) : undefined}
              onDeleteFromHere={onDeleteFromHere ? () => onDeleteFromHere(block.id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
