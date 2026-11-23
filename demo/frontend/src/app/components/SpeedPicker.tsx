import { useState, useRef, useEffect } from 'react';

const SPEED_PRESETS = [
  { value: '0.5',  label: 'Chậm' },
  { value: '0.75', label: 'Hơi chậm' },
  { value: '1.0',  label: 'Bình thường' },
  { value: '1.25', label: 'Hơi nhanh' },
  { value: '1.5',  label: 'Nhanh' },
  { value: '1.75', label: 'Rất nhanh' },
];

interface SpeedPickerProps {
  currentSpeed?: string;
  onSelect: (speed: string) => void;
  onClose: () => void;
  /** Position the popover above (toolbar) or below (block) */
  position?: 'top' | 'bottom';
}

export default function SpeedPicker({ currentSpeed, onSelect, onClose, position = 'bottom', containerRef }: SpeedPickerProps & { containerRef?: React.RefObject<HTMLElement | null> }) {
  const [customValue, setCustomValue] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Normalize current speed for comparison — null means no highlight
  const currentNum = currentSpeed
    ? Math.round(parseFloat(currentSpeed.replace('x', '')) * 1000) / 1000
    : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // If containerRef provided, check against it (includes trigger button)
      const container = containerRef?.current || ref.current;
      if (container && !container.contains(target)) {
        onClose();
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler); };
  }, [onClose, containerRef]);

  const [error, setError] = useState('');

  const handleApplyCustom = () => {
    const num = parseFloat(customValue);
    if (isNaN(num)) return;
    if (num < 0.5 || num > 1.9) {
      setError('Giá trị phải từ 0.5x-1.9x');
      return;
    }
    setError('');
    onSelect(`${Number.isInteger(num) ? num.toFixed(1) : num}x`);
  };

  const handlePresetClick = (value: string) => {
    onSelect(`${value}x`);
  };

  return (
    <div
      ref={ref}
      className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-gray-100 w-[220px] z-50 overflow-hidden`}
    >
      {/* Presets */}
      <div className="py-1">
        {SPEED_PRESETS.map((preset) => {
          const presetNum = Math.round(parseFloat(preset.value) * 1000) / 1000;
          const isActive = currentNum != null && presetNum === currentNum;
          return (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors cursor-pointer ${
                isActive
                  ? 'bg-gray-100 font-semibold text-[#1c1c1e]'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-gray-500">{preset.value}x</span>
              <span className={isActive ? 'font-semibold' : 'font-medium'}>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom input */}
      <div className="border-t border-gray-100 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.05"
            min="0.5"
            max="1.9"
            value={customValue}
            onChange={(e) => { setCustomValue(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCustom(); }}
            placeholder={currentNum != null ? currentNum.toString() : '1'}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#1e164e] w-0"
          />
          <button
            onClick={handleApplyCustom}
            disabled={!customValue || isNaN(parseFloat(customValue))}
            className="px-3 py-1.5 bg-[#1c1c1e] text-white rounded-lg text-[13px] font-medium hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Áp dụng
          </button>
        </div>
        {error && <p className="text-[12px] text-red-500 mt-1.5">{error}</p>}
      </div>
    </div>
  );
}
