import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Settings2, RotateCcw, Check } from 'lucide-react';
import { CAPTION_PRESETS, PRESET_LIST } from './caption-presets';
import type { CaptionPresetId, CaptionStyleConfig } from './caption-types';
import { CAPTION_BASE_FONT_SIZE } from './caption-types';

interface CaptionStyleSelectorProps {
  activePresetId: CaptionPresetId;
  activeStyle: CaptionStyleConfig;
  onSelectPreset: (id: CaptionPresetId, config: CaptionStyleConfig) => void;
  onEditPreset: (id: CaptionPresetId) => void;
  onResetPreset: (id: CaptionPresetId) => void;
  onUpdatePresetColor?: (id: CaptionPresetId, field: 'textColor' | 'highlightBg', color: string) => void;
}

const S = 0.12; // scale for thumbnail

function previewShadow(p: CaptionStyleConfig): string | undefined {
  const parts: string[] = [];
  if (p.outline.enabled) {
    const w = Math.max(0.5, p.outline.width * S);
    const c = p.outline.color;
    parts.push(`${w}px ${w}px 0 ${c}`, `${-w}px ${-w}px 0 ${c}`, `${w}px ${-w}px 0 ${c}`, `${-w}px ${w}px 0 ${c}`);
  }
  if (p.shadow.enabled) {
    parts.push(`${p.shadow.offsetX * S}px ${p.shadow.offsetY * S}px ${p.shadow.blur * S}px ${p.shadow.color}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

function previewFontSize(p: CaptionStyleConfig): number {
  return Math.max(10, Math.min(36, CAPTION_BASE_FONT_SIZE * (p.sizeScale / 100) * S));
}

/** Clickable color dot with native color picker. */
function ColorDot({ color, size = 14, title, onChange }: { color: string; size?: number; title?: string; onChange?: (c: string) => void }) {
  return (
    <label
      className="rounded-full shrink-0 cursor-pointer relative"
      title={title}
      style={{
        width: size, height: size, backgroundColor: color,
        border: '1.5px solid rgba(0,0,0,0.15)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {onChange && (
        <input
          type="color"
          value={color.startsWith('#') ? color : '#ffffff'}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      )}
    </label>
  );
}

function PresetCard({ id, label, isActive, isModified, onSelect, onEdit, onReset, onColorChange }: {
  id: CaptionPresetId; label: string; isActive: boolean; isModified: boolean;
  onSelect: () => void; onEdit: () => void; onReset: () => void;
  onColorChange?: (field: 'textColor' | 'highlightBg', color: string) => void;
}) {
  const p = CAPTION_PRESETS[id];
  const fontSize = previewFontSize(p);
  const shadow = previewShadow(p);
  const bg = p.background;
  const bgEnabled = bg.enabled && bg.color !== 'transparent';
  const wh = p.wordHighlight;
  const hasHighlight = wh.enabled;

  return (
    <div
      onClick={onSelect}
      aria-selected={isActive}
      data-preset-id={id}
      className={`rounded-[10px] cursor-pointer overflow-hidden border-2 transition-all duration-100 relative
        ${isActive
          ? 'border-[#4A90D9] ring-1 ring-[#4A90D9]/25'
          : 'border-transparent hover:border-[rgba(60,60,67,0.2)]'
        }`}
    >
      {/* Active check badge */}
      {isActive && (
        <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
          <Check className="w-3 h-3 text-[#1c1c1e]" strokeWidth={3} />
        </div>
      )}
      {id === 'none' ? (
        <div className="h-20 bg-[#f5f5f7] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(28,28,30,0.3)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M4.93 4.93l14.14 14.14" />
          </svg>
        </div>
      ) : (
        <div className="h-20 bg-[#1a1a1a] flex items-center justify-center px-3 overflow-hidden relative">
          {/* Preview text */}
          {hasHighlight ? (
            <span style={{
              fontFamily: `'${p.fontFamily}', sans-serif`,
              fontWeight: p.fontWeight,
              fontSize,
              display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center',
              textShadow: shadow,
              textTransform: p.textTransform,
            }}>
              <span style={{ color: p.textColor }}>Hey</span>
              <span style={{
                color: wh.color,
                borderRadius: 3,
                padding: wh.opacity > 0 ? '1px 4px' : undefined,
                position: 'relative',
              }}>
                {wh.opacity > 0 && (
                  <span style={{
                    position: 'absolute', inset: 0, borderRadius: 3,
                    backgroundColor: wh.backgroundColor,
                    opacity: Math.max(wh.opacity, 0.3),
                  }} />
                )}
                <span style={{ position: wh.opacity > 0 ? 'relative' : undefined }}>Everybody</span>
              </span>
            </span>
          ) : (
            <span style={{
              fontFamily: `'${p.fontFamily}', sans-serif`,
              fontWeight: p.fontWeight,
              fontSize,
              color: p.textColor,
              textTransform: p.textTransform,
              textShadow: shadow,
              background: bgEnabled ? bg.color : undefined,
              borderRadius: bgEnabled ? bg.borderRadius * S : undefined,
              padding: bgEnabled ? '2px 8px' : undefined,
              textAlign: 'center',
              lineHeight: 1.3,
            }}>
              Hey Everybody
            </span>
          )}
        </div>
      )}

      {/* Footer: label + indicators + settings */}
      <div className={`flex items-center justify-between px-2.5 py-2
        ${isActive ? 'bg-[#1c1c1e]/[0.06]' : 'bg-[#f8f8fa]'}`}>
        <span className={`text-[13px] font-semibold truncate flex-1
          ${isActive ? 'text-[#1c1c1e]' : 'text-[rgba(28,28,30,0.5)]'}`}>
          {label}
        </span>

        {id !== 'none' && (
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {/* Color dots (not for Negative) */}
            {id !== 'negative' && (
              <>
                <ColorDot color={p.textColor} size={16} title="Text color"
                  onChange={onColorChange ? c => onColorChange('textColor', c) : undefined} />
                {hasHighlight && (wh.opacity > 0 || wh.color !== p.textColor) && (
                  <ColorDot
                    color={wh.opacity > 0 ? wh.backgroundColor : wh.color}
                    size={16}
                    title={wh.opacity > 0 ? 'Highlight background' : 'Highlight text color'}
                    onChange={onColorChange ? c => onColorChange('highlightBg', c) : undefined}
                  />
                )}
              </>
            )}
            {/* Configure settings */}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-0.5 rounded hover:bg-black/10 transition-colors cursor-pointer"
              title="Configure settings"
            >
              <Settings2 className="w-4 h-4 text-[rgba(28,28,30,0.4)]" />
            </button>
            {/* Reset to default */}
            <button
              onClick={(e) => { e.stopPropagation(); if (isModified) onReset(); }}
              disabled={!isModified}
              className={`p-0.5 rounded transition-colors cursor-pointer ${isModified ? 'hover:bg-black/10 text-[rgba(28,28,30,0.4)]' : 'text-[rgba(28,28,30,0.15)] cursor-default'}`}
              title="Reset to default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Check if the active style differs from the default preset. */
function isStyleModified(active: CaptionStyleConfig, presetId: CaptionPresetId): boolean {
  const def = CAPTION_PRESETS[presetId];
  if (!def) return false;
  return JSON.stringify(active) !== JSON.stringify(def);
}

export default function CaptionStyleSelector({ activePresetId, activeStyle, onSelectPreset, onEditPreset, onResetPreset, onUpdatePresetColor }: CaptionStyleSelectorProps) {
  const modified = useMemo(() => isStyleModified(activeStyle, activePresetId), [activeStyle, activePresetId]);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(2);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width ?? 300;
      setCols(w < 420 ? 1 : 2);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-scroll to active preset on mount
  useEffect(() => {
    const container = gridRef.current;
    if (!container) return;
    const activeEl = container.querySelector(`[data-preset-id="${activePresetId}"]`);
    if (activeEl) {
      requestAnimationFrame(() => {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
  }, [activePresetId]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-3 border-b border-[rgba(60,60,67,0.16)]">
        <span className="font-['SF_Pro_Text:Semibold',sans-serif] text-[15px] text-[#1c1c1e]">Captions</span>
      </div>

      <div ref={gridRef} className="flex-1 overflow-y-auto px-3 py-3">
        <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {PRESET_LIST.map(({ id, label }) => (
            <PresetCard
              key={id}
              id={id}
              label={label}
              isActive={activePresetId === id}
              isModified={activePresetId === id && modified}
              onSelect={() => onSelectPreset(id, CAPTION_PRESETS[id])}
              onEdit={() => onEditPreset(id)}
              onReset={() => onResetPreset(id)}
              onColorChange={onUpdatePresetColor ? (field, color) => onUpdatePresetColor(id, field, color) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
