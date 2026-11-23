import { AudioWaveform, Film, FolderOpen, Mic, Package, ShoppingCart, Sparkles, Code } from 'lucide-react';
import UserMenu from './UserMenu';

export default function HomeSidebar() {
  const menuItems = [
    { icon: AudioWaveform, label: 'Chuyển văn bản', active: false },
    { icon: Film, label: 'Chuyển phụ đề', active: false },
    { icon: FolderOpen, label: 'Dự án', active: true, badge: 'Mới' },
    { icon: Mic, label: 'Nhân bản giọng', active: false },
    { icon: Package, label: 'Thư viện giọng', active: false },
    { icon: ShoppingCart, label: 'Mua gói cước', active: false },
    { icon: Sparkles, label: 'Giới thiệu bạn bè', color: '#ff385c', active: false },
    { icon: Code, label: 'Tích hợp API', active: false },
  ];

  return (
    <div className="w-[240px] bg-white h-screen flex flex-col border-r border-gray-200">
      {/* Logo */}
      <div className="px-4 py-6 border-b border-gray-100">
        <img 
          src="https://studio.vbee.vn/static/media/logo-AiVoice-new.b6ba42c5.svg" 
          alt="AIVoice" 
          className="h-8 w-auto" 
        />
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-2 py-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isSpecial = item.color;
          
          return (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors mb-1 ${
                item.active
                  ? 'bg-gray-100 text-[#1c1c1e]'
                  : 'hover:bg-gray-50 text-[#1c1c1e]'
              }`}
            >
              <Icon 
                className="w-5 h-5 flex-shrink-0" 
                style={isSpecial ? { color: item.color } : {}}
              />
              <span 
                className={`font-['SF_Pro_Text:Regular',sans-serif] text-[14px] flex-1 text-left ${
                  isSpecial ? 'text-[#ff385c]' : ''
                }`}
              >
                {item.label}
              </span>
              {item.badge && (
                <span className="px-2 py-0.5 bg-[#ff385c] text-white rounded-full font-['SF_Pro_Text:Medium',sans-serif] text-[10px]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-2 py-2 border-t border-gray-200">
        <UserMenu />
      </div>
    </div>
  );
}