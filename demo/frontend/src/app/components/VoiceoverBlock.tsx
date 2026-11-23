import { Play, Pause, Loader2, Plus, MoreVertical, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import SpeedPicker from './SpeedPicker';

interface VoiceoverBlockProps {
  block: any;
  index: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isTtsLoading?: boolean;
  autoEdit?: boolean;
  onAutoEditConsumed?: () => void;
  onBlockClick: (id: number) => void;
  onCheckboxChange: (id: number) => void;
  onContentChange?: (id: number, newContent: string) => void;
  onPlayBlock?: (id: number) => void;
  currentPlayingBlockId?: number | null;
  onVoiceClick?: (blockId: number) => void;
  onDelete?: (id: number) => void;
  onDeleteFromHere?: (id: number) => void;
  onMergeWithPrev?: () => void;
  onInsertBefore?: () => void;
  onSpeedChange?: (id: number, speed: string) => void;
}

export default function VoiceoverBlock({
  block,
  index,
  isSelected,
  isHighlighted,
  isTtsLoading,
  autoEdit,
  onAutoEditConsumed,
  onBlockClick,
  onCheckboxChange,
  onContentChange,
  onPlayBlock,
  currentPlayingBlockId,
  onVoiceClick,
  onDelete,
  onDeleteFromHere,
  onMergeWithPrev,
  onInsertBefore,
  onSpeedChange,
}: VoiceoverBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(block.content || '');
  const [showMenu, setShowMenu] = useState(false);

  // Sync local state when block.content changes from outside (e.g. merge)
  useEffect(() => {
    if (!isEditing) setEditedContent(block.content || '');
  }, [block.content]); // eslint-disable-line react-hooks/exhaustive-deps
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const speedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  // Auto-enter edit mode for newly added blocks
  const isAutoEdit = useRef(false);
  useEffect(() => {
    if (autoEdit) {
      isAutoEdit.current = true;
      setIsEditing(true);
      onAutoEditConsumed?.();
    }
  }, [autoEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus textarea and place cursor at end when entering edit mode.
  // When triggered by autoEdit (new block), also scroll into view — this
  // runs AFTER React has committed the textarea to DOM, so it always works.
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.selectionStart = el.selectionEnd = el.value.length;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
      if (isAutoEdit.current) {
        isAutoEdit.current = false;
        // Scroll the block container into center view
        const blockEl = document.getElementById(`text-block-${block.id}`);
        if (blockEl) blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContentBlur = () => {
    setIsEditing(false);
    if (onContentChange && editedContent !== block.content) {
      onContentChange(block.id, editedContent);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

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

      <div
        onClick={() => { onBlockClick(block.id); setIsEditing(true); }}
        className={`rounded-[12px] transition-all cursor-pointer border flex flex-col ${
          isHighlighted
            ? 'bg-white border-[#1E164E] shadow-[0_4px_20px_rgba(30,22,78,0.12)]'
            : isSelected
            ? 'bg-white border-[#1E164E]/30 shadow-[0_1px_4px_rgba(30,22,78,0.06)]'
            : 'bg-white/90 border-transparent shadow-[0_1px_4px_rgba(30,22,78,0.06)] hover:shadow-[0_4px_16px_rgba(30,22,78,0.1)] hover:bg-white'
        }`}
        style={{ minHeight: 136 }}
      >
        {/* Header row: Checkbox | Divider | Speaker info | Play | Menu */}
        <div className="flex items-center px-4 py-3">
          {/* Checkbox */}
          <div className="flex items-center flex-shrink-0" onClick={(e) => { e.stopPropagation(); onCheckboxChange(block.id); }}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
              isSelected ? 'bg-[#1e164e] border-[#1e164e]' : 'border-gray-300 hover:border-gray-400'
            }`}>
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
          <div className="w-px h-6 bg-[rgba(60,60,67,0.16)] mx-3 flex-shrink-0" />

          {/* Speaker info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex-shrink-0" />
            <button
              className="font-['SF_Pro_Text:Medium',sans-serif] text-[14px] text-[rgba(30,22,78,0.8)] hover:text-[#007aff] transition-colors truncate max-w-[180px] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onVoiceClick?.(block.id);
              }}
              title={block.voice?.name || 'Henry (M)'}
            >
              {block.voice?.name || 'Henry (M)'}
            </button>
            <button
              className="flex items-center flex-shrink-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onVoiceClick?.(block.id);
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
                title="Tốc độ đọc"
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[12px] text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {block.speed || '1.0x'}
              </button>
              {showSpeedPicker && (
                <SpeedPicker
                  currentSpeed={block.speed}
                  onSelect={(s) => { onSpeedChange?.(block.id, s); setShowSpeedPicker(false); }}
                  onClose={() => setShowSpeedPicker(false)}
                  position="top"
                  containerRef={speedRef}
                />
              )}
            </div>

          </div>

          {/* Play button */}
          <button
            className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            disabled={isTtsLoading}
            onClick={(e) => {
              e.stopPropagation();
              onPlayBlock?.(block.id);
            }}
          >
            {isTtsLoading
              ? <Loader2 className="w-5 h-5 text-[rgba(30,22,78,0.8)] animate-spin" />
              : currentPlayingBlockId === block.id
                ? <Pause className="w-5 h-5 text-[rgba(30,22,78,0.8)]" />
                : <Play className="w-5 h-5 text-[rgba(30,22,78,0.8)]" />}
          </button>

          {/* Three-dot menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((v) => !v);
              }}
            >
              <MoreVertical className="w-5 h-5 text-[rgba(30,22,78,0.8)]" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-[10px] shadow-lg border border-gray-100 py-1 min-w-[200px] z-50">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete?.(block.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 flex-shrink-0" />
                  Xoá block
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDeleteFromHere?.(block.id);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  Xoá từ đây trở về sau
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex flex-col px-4 pb-3 flex-1 overflow-hidden">
          {/* Vertical line + text row */}
          <div className="flex">
            {/* Vertical line — stretches to match text height only */}
            <div className={`w-px rounded-full flex-shrink-0 mr-4 self-stretch ${isHighlighted ? 'bg-[#1C1C1E]' : 'bg-[rgba(28,28,30,0.24)]'}`} />

            {/* Text content */}
            <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={editedContent}
                  onChange={handleTextareaChange}
                  onBlur={handleContentBlur}
                  onClick={() => onBlockClick(block.id)}
                  autoFocus
                  className={`w-full font-['SF_Pro_Text:Regular',sans-serif] text-[14px] leading-[20px] bg-transparent border-none outline-none resize-none min-h-[20px] ${isHighlighted ? 'text-[rgba(30,22,78,0.8)]' : 'text-[rgba(28,28,30,0.48)]'}`}
                  placeholder="Nhập văn bản..."
                />
              ) : (
                <p
                  onClick={() => {
                    setIsEditing(true);
                    onBlockClick(block.id);
                  }}
                  className={`w-full font-['SF_Pro_Text:Regular',sans-serif] text-[14px] leading-[20px] cursor-text hover:bg-white/50 rounded px-1 -mx-1 transition-colors min-h-[20px] whitespace-pre-wrap ${isHighlighted ? 'text-[rgba(30,22,78,0.8)]' : 'text-[rgba(28,28,30,0.48)]'}`}
                >
                  {block.content || ''}
                </p>
              )}
            </div>
          </div>

          {/* Character count — below text, right-aligned */}
          <div className="flex justify-end mt-auto">
            <span className="font-['SF_Pro_Text:Regular',sans-serif] text-[12px] text-[#007aff]">
              {isEditing ? editedContent.length : (block.content || '').length}
            </span>
            <span className="font-['SF_Pro_Text:Regular',sans-serif] text-[12px] text-[rgba(28,28,30,0.64)]">
              /500
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
