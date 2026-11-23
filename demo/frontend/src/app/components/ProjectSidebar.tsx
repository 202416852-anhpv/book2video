import UserMenu from './UserMenu';

const svgPaths = {
  p1160c000: "M10.9171 0.788409C12.7123 -0.262803 14.9241 -0.262803 16.7192 0.788409L24.7353 5.48239C26.5305 6.5336 27.6364 8.47632 27.6364 10.5787V19.9667C27.6364 22.0691 26.5305 24.0118 24.7353 25.0631L16.7192 29.757C14.9241 30.8083 12.7123 30.8083 10.9171 29.757L2.90106 25.0631C1.10588 24.0118 0 22.0691 0 19.9667V10.5787C0 8.47632 1.10588 6.5336 2.90107 5.48239L10.9171 0.788409Z",
  p1cddd8c0: "M1.45455 4.36364C0.651222 4.36364 0 5.01486 0 5.81818V14.5455C0 15.3488 0.651222 16 1.45455 16C2.25787 16 2.90909 15.3488 2.90909 14.5455V5.81818C2.90909 5.01486 2.25787 4.36364 1.45455 4.36364Z",
  p1d006470: "M7.27273 0C6.4694 0 5.81818 0.651222 5.81818 1.45455V18.9091C5.81818 19.7124 6.4694 20.3636 7.27273 20.3636C8.07605 20.3636 8.72727 19.7124 8.72727 18.9091V1.45455C8.72727 0.651222 8.07605 0 7.27273 0Z",
  p687aaf0: "M11.6364 5.81818C11.6364 5.01486 12.2876 4.36364 13.0909 4.36364C13.8942 4.36364 14.5455 5.01486 14.5455 5.81818V14.5455C14.5455 15.3488 13.8942 16 13.0909 16C12.2876 16 11.6364 15.3488 11.6364 14.5455V5.81818Z",
  p3455480: "M5.81818 1.45455C5.81818 0.651222 6.4694 0 7.27273 0C8.07605 0 8.72727 0.651222 8.72727 1.45455V18.9091C8.72727 19.7124 8.07605 20.3636 7.27273 20.3636C6.4694 20.3636 5.81818 19.7124 5.81818 18.9091V1.45455ZM0 5.81818C0 5.01486 0.651222 4.36364 1.45455 4.36364C2.25787 4.36364 2.90909 5.01486 2.90909 5.81818V14.5455C2.90909 15.3488 2.25787 16 1.45455 16C0.651222 16 0 15.3488 0 14.5455V5.81818ZM13.0909 4.36364C12.2876 4.36364 11.6364 5.01486 11.6364 5.81818V14.5455C11.6364 15.3488 12.2876 16 13.0909 16C13.8942 16 14.5455 15.3488 14.5455 14.5455V5.81818C14.5455 5.01486 13.8942 4.36364 13.0909 4.36364Z",
};

interface ProjectSidebarProps {
  activeTab?: 'text' | 'caption';
  onTabChange?: (tab: 'text' | 'caption') => void;
}

export default function ProjectSidebar({ activeTab = 'text', onTabChange }: ProjectSidebarProps) {
  const tabs = [
    { id: 'text' as const, label: 'Speech' },
    { id: 'caption' as const, label: 'Phụ đề' },
  ];

  return (
    <div className="w-[80px] h-screen flex flex-col bg-white/90 backdrop-blur-xl border-r border-[rgba(30,22,78,0.06)]">
      {/* Logo */}
      <div className="h-[64px] relative w-full border-b border-[rgba(60,60,67,0.16)] flex-shrink-0">
        <div className="flex items-center justify-center size-full p-[16px]">
          <div className="relative size-[32px]">
            <div className="absolute inset-[2.27%_6.82%]">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27.6364 30.5455">
                <path d={svgPaths.p1160c000} fill="#1E164E" />
              </svg>
            </div>
            <div className="absolute inset-[18.18%_27.27%]">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.5455 20.3636">
                <g>
                  <path d={svgPaths.p1cddd8c0} fill="#FFD60A" />
                  <path d={svgPaths.p1d006470} fill="#FFD60A" />
                  <path d={svgPaths.p687aaf0} fill="#FFD60A" />
                  <path clipRule="evenodd" d={svgPaths.p3455480} fill="#FFD60A" fillRule="evenodd" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`flex flex-col gap-[6px] items-center justify-center py-[14px] w-full border-b border-[rgba(60,60,67,0.16)] transition-colors ${
                isActive
                  ? 'bg-[#f0f0f2] text-[#1E164E]'
                  : 'text-[rgba(30,22,78,0.64)] hover:bg-gray-50 hover:text-[rgba(30,22,78,0.8)]'
              }`}
            >
              {tab.id === 'text' ? (
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1.333c.368 0 .667.298.667.667v12a.667.667 0 0 1-1.334 0V2c0-.369.299-.667.667-.667M5.333 5.333c.369 0 .667.298.667.667v4a.667.667 0 1 1-1.333 0V6c0-.369.298-.667.666-.667M3.333 4A.667.667 0 1 0 2 4v8a.667.667 0 0 0 1.333 0zM13.333 3.333c.368 0 .667.298.667.667v8a.667.667 0 0 1-1.333 0V4c0-.369.298-.667.666-.667M11.333 6A.667.667 0 1 0 10 6v4a.667.667 0 0 0 1.333 0z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path fill="currentColor" d="M10.334 6.667a.667.667 0 0 0-.667.666v1.334c0 .368.298.666.667.666.424 0 .673-.07.794-.118a.6.6 0 0 0 .1-.05c.261-.23.66-.22.91.03a.673.673 0 0 1 0 .944 1 1 0 0 1-.17.135c-.084.056-.198.12-.345.179-.296.118-.714.214-1.29.214a2 2 0 0 1-2-2V7.333a2 2 0 0 1 2-2c.576 0 .994.097 1.29.215.147.059.26.122.346.179q.09.06.166.132c.257.255.26.69.003.946a.667.667 0 0 1-.91.03.6.6 0 0 0-.1-.05c-.121-.048-.37-.118-.794-.118M5 7.334c0-.369.298-.667.667-.667.424 0 .673.07.794.119a.6.6 0 0 1 .1.049c.261.23.66.22.91-.03a.673.673 0 0 0 0-.944 1 1 0 0 0-.17-.134 2 2 0 0 0-.345-.18c-.296-.117-.714-.213-1.29-.213a2 2 0 0 0-2 2v1.333a2 2 0 0 0 2 2c.576 0 .994-.096 1.29-.215.147-.058.26-.122.346-.178q.09-.06.168-.134a.68.68 0 0 0 .001-.945.667.667 0 0 0-.91-.03.6.6 0 0 1-.1.05c-.122.048-.37.119-.794.118A.667.667 0 0 1 5 8.667z"/>
                  <path fill="currentColor" fillRule="evenodd" d="M13.333 2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2.667a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 1.333c.368 0 .667.299.667.667v8a.667.667 0 0 1-.667.667H2.667A.667.667 0 0 1 2 12V4c0-.368.298-.667.667-.667z" clipRule="evenodd"/>
                </svg>
              )}
              <span className={`text-[12px] text-center leading-[14px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* User */}
      <div className="mt-auto flex justify-center py-3 border-t border-[rgba(60,60,67,0.16)]">
        <UserMenu compact />
      </div>
    </div>
  );
}
