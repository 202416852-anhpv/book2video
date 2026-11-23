import { useState } from 'react';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import InfoRounded from '@mui/icons-material/InfoRounded';
import UpgradeModal from './UpgradeModal';
export default function HomeHeader() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  return (
    <div className="sticky top-0 z-20 bg-white shrink-0 w-full h-20 flex items-center px-6 py-3 gap-10 border-b border-[rgba(30,22,78,0.16)]">

      {/* Left: Project title – grows to fill remaining space */}
      <div className="flex-1 min-w-0 flex items-center">
        <p className="font-['SF_Pro_Text:Bold',sans-serif] font-bold text-[20px] leading-7 tracking-[-0.4px] text-[#1c1c1e] whitespace-nowrap">
          Dự án
        </p>
      </div>

      {/* Right: Container (337x56) – Trophy + Character Details */}
      <div className="flex items-center gap-4 shrink-0">

        {/* Trophy button (40x40, r=12, white bg, border) */}
        <div className="relative w-10 h-10 bg-white rounded-xl border border-[rgba(30,22,78,0.16)] flex items-center justify-center shrink-0 overflow-hidden">
          {/* Confetti decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0.5 left-1 w-1 h-1 rounded-full bg-[#FFD60A] opacity-70" />
            <div className="absolute top-1 right-1.5 w-0.5 h-0.5 rounded-full bg-[#FF3B30] opacity-70" />
            <div className="absolute bottom-1 left-1.5 w-0.5 h-1 rounded bg-[#34C759] opacity-70" />
            <div className="absolute bottom-0.5 right-1 w-1 h-0.5 rounded bg-[#007AFF] opacity-70" />
          </div>
          <EmojiEventsRounded sx={{ fontSize: 24, color: '#1e164e', position: 'relative', zIndex: 10 }} />
        </div>

        {/* Character Details Container (281x56, gap=12) */}
        <div className="flex items-center gap-3">

          {/* Subscription card (40x40, r=12, white bg, border) */}
          <div className="relative w-10 h-10 bg-white rounded-xl border border-[rgba(30,22,78,0.16)] flex items-center justify-center shrink-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#667eea] to-[#764ba2] opacity-20" />
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
              <path d="M5.9375 2.15625C5.71875 1.75 5.28125 1.5 4.8125 1.5H4.75C4.03125 1.5 3.5 2.0625 3.5 2.75C3.5 3.46875 4.03125 4 4.75 4H7.03125L5.9375 2.15625ZM2 2.75C2 1.25 3.21875 0 4.75 0H4.8125C5.8125 0 6.71875 0.53125 7.21875 1.40625L8 2.6875L8.75 1.40625C9.25 0.53125 10.1562 0 11.1562 0H11.25C12.75 0 14 1.25 14 2.75C14 3.21875 13.875 3.625 13.6875 4H15C15.5312 4 16 4.46875 16 5V7C16 7.5625 15.5312 8 15 8H1C0.4375 8 0 7.5625 0 7V5C0 4.46875 0.4375 4 1 4H2.28125C2.09375 3.625 2 3.21875 2 2.75ZM12.5 2.75C12.5 2.0625 11.9375 1.5 11.25 1.5H11.1562C10.6875 1.5 10.2812 1.75 10.0312 2.15625L8.9375 4H11.25C11.9375 4 12.5 3.46875 12.5 2.75ZM1 9H7V16H2.5C1.65625 16 1 15.3438 1 14.5V9ZM9 16V9H15V14.5C15 15.3438 14.3125 16 13.5 16H9Z" fill="#1E164E" fillOpacity="0.8"/>
            </svg>
          </div>

          {/* Notification bell (40x40, r=12, white bg, border) */}
          <div className="relative w-10 h-10 bg-white rounded-xl border border-[rgba(30,22,78,0.16)] flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-50 transition-colors">
            <NotificationsRounded sx={{ fontSize: 24, color: '#1e164e' }} />
            {/* Red dot with white ring */}
            <div className="absolute top-[6px] right-[6px] w-[10px] h-[10px] rounded-full bg-[#FF3B30] border-[1.5px] border-white" />
          </div>

          {/* Sparkle / AI credit button (40x40, r=12, gradient bg) – custom icon from Figma */}
          <div
            onClick={() => setShowUpgrade(true)}
            title="Nâng cấp gói"
            className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #F38B71 0%, #F1414D 50%, #563EFA 100%)' }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.75 0.5L10.8929 5.10714L15.5 7.25C15.7857 7.39286 16 7.67857 16 8C16 8.35714 15.7857 8.64286 15.5 8.78571L10.8929 10.9286L8.75 15.5357C8.60714 15.8214 8.32143 16 8 16C7.64286 16 7.35714 15.8214 7.21429 15.5357L5.07143 10.9286L0.464286 8.78571C0.178571 8.64286 0 8.35714 0 8C0 7.67857 0.178571 7.39286 0.464286 7.25L5.07143 5.10714L7.21429 0.5C7.35714 0.214286 7.64286 0 8 0C8.32143 0 8.60714 0.214286 8.75 0.5Z" fill="white"/>
            </svg>
          </div>

          {/* Points display (125x56, r=8, pad=4px 8px, gap=2) */}
          <div className="flex flex-col gap-0.5 rounded-lg px-2 py-1 justify-center shrink-0 cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ width: 125, height: 56 }}>
            <div className="flex items-center gap-1 w-full">
              <span className="font-['SF_Pro_Text:Regular',sans-serif] text-[14px] leading-5 text-[rgba(28,28,30,0.64)] whitespace-nowrap flex-1">
                Tổng số điểm
              </span>
              <InfoRounded sx={{ fontSize: 16, color: 'rgba(30,22,78,0.64)' }} />
            </div>
            <span className="font-['SF_Pro_Text:Bold',sans-serif] font-bold text-[16px] leading-6 text-[#1c1c1e] whitespace-nowrap">
              295.838 điểm
            </span>
          </div>

        </div>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
