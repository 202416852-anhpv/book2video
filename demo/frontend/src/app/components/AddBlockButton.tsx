import { Plus } from 'lucide-react';

interface AddBlockButtonProps {
  onClick: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
const shortcutLabel = isMac ? '⌘ + Enter' : 'Ctrl + Enter';

export default function AddBlockButton({ onClick }: AddBlockButtonProps) {
  return (
    <div className="px-4 py-6">
      <button
        onClick={onClick}
        title={`${shortcutLabel} để tạo block mới`}
        className="w-full py-4 border-2 border-dashed border-[rgba(30,22,78,0.16)] rounded-[12px] bg-white hover:bg-gray-50 hover:border-[rgba(30,22,78,0.32)] transition-all flex items-center justify-center gap-2 group cursor-pointer relative"
      >
        <div className="p-2 bg-gray-100 rounded-full group-hover:bg-[#ffd60a] transition-colors">
          <Plus className="w-5 h-5 text-gray-600 group-hover:text-[#1e164e]" />
        </div>
        <span className="font-['SF_Pro_Text:Medium',sans-serif] text-[14px] text-gray-600 group-hover:text-[#1c1c1e]">
          Thêm block mới
        </span>
        <span className="font-['SF_Pro_Text:Regular',sans-serif] text-[12px] text-[rgba(28,28,30,0.32)] group-hover:text-[rgba(28,28,30,0.48)] ml-1 transition-colors">
          {shortcutLabel}
        </span>
      </button>
    </div>
  );
}
