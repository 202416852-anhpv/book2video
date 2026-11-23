import { RotateCcw, ChevronRight, Plus, Minus, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ColorPickerPanel } from '../ColorPickerPanel';

const PosYTop = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="2" y1="3" x2="14" y2="3" />
    <line x1="4.5" y1="8" x2="11.5" y2="8" />
    <line x1="4.5" y1="13" x2="11.5" y2="13" />
  </svg>
);
const PosYCenter = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="4.5" y1="3" x2="11.5" y2="3" />
    <line x1="2" y1="8" x2="14" y2="8" />
    <line x1="4.5" y1="13" x2="11.5" y2="13" />
  </svg>
);
const PosYBottom = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="4.5" y1="3" x2="11.5" y2="3" />
    <line x1="4.5" y1="8" x2="11.5" y2="8" />
    <line x1="2" y1="13" x2="14" y2="13" />
  </svg>
);
import { CAPTION_FONTS } from './caption-presets';
import type { CaptionStyleConfig } from './caption-types';

interface CaptionStyleEditorProps {
  style: CaptionStyleConfig;
  presetName: string;
  onChange: (style: CaptionStyleConfig) => void;
  onBack: () => void;
  onReset: () => void;
}

type Align = 'left' | 'center' | 'right';
type PosY = 'top' | 'center' | 'bottom';

function upd(style: CaptionStyleConfig, patch: Partial<CaptionStyleConfig>): CaptionStyleConfig {
  return { ...style, ...patch };
}

/* ── Reusable sub-components matching 11lab layout ── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center w-fit select-none gap-0.5 text-[#1c1c1e] font-medium text-[13px] cursor-default">
      {children}
    </span>
  );
}

function ToggleSectionHeader({ title, enabled, onToggle }: { title: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex w-full items-center justify-between">
      <SectionTitle>{title}</SectionTitle>
      <button
        onClick={onToggle}
        className="inline-flex items-center justify-center h-7 px-2 rounded-lg text-[13px] font-medium transition-colors hover:bg-gray-100 active:bg-gray-200 text-[#1c1c1e] cursor-pointer"
        title={enabled ? 'Tắt' : 'Bật'}
      >
        {enabled
          ? <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
          : <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />}
      </button>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full justify-between gap-4 py-1 min-h-[40px]">
      <div className="flex-1 grow-[1] h-fit min-h-[32px] items-center flex">
        <p className="text-[13px] text-[rgba(28,28,30,0.64)] font-normal">{label}</p>
      </div>
      <div className="flex flex-1 grow-[2] items-center gap-1">
        {children}
      </div>
    </div>
  );
}

function RadioGroup<T extends string>({ value, options, onChange }: {
  value: T;
  options: { id: T; label: React.ReactNode; tooltip?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-[3px] ring-1 ring-inset ring-[rgba(0,0,0,0.06)] rounded-[10px] h-8 p-[3px] bg-[rgba(0,0,0,0.03)] w-full">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`relative h-[26px] flex items-center justify-center rounded-[7px] transition-colors cursor-pointer w-full text-[12px] font-medium
            ${value === opt.id
              ? 'bg-white text-[#1c1c1e] shadow-sm'
              : 'text-[rgba(28,28,30,0.5)] hover:bg-[rgba(0,0,0,0.06)]'}`}
          title={opt.tooltip}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function NumberInputWithUnit({ value, onChange, min, max, step, unit = '%' }: {
  value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit?: string;
}) {
  return (
    <div className="relative flex min-w-[64px] grow">
      <input
        type="number" min={min} max={max} step={step} value={value}
        onChange={e => onChange(clamp(Number(e.target.value), min, max))}
        className="flex w-full border border-[rgba(0,0,0,0.12)] shadow-none transition-colors placeholder:text-gray-400 hover:border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[#1c1c1e] focus:ring-[0.5px] focus:ring-[#1c1c1e] px-2 py-1 pr-6 bg-white h-8 text-[13px] rounded-[10px]"
      />
      <div className="w-8 h-8 absolute top-0 bottom-0 right-0 flex items-center justify-center">
        <span className="text-[rgba(28,28,30,0.4)] text-[13px] font-semibold">{unit}</span>
      </div>
    </div>
  );
}

function SliderRow({ value, onChange, min, max, step = 1 }: {
  value: number; onChange: (v: number) => void; min: number; max: number; step?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative flex touch-none select-none items-center cursor-pointer w-full h-5">
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 appearance-none bg-[rgba(0,0,0,0.1)] rounded-full outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1c1c1e] [&::-webkit-slider-thumb]:cursor-pointer"
        style={{ background: `linear-gradient(to right, #1c1c1e 0%, #1c1c1e ${pct}%, rgba(0,0,0,0.1) ${pct}%, rgba(0,0,0,0.1) 100%)` }}
      />
    </div>
  );
}

function ColorPicker({ value, onChange, opacity, onOpacityChange }: {
  value: string;
  onChange: (v: string) => void;
  /** When provided alongside `onOpacityChange`, the popover renders an opacity slider. 0–1. */
  opacity?: number;
  onOpacityChange?: (v: number) => void;
}) {
  const hex = /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : '#000000';
  return (
    <div className="relative flex items-center">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-8 h-8 rounded-md border border-[rgba(0,0,0,0.12)] shrink-0 transition-colors hover:border-[rgba(0,0,0,0.2)] cursor-pointer"
            style={{ backgroundColor: hex }}
            title="Chọn màu"
          />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-auto p-0 rounded-[14px] border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
        >
          <ColorPickerPanel
            color={hex}
            onChange={onChange}
            opacity={opacity}
            onOpacityChange={onOpacityChange}
          />
        </PopoverContent>
      </Popover>
      <input
        type="text" value={hex} placeholder="#000000"
        onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
        className="ml-2 px-2 py-1 w-24 text-[13px] rounded border border-[rgba(0,0,0,0.12)] bg-transparent focus:outline-none focus:ring-1 focus:ring-[#1c1c1e]"
      />
    </div>
  );
}

function SelectInput({ value, onChange, options, fontPreview }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; fontPreview?: boolean;
}) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex w-full gap-0.5 items-center justify-between whitespace-nowrap transition-colors border border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.2)] text-[#1c1c1e] py-1.5 rounded-[10px] h-8 text-[13px] pl-2 pr-6 bg-white appearance-none cursor-pointer"
        style={fontPreview ? { fontFamily: `'${value}', sans-serif` } : undefined}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={fontPreview ? { fontFamily: `'${o.value}', sans-serif` } : undefined}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  );
}

/* ── Main component ── */

export default function CaptionStyleEditor({ style, presetName, onChange, onBack, onReset }: CaptionStyleEditorProps) {
  const section = 'flex flex-col gap-4 border-t border-[rgba(0,0,0,0.08)] first-of-type:border-0 py-3.5';
  const sectionInner = 'flex flex-col gap-2 w-full';

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3.5 h-11 shrink-0 sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-[rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-1 w-full min-w-0">
          <button onClick={onBack} className="text-[13px] font-medium text-[rgba(28,28,30,0.4)] hover:text-[#1c1c1e] transition-colors cursor-pointer shrink-0">
            Captions
          </button>
          <ChevronRight className="w-4 h-4 text-[rgba(28,28,30,0.3)] shrink-0" />
          <span className="text-[13px] font-medium text-[#1c1c1e] truncate">{presetName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            title="Reset to template values"
          >
            <RotateCcw className="w-4 h-4 text-[rgba(28,28,30,0.4)]" />
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col h-full w-full px-3.5">

          {/* ══ Position ══ */}
          <div className={section}>
            <div className={sectionInner}>
              <SectionTitle>Position</SectionTitle>
              <div className="flex flex-col w-full">
                <SettingRow label="X">
                  <RadioGroup
                    value={style.position.x}
                    options={[
                      { id: 'left' as Align, label: <AlignLeft className="w-4 h-4" />, tooltip: 'Trái' },
                      { id: 'center' as Align, label: <AlignCenter className="w-4 h-4" />, tooltip: 'Giữa' },
                      { id: 'right' as Align, label: <AlignRight className="w-4 h-4" />, tooltip: 'Phải' },
                    ]}
                    onChange={v => onChange(upd(style, { position: { ...style.position, x: v }, textAlign: v }))}
                  />
                  <NumberInputWithUnit
                    value={style.position.offsetX ?? 0} min={-100} max={100} step={1}
                    onChange={v => onChange(upd(style, { position: { ...style.position, offsetX: v } }))}
                  />
                </SettingRow>

                <SettingRow label="Y">
                  <RadioGroup
                    value={style.position.y}
                    options={[
                      { id: 'top' as PosY, label: <PosYTop />, tooltip: 'Trên cùng' },
                      { id: 'center' as PosY, label: <PosYCenter />, tooltip: 'Giữa' },
                      { id: 'bottom' as PosY, label: <PosYBottom />, tooltip: 'Dưới cùng' },
                    ]}
                    onChange={v => onChange(upd(style, { position: { ...style.position, y: v } }))}
                  />
                  <NumberInputWithUnit
                    value={style.position.offsetY ?? 0} min={-100} max={100} step={1}
                    onChange={v => onChange(upd(style, { position: { ...style.position, offsetY: v } }))}
                  />
                </SettingRow>
              </div>
            </div>
          </div>

          {/* ══ Text ══ */}
          <div className={section}>
            <div className={sectionInner}>
              <SectionTitle>Text</SectionTitle>
              <div className="flex flex-col w-full">
                <SettingRow label="Font">
                  <SelectInput
                    value={style.fontFamily}
                    onChange={v => onChange(upd(style, { fontFamily: v }))}
                    options={CAPTION_FONTS.map(f => ({ value: f.family, label: f.label }))}
                    fontPreview
                  />
                </SettingRow>

                <SettingRow label="Weight">
                  <SelectInput
                    value={String(style.fontWeight)}
                    onChange={v => onChange(upd(style, { fontWeight: Number(v) }))}
                    options={[
                      { value: '400', label: 'Normal' },
                      { value: '500', label: 'Medium' },
                      { value: '600', label: 'Semibold' },
                      { value: '700', label: 'Bold' },
                      { value: '800', label: 'Heavy' },
                      { value: '900', label: 'Black' },
                    ]}
                  />
                </SettingRow>

                <SettingRow label="Transform">
                  <SelectInput
                    value={style.textTransform}
                    onChange={v => onChange(upd(style, { textTransform: v as 'none' | 'uppercase' }))}
                    options={[
                      { value: 'none', label: 'Normal' },
                      { value: 'uppercase', label: 'Uppercase' },
                    ]}
                  />
                </SettingRow>

                <SettingRow label="Size">
                  <NumberInputWithUnit
                    value={style.sizeScale ?? 100} min={20} max={500} step={5}
                    onChange={v => onChange(upd(style, { sizeScale: v }))}
                  />
                  <div className="flex grow-[1] flex-1">
                    <SliderRow
                      value={style.sizeScale ?? 100} min={20} max={500} step={5}
                      onChange={v => onChange(upd(style, { sizeScale: v }))}
                    />
                  </div>
                </SettingRow>

                <SettingRow label="Color">
                  <ColorPicker
                    value={style.textColor}
                    onChange={v => onChange(upd(style, { textColor: v }))}
                  />
                </SettingRow>

                <SettingRow label="Spacing">
                  <NumberInputWithUnit
                    value={style.letterSpacing ?? 0} min={-10} max={30} step={0.5} unit="px"
                    onChange={v => onChange(upd(style, { letterSpacing: v }))}
                  />
                  <div className="flex grow-[1] flex-1">
                    <SliderRow
                      value={style.letterSpacing ?? 0} min={-10} max={30} step={0.5}
                      onChange={v => onChange(upd(style, { letterSpacing: v }))}
                    />
                  </div>
                </SettingRow>
              </div>
            </div>
          </div>

          {/* ══ Text Shadow ══ */}
          <div className={section}>
            <div className={sectionInner}>
              <ToggleSectionHeader
                title="Text Shadow"
                enabled={style.shadow.enabled}
                onToggle={() => onChange(upd(style, { shadow: { ...style.shadow, enabled: !style.shadow.enabled } }))}
              />
              {style.shadow.enabled && (
                <div className="flex flex-col w-full">
                  <SettingRow label="Color">
                    <ColorPicker
                      value={style.shadow.color}
                      onChange={v => onChange(upd(style, { shadow: { ...style.shadow, color: v } }))}
                      opacity={style.shadow.opacity}
                      onOpacityChange={v => onChange(upd(style, { shadow: { ...style.shadow, opacity: v } }))}
                    />
                  </SettingRow>
                  <SettingRow label="Opacity">
                    <SliderRow
                      value={style.shadow.opacity} min={0} max={1} step={0.01}
                      onChange={v => onChange(upd(style, { shadow: { ...style.shadow, opacity: v } }))}
                    />
                  </SettingRow>
                  <SettingRow label="Blur">
                    <SliderRow
                      value={style.shadow.blur} min={0} max={20}
                      onChange={v => onChange(upd(style, { shadow: { ...style.shadow, blur: v } }))}
                    />
                  </SettingRow>
                  <SettingRow label="Offset X">
                    <SliderRow
                      value={style.shadow.offsetX} min={-20} max={20} step={0.1}
                      onChange={v => onChange(upd(style, { shadow: { ...style.shadow, offsetX: v } }))}
                    />
                  </SettingRow>
                  <SettingRow label="Offset Y">
                    <SliderRow
                      value={style.shadow.offsetY} min={-20} max={20} step={0.1}
                      onChange={v => onChange(upd(style, { shadow: { ...style.shadow, offsetY: v } }))}
                    />
                  </SettingRow>
                </div>
              )}
            </div>
          </div>

          {/* ══ Text Outline ══ */}
          <div className={section}>
            <div className={sectionInner}>
              <ToggleSectionHeader
                title="Text Outline"
                enabled={style.outline.enabled}
                onToggle={() => onChange(upd(style, { outline: { ...style.outline, enabled: !style.outline.enabled } }))}
              />
              {style.outline.enabled && (
                <div className="flex flex-col w-full">
                  <SettingRow label="Color">
                    <ColorPicker
                      value={style.outline.color}
                      onChange={v => onChange(upd(style, { outline: { ...style.outline, color: v } }))}
                      opacity={style.outline.opacity}
                      onOpacityChange={v => onChange(upd(style, { outline: { ...style.outline, opacity: v } }))}
                    />
                  </SettingRow>
                  <SettingRow label="Opacity">
                    <SliderRow
                      value={style.outline.opacity} min={0} max={1} step={0.01}
                      onChange={v => onChange(upd(style, { outline: { ...style.outline, opacity: v } }))}
                    />
                  </SettingRow>
                  <SettingRow label="Width">
                    <SliderRow
                      value={style.outline.width} min={0} max={20}
                      onChange={v => onChange(upd(style, { outline: { ...style.outline, width: v } }))}
                    />
                  </SettingRow>
                </div>
              )}
            </div>
          </div>

          {/* ══ Background ══ */}
          <div className={section}>
            <div className={sectionInner}>
              <ToggleSectionHeader
                title="Background"
                enabled={style.background.enabled}
                onToggle={() => onChange(upd(style, { background: { ...style.background, enabled: !style.background.enabled } }))}
              />
              {style.background.enabled && (
                <div className="flex flex-col w-full">
                  <SettingRow label="Color">
                    <ColorPicker
                      value={style.background.color}
                      onChange={v => onChange(upd(style, { background: { ...style.background, color: v } }))}
                      opacity={style.background.opacity / 100}
                      onOpacityChange={v => onChange(upd(style, { background: { ...style.background, opacity: Math.round(v * 100) } }))}
                    />
                  </SettingRow>
                  <SettingRow label="Opacity">
                    <SliderRow
                      value={style.background.opacity} min={0} max={100}
                      onChange={v => onChange(upd(style, { background: { ...style.background, opacity: v } }))}
                    />
                  </SettingRow>
                  <SettingRow label="Radius">
                    <SliderRow
                      value={style.background.borderRadius} min={0} max={24}
                      onChange={v => onChange(upd(style, { background: { ...style.background, borderRadius: v } }))}
                    />
                  </SettingRow>
                </div>
              )}
            </div>
          </div>

          {/* ══ Word Highlights ══ */}
          <div className={section}>
            <div className={sectionInner}>
              <ToggleSectionHeader
                title="Word Highlights"
                enabled={style.wordHighlight.enabled}
                onToggle={() => onChange(upd(style, { wordHighlight: { ...style.wordHighlight, enabled: !style.wordHighlight.enabled } }))}
              />
              {style.wordHighlight.enabled && (
                <div className="flex flex-col w-full">
                  <SettingRow label="Color">
                    <ColorPicker
                      value={style.wordHighlight.color}
                      onChange={v => onChange(upd(style, { wordHighlight: { ...style.wordHighlight, color: v } }))}
                      opacity={style.wordHighlight.opacity}
                      onOpacityChange={v => onChange(upd(style, { wordHighlight: { ...style.wordHighlight, opacity: v } }))}
                    />
                  </SettingRow>
                  <SettingRow label="Background">
                    <ColorPicker
                      value={style.wordHighlight.backgroundColor}
                      onChange={v => onChange(upd(style, { wordHighlight: { ...style.wordHighlight, backgroundColor: v } }))}
                      opacity={style.wordHighlight.opacity}
                      onOpacityChange={v => onChange(upd(style, { wordHighlight: { ...style.wordHighlight, opacity: v } }))}
                    />
                  </SettingRow>
                  <SettingRow label="Opacity">
                    <SliderRow
                      value={style.wordHighlight.opacity} min={0} max={1} step={0.01}
                      onChange={v => onChange(upd(style, { wordHighlight: { ...style.wordHighlight, opacity: v } }))}
                    />
                  </SettingRow>
                </div>
              )}
            </div>
          </div>

          {/* ══ Layout ══ */}
          <div className={section}>
            <div className={sectionInner}>
              <SectionTitle>Layout</SectionTitle>
              <div className="flex flex-col w-full">
                <SettingRow label="Width">
                  <NumberInputWithUnit
                    value={style.maxWidth} min={0} max={100} step={5}
                    onChange={v => onChange(upd(style, { maxWidth: v }))}
                  />
                  <div className="flex grow-[1] flex-1">
                    <SliderRow
                      value={style.maxWidth} min={0} max={100} step={5}
                      onChange={v => onChange(upd(style, { maxWidth: v }))}
                    />
                  </div>
                </SettingRow>

                <SettingRow label="Auto break">
                  <RadioGroup
                    value={(style.autoBreak ?? true) ? 'enabled' : 'disabled'}
                    options={[
                      { id: 'disabled', label: 'Disabled' },
                      { id: 'enabled', label: 'Enabled' },
                    ]}
                    onChange={v => onChange(upd(style, { autoBreak: v === 'enabled' }))}
                  />
                </SettingRow>

                <SettingRow label="Max lines">
                  <input
                    type="number" min={1} max={10} step={1} value={style.maxLines}
                    onChange={e => onChange(upd(style, { maxLines: clamp(Number(e.target.value), 1, 10) }))}
                    className="flex w-full border border-[rgba(0,0,0,0.12)] shadow-none transition-colors hover:border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[#1c1c1e] focus:ring-[0.5px] focus:ring-[#1c1c1e] py-1 bg-white h-8 text-[13px] rounded-[10px] px-2"
                  />
                </SettingRow>

                <SettingRow label="Max words">
                  <input
                    type="number" min={1} max={100} step={1} value={style.maxWordsPerLine}
                    onChange={e => onChange(upd(style, { maxWordsPerLine: clamp(Number(e.target.value), 1, 100) }))}
                    className="flex w-full border border-[rgba(0,0,0,0.12)] shadow-none transition-colors hover:border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[#1c1c1e] focus:ring-[0.5px] focus:ring-[#1c1c1e] py-1 bg-white h-8 text-[13px] rounded-[10px] px-2"
                  />
                </SettingRow>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
