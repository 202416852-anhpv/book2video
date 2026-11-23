import svgPaths from "./svg-project-cards";

function SidebarAivoice() {
  return <div className="bg-[rgba(0,122,255,0.16)] h-full max-w-[240px] min-w-[64px] shrink-0 w-[240px]" data-name="sidebar-aivoice" />;
}

function Title() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative" data-name="Title">
      <p className="font-['SF_Pro_Text:Bold',sans-serif] leading-[28px] not-italic relative shrink-0 text-[#1c1c1e] text-[20px] tracking-[-0.4px] whitespace-nowrap">Dự án</p>
    </div>
  );
}

function ProjectInfo() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-start min-h-px min-w-px relative" data-name="Project Info">
      <Title />
    </div>
  );
}

function Layout2() {
  return (
    <div className="h-[36px] relative shrink-0 w-[80px]" data-name="layout">
      <div className="absolute bg-[rgba(88,86,214,0.16)] h-[8px] left-0 rounded-[960px] top-0 w-[80px]" />
      <div className="absolute bg-[rgba(88,86,214,0.16)] h-[8px] left-[0.05px] rounded-[960px] top-[14.26px] w-[46px]" />
      <div className="absolute bg-[rgba(88,86,214,0.16)] h-[8px] left-[0.05px] rounded-[960px] top-[28.26px] w-[64px]" />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute content-stretch flex gap-[4px] items-start left-[13.95px] top-[10.37px]">
      <div className="relative shrink-0 size-[12px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <circle cx="6" cy="6" fill="var(--fill-0, #5856D6)" fillOpacity="0.48" id="Ellipse 238" r="6" />
        </svg>
      </div>
      <Layout2 />
    </div>
  );
}

function Layout3() {
  return (
    <div className="h-[36px] relative shrink-0 w-[80px]" data-name="layout">
      <div className="absolute bg-[rgba(88,86,214,0.16)] h-[8px] left-[0.05px] rounded-[960px] top-[-0.37px] w-[39px]" />
      <div className="absolute bg-[rgba(88,86,214,0.08)] h-[8px] left-[0.05px] rounded-[960px] top-[13.63px] w-[72px]" />
      <div className="absolute bg-[rgba(88,86,214,0.08)] h-[8px] left-[0.05px] rounded-[960px] top-[27.63px] w-[53px]" />
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute content-stretch flex gap-[4px] items-start left-[13.95px] opacity-50 top-[54px]">
      <div className="relative shrink-0 size-[12px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <circle cx="6" cy="6" fill="var(--fill-0, #5856D6)" fillOpacity="0.48" id="Ellipse 238" opacity="0.5" r="6" />
        </svg>
      </div>
      <Layout3 />
    </div>
  );
}

function Layout4() {
  return (
    <div className="h-[27.428px] relative w-[66.493px]" data-name="layout">
      <div className="absolute inset-[-4.86%_-2.01%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 69.16 30.0951">
          <g id="layout">
            <path d={svgPaths.p389d4600} fill="var(--fill-0, #5856D6)" />
            <path d={svgPaths.p389d4600} stroke="var(--stroke-0, white)" strokeWidth="2.66667" />
            <path d="M14.632 8.39824V21.6969" id="Vector 3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="1.66233" />
            <path d="M19.6189 7.98271V22.1125" id="Vector 4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="1.66233" />
            <path d="M24.6059 10.0605V20.0345" id="Vector 5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="1.66233" />
            <path d={svgPaths.p3b263900} id="Vector 12" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="1.66233" />
            <path d="M34.58 12.5541V17.5411" id="Vector 7" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="1.66233" />
            <path d="M39.5668 12.1384V17.9566" id="Vector 8" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="1.66233" />
            <path d="M44.554 9.22941V20.8657" id="Vector 10" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="1.66233" />
            <path d="M49.541 12.5541V17.5411" id="Vector 11" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="1.66233" />
            <path d="M54.528 10.0606V20.0346" id="Vector 9" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="1.66233" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute contents left-[-14.64px] top-[59.73px]">
      <div className="absolute flex h-[32px] items-center justify-center left-[-14.64px] top-[59.73px] w-[68.245px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="flex-none rotate-4">
          <Layout4 />
        </div>
      </div>
    </div>
  );
}

function Illus1() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[96px] left-1/2 top-[calc(50%+0.37px)] w-[120px]" data-name="illus">
      <div className="absolute bg-gradient-to-b border-[#3c3c43] border-l-[1.395px] border-r-[1.395px] border-solid border-t-[1.395px] from-white h-[96px] left-0 rounded-tl-[16px] rounded-tr-[16px] to-[rgba(255,255,255,0)] top-0 w-[120px]" data-name="Document Background" />
      <Frame />
      <Frame1 />
      <Group7 />
    </div>
  );
}

function Illus() {
  return (
    <div className="bg-[rgba(88,86,214,0.04)] h-[120px] overflow-clip relative rounded-[12px] shrink-0 w-[200px]" data-name="illus">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[86px] left-1/2 top-1/2 w-[100px]" />
      <Illus1 />
    </div>
  );
}

function FileFormatContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start justify-end not-italic relative shrink-0 tracking-[-0.4px] whitespace-nowrap" data-name="File Format Container">
      <p className="font-['SF_Pro_Text:Medium',sans-serif] leading-[20px] relative shrink-0 text-[14px] text-black">Tạo audio</p>
      <p className="font-['SF_Pro_Text:Regular',sans-serif] leading-[16px] relative shrink-0 text-[12px] text-[rgba(28,28,30,0.64)]">Hỗ trợ .docx, .txt, .pdf, .srt hoặc Web link</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex items-start justify-center px-[8px] relative shrink-0">
      <FileFormatContainer />
    </div>
  );
}

function DnhDng() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Định dạng">
      <Illus />
      <Frame2 />
    </div>
  );
}

function Layout5() {
  return (
    <div className="absolute h-[36px] left-[28px] top-[12px] w-[80px]" data-name="layout">
      <div className="absolute bg-[rgba(60,60,67,0.08)] h-[8px] left-0 rounded-[960px] top-0 w-[80px]" />
      <div className="absolute bg-[rgba(60,60,67,0.08)] h-[8px] left-0 opacity-80 rounded-[960px] top-[14px] w-[70px]" />
      <div className="absolute bg-[rgba(60,60,67,0.08)] h-[8px] left-0 opacity-60 rounded-[960px] top-[28px] w-[76px]" />
    </div>
  );
}

function Layout6() {
  return (
    <div className="absolute h-[36px] left-[28px] top-[56px] w-[80px]" data-name="layout">
      <div className="absolute bg-[rgba(60,60,67,0.04)] h-[8px] left-0 rounded-[960px] top-0 w-[40px]" />
      <div className="absolute bg-[rgba(60,60,67,0.04)] h-[8px] left-0 rounded-[960px] top-[14px] w-[84px]" />
    </div>
  );
}

function Group17() {
  return (
    <div className="absolute contents left-[12px] top-[56px]">
      <Layout6 />
      <div className="absolute left-[12px] size-[12px] top-[56px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <circle cx="6" cy="6" fill="var(--fill-0, #3C3C43)" fillOpacity="0.16" id="Ellipse 239" r="6" />
        </svg>
      </div>
    </div>
  );
}

function Layout7() {
  return (
    <div className="h-[26.25px] relative rounded-[7.273px] w-[49.203px]" data-name="layout" style={{ backgroundImage: "linear-gradient(155.209deg, rgb(14, 15, 17) 8.9382%, rgb(104, 111, 124) 87.917%)" }}>
      <div aria-hidden="true" className="absolute border-[2.188px] border-solid border-white inset-[-1.094px] pointer-events-none rounded-[8.366999999999999px]" />
      <p className="absolute font-['SF_Pro_Text:Medium',sans-serif] leading-[normal] left-[calc(50%-15.5px)] not-italic text-[14.583px] text-white top-[calc(50%-8.92px)] tracking-[-0.5833px] whitespace-nowrap">.mov</p>
    </div>
  );
}

function Group8() {
  return (
    <div className="absolute contents h-[29.618px] left-[-7.5px] top-[62.83px] w-[50.914px]">
      <div className="absolute flex h-[29.618px] items-center justify-center left-[-7.5px] top-[62.83px] w-[50.914px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-rotate-4 flex-none">
          <Layout7 />
        </div>
      </div>
    </div>
  );
}

function Layout8() {
  return (
    <div className="h-[26.25px] relative rounded-[7.273px] w-[51.042px]" data-name="layout" style={{ backgroundImage: "linear-gradient(156deg, rgb(14, 15, 17) 8.9382%, rgb(104, 111, 124) 87.917%)" }}>
      <div aria-hidden="true" className="absolute border-[2.188px] border-solid border-white inset-[-1.094px] pointer-events-none rounded-[8.366999999999999px]" />
      <p className="-translate-x-1/2 absolute font-['SF_Pro_Text:Medium',sans-serif] leading-[normal] left-[calc(50%-0.83px)] not-italic text-[14.583px] text-center text-white top-[calc(50%-9.01px)] tracking-[-0.5833px] whitespace-nowrap">.pdf</p>
    </div>
  );
}

function Group9() {
  return (
    <div className="absolute contents h-[33.05px] left-[76.87px] top-[40.1px] w-[54.179px]">
      <div className="absolute flex h-[33.05px] items-center justify-center left-[76.87px] top-[40.1px] w-[54.179px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="flex-none rotate-[7.94deg]">
          <Layout8 />
        </div>
      </div>
    </div>
  );
}

function Illus3() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[96px] left-1/2 top-[calc(50%+0.4px)] w-[120px]" data-name="illus">
      <div className="absolute bg-gradient-to-b border-[#f4f5f7] border-l-[1.875px] border-r-[1.875px] border-solid border-t-[1.875px] from-white h-[96px] left-0 rounded-tl-[11.25px] rounded-tr-[11.25px] to-[rgba(255,255,255,0)] top-0 w-[120px]" />
      <Layout5 />
      <div className="absolute left-[12px] size-[12px] top-[12px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <circle cx="6" cy="6" fill="var(--fill-0, #1C1C1E)" fillOpacity="0.32" id="Ellipse 238" r="6" />
        </svg>
      </div>
      <Group17 />
      <Group8 />
      <Group9 />
    </div>
  );
}

function Illus2() {
  return (
    <div className="bg-[rgba(244,245,247,0.64)] h-[120px] overflow-clip relative rounded-[12px] shrink-0 w-[200px]" data-name="illus">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[86px] left-1/2 top-1/2 w-[100px]" data-name="Document Background" />
      <Illus3 />
    </div>
  );
}

function FileFormatContainer1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start justify-center not-italic px-[8px] relative shrink-0 tracking-[-0.4px] whitespace-nowrap" data-name="File Format Container">
      <p className="font-['SF_Pro_Text:Medium',sans-serif] leading-[20px] relative shrink-0 text-[14px] text-black">Tạo video bài giảng</p>
      <p className="font-['SF_Pro_Text:Regular',sans-serif] leading-[16px] relative shrink-0 text-[12px] text-[rgba(28,28,30,0.64)]">Hỗ trợ .pdf, .docx, .txt, .md</p>
    </div>
  );
}

function TiTpLen() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Tải tệp lên">
      <Illus2 />
      <FileFormatContainer1 />
    </div>
  );
}

function DocumentDetails() {
  return (
    <div className="absolute contents left-[25px] top-[54.6px]" data-name="Document Details">
      <div className="absolute bg-[rgba(60,60,67,0.08)] h-[22px] left-[25px] opacity-50 rounded-[5.581px] top-[54.6px] w-[48px]" data-name="Document Line" />
      <div className="absolute bg-[rgba(60,60,67,0.08)] h-[3px] left-[25.67px] opacity-50 rounded-[960px] top-[86.62px] w-[76px]" data-name="Document Line" />
      <div className="absolute bg-[rgba(60,60,67,0.08)] h-[3px] left-[25.67px] opacity-50 rounded-[960px] top-[80.62px] w-[56px]" data-name="Document Line" />
    </div>
  );
}

function DocumentDetails1() {
  return (
    <div className="absolute contents left-[25px] top-[14.6px]" data-name="Document Details">
      <div className="absolute bg-[rgba(60,60,67,0.08)] h-[22px] left-[25px] rounded-[5.581px] top-[14.6px] w-[48px]" data-name="Document Line" />
      <div className="absolute bg-[rgba(60,60,67,0.08)] h-[3px] left-[25.67px] rounded-[960px] top-[40.65px] w-[80px]" data-name="Document Line" />
      <div className="absolute bg-[rgba(60,60,67,0.08)] h-[3px] left-[25.67px] rounded-[960px] top-[45.65px] w-[62px]" data-name="Document Line" />
    </div>
  );
}

function DocumentIcon() {
  return (
    <div className="absolute contents left-[9.77px] top-[14.6px]" data-name="Document Icon">
      <DocumentDetails />
      <DocumentDetails1 />
      <div className="absolute left-[9.77px] size-[12px] top-[15.35px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <circle cx="6" cy="6" fill="var(--fill-0, #E62E05)" id="Ellipse 238" opacity="0.6" r="6" />
        </svg>
      </div>
      <div className="absolute left-[9.77px] size-[12px] top-[54.42px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <circle cx="6" cy="6" fill="var(--fill-0, #E62E05)" id="Ellipse 239" opacity="0.3" r="6" />
        </svg>
      </div>
    </div>
  );
}

function Page() {
  return (
    <div className="absolute inset-[0_2.5%_0_17.5%]" data-name="Page">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 40">
        <g id="Page">
          <path d={svgPaths.p256b6b80} fill="var(--fill-0, white)" id="Page background" stroke="var(--stroke-0, #D5D7DA)" strokeWidth="1.5" />
          <path d={svgPaths.p323d9500} id="Earmark" stroke="var(--stroke-0, #D5D7DA)" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function FileTypeWrap() {
  return (
    <div className="absolute bg-[#e62e05] content-stretch flex inset-[45%_15%_15%_2.5%] items-start px-[3px] py-[2px] rounded-[2px]" data-name="File type wrap">
      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[10px] text-center text-white whitespace-nowrap">PPTX</p>
    </div>
  );
}

function Illus5() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[96px] left-1/2 top-[calc(50%+0.4px)] w-[120px]" data-name="illus">
      <div className="absolute bg-gradient-to-b border-[#f4f5f7] border-l-[1.875px] border-r-[1.875px] border-solid border-t-[1.875px] from-white h-[96px] left-0 rounded-tl-[11.25px] rounded-tr-[11.25px] to-[rgba(255,255,255,0)] top-0 w-[120px]" data-name="Document Background" />
      <DocumentIcon />
      <div className="absolute flex items-center justify-center left-[85px] size-[47.442px] top-[54.6px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "38" } as React.CSSProperties}>
        <div className="flex-none rotate-12">
          <div className="relative size-[40px]" data-name="File type icon">
            <Page />
            <FileTypeWrap />
          </div>
        </div>
      </div>
    </div>
  );
}

function Illus4() {
  return (
    <div className="bg-[#fff9f5] h-[120px] overflow-clip relative rounded-[12px] shrink-0 w-[200px]" data-name="illus">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[86px] left-1/2 top-1/2 w-[100px]" data-name="Document Background" />
      <Illus5 />
    </div>
  );
}

function Badge() {
  return (
    <div className="bg-[#ff2d55] content-stretch flex items-center px-[8px] py-[2px] relative rounded-[16px] shrink-0" data-name="Badge">
      <p className="font-['SF_Pro_Text:Medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-center text-white tracking-[-0.4px] whitespace-nowrap">Mới</p>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
      <p className="font-['SF_Pro_Text:Medium',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-black tracking-[-0.4px] whitespace-nowrap">Lồng tiếng slide</p>
      <Badge />
    </div>
  );
}

function FileFormatContainer3() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start justify-end relative shrink-0" data-name="File Format Container">
      <Frame3 />
      <p className="font-['SF_Pro_Text:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(28,28,30,0.64)] tracking-[-0.4px] whitespace-nowrap">Hỗ trợ .ppt, .pptx</p>
    </div>
  );
}

function FileFormatContainer2() {
  return (
    <div className="content-stretch flex items-start justify-center px-[8px] relative shrink-0" data-name="File Format Container">
      <FileFormatContainer3 />
    </div>
  );
}

function DnhDng1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Định dạng">
      <Illus4 />
      <FileFormatContainer2 />
    </div>
  );
}

// Export individual cards for use in other components
export { DnhDng as TaoAudioCard };
export { TiTpLen as LongTiengVideoCard };
export { DnhDng1 as LongTiengSlideCard };
export { TriNghimSnPhmStudio };
export { Empty };

function DnhDngTp() {
  return (
    <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-[992px]" data-name="định dạng tệp">
      <DnhDng />
      <TiTpLen />
      <DnhDng1 />
    </div>
  );
}

function ProjectListTitleContainer() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[437.5px]" data-name="Project List Title Container">
      <p className="font-['SF_Pro_Text:Bold',sans-serif] leading-[28px] not-italic relative shrink-0 text-[#1c1c1e] text-[20px] tracking-[-0.4px] whitespace-nowrap">Danh sách dự án</p>
    </div>
  );
}

function ProjectListHeader() {
  return (
    <div className="content-stretch flex h-[40px] items-center relative shrink-0 w-full z-[6]" data-name="Project List Header">
      <ProjectListTitleContainer />
    </div>
  );
}

function Layout11() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[3px] items-start left-[6px] top-[6px] w-[40px]" data-name="layout">
      <div className="bg-[rgba(88,86,214,0.08)] h-[4px] rounded-[480px] shrink-0 w-full" data-name="Icon" />
      <div className="bg-[rgba(88,86,214,0.08)] h-[4px] rounded-[480px] shrink-0 w-[29px]" data-name="Icon" />
      <div className="bg-[rgba(88,86,214,0.08)] h-[4px] rounded-[480px] shrink-0 w-full" data-name="Icon" />
    </div>
  );
}

function Layout12() {
  return (
    <div className="h-[14.571px] relative w-[35.325px]" data-name="layout">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 35.3246 14.5714">
        <g id="layout">
          <path d={svgPaths.pfdf8d00} fill="var(--fill-0, #5856D6)" />
          <path d={svgPaths.pfdf8d00} stroke="var(--stroke-0, white)" />
          <path d="M7.06508 3.75339V10.8183" id="Vector 3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="0.883114" />
          <path d="M9.71425 3.53246V11.0389" id="Vector 4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="0.883114" />
          <path d="M12.3637 4.63643V9.93512" id="Vector 5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="0.883114" />
          <path d={svgPaths.p222a80} id="Vector 12" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="0.883114" />
          <path d="M17.6625 5.96123V8.61057" id="Vector 7" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="0.883114" />
          <path d="M20.3116 5.74024V8.83114" id="Vector 8" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="0.883114" />
          <path d="M22.961 4.19479V10.3766" id="Vector 10" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="0.883114" />
          <path d="M25.6104 5.96091V8.61025" id="Vector 11" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="0.883114" />
          <path d="M28.2596 4.63622V9.93491" id="Vector 9" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="0.883114" />
        </g>
      </svg>
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute contents left-[-4px] top-[26px]" data-name="Icon">
      <div className="absolute flex h-[17px] items-center justify-center left-[-4px] top-[26px] w-[36.255px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="flex-none rotate-4">
          <Layout12 />
        </div>
      </div>
    </div>
  );
}

function Layout13() {
  return (
    <div className="h-[16px] relative w-[40px]" data-name="layout">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 16">
        <g id="layout">
          <path d={svgPaths.p270bca00} fill="var(--fill-0, #00C7BE)" />
          <path d={svgPaths.p270bca00} stroke="var(--stroke-0, white)" />
          <path d="M8 4V12" id="Vector 3" stroke="var(--stroke-0, white)" strokeLinecap="round" />
          <path d="M11 3.75V12.25" id="Vector 4" stroke="var(--stroke-0, white)" strokeLinecap="round" />
          <path d="M14 5V11" id="Vector 5" stroke="var(--stroke-0, white)" strokeLinecap="round" />
          <path d="M17 6L17 10" id="Vector 12" stroke="var(--stroke-0, white)" strokeLinecap="round" />
          <path d="M20 6.5V9.5" id="Vector 7" stroke="var(--stroke-0, white)" strokeLinecap="round" />
          <path d="M23 6.25V9.75" id="Vector 8" stroke="var(--stroke-0, white)" strokeLinecap="round" />
          <path d="M26 4.5V11.5" id="Vector 10" stroke="var(--stroke-0, white)" strokeLinecap="round" />
          <path d="M29 6.5V9.5" id="Vector 11" stroke="var(--stroke-0, white)" strokeLinecap="round" />
          <path d="M32 5V11" id="Vector 9" stroke="var(--stroke-0, white)" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

function Illus7() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[34px] left-1/2 top-1/2 w-[60px]" data-name="illus">
      <div className="absolute bg-white border-[rgba(30,22,78,0.16)] border-l border-r border-solid border-t h-[34px] left-0 rounded-tl-[8px] rounded-tr-[8px] top-0 w-[60px]" data-name="Icon" />
      <Layout11 />
      <div className="absolute bg-[rgba(88,86,214,0.32)] h-[5px] left-[42px] rounded-[480px] top-[27px] w-[14px]" data-name="Icon" />
      <Icon />
      <div className="absolute flex h-[19.425px] items-center justify-center left-[-17px] top-[4px] w-[41.242px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-rotate-5 flex-none">
          <Layout13 />
        </div>
      </div>
    </div>
  );
}

function Illus6() {
  return (
    <div className="bg-[rgba(88,86,214,0.08)] h-[86px] overflow-clip relative rounded-[8px] shrink-0 w-[100px]" data-name="illus">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[86px] left-1/2 top-1/2 w-[100px]" data-name="Icon" />
      <Illus7 />
    </div>
  );
}

function Info() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px min-w-px not-italic relative tracking-[-0.4px]" data-name="info">
      <p className="font-['SF_Pro_Text:Medium',sans-serif] leading-[24px] relative shrink-0 text-[16px] text-black w-full">Trải nghiệm tính năng Dự án</p>
      <p className="font-['SF_Pro_Text:Regular',sans-serif] leading-[20px] relative shrink-0 text-[14px] text-[rgba(28,28,30,0.64)] w-full">Tạo dự án mẫu để khám phá tính năng chia khối, giúp bạn tùy chỉnh từng đoạn đoạn văn bản, mang lại trải nghiệm linh hoạt và trực quan.</p>
    </div>
  );
}

function Layout10() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-center min-h-px min-w-px relative" data-name="layout">
      <Illus6 />
      <Info />
    </div>
  );
}

function Cta() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="CTA">
      <div className="bg-white content-stretch flex gap-[8px] h-[40px] items-center justify-center px-[16px] py-[8px] relative rounded-[8px] shrink-0" data-name="button-40">
        <div aria-hidden="true" className="absolute border border-[#f48b71] border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="bg-clip-text flex flex-col font-['SF_Pro_Text:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[transparent] text-center tracking-[-0.4px] whitespace-nowrap" style={{ backgroundImage: "linear-gradient(109.149deg, rgb(244, 139, 113) 15.229%, rgb(241, 65, 77) 42.619%, rgb(86, 62, 250) 99.908%)" }}>
          <p className="leading-[20px]">Tạo dự án mẫu</p>
        </div>
      </div>
    </div>
  );
}

function TriNghimSnPhmStudio() {
  return (
    <div className="relative rounded-[16px] shrink-0 w-full" data-name="Trải nghiệm sản phẩm Studio">
      <div aria-hidden="true" className="absolute border border-[rgba(30,22,78,0.16)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[40px] items-center p-[12px] relative w-full">
          <Layout10 />
          <Cta />
        </div>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="opacity-64 relative size-full" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.48486 9.48491">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p3376ee00} fill="var(--fill-0, #3A176C)" fillRule="evenodd" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p155bc000} fill="var(--fill-0, #1E164E)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Group1() {
  return (
    <div className="opacity-64 relative size-full" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.2576 21.2576">
        <g id="Group">
          <path d={svgPaths.p25fef700} fill="url(#paint0_linear_61_2475)" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p309cdd00} fill="var(--fill-0, #1E164E)" fillRule="evenodd" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_61_2475" x1="9.5752" x2="10.6285" y1="16.523" y2="-6.37454">
            <stop stopColor="#4D1F90" />
            <stop offset="1" stopColor="#250554" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Group2() {
  return (
    <div className="opacity-64 relative size-full" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.1739 16.0469">
        <g id="Group">
          <path d={svgPaths.p1334f700} fill="var(--fill-0, #F6F6F8)" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p7a76590} fill="var(--fill-0, #1E164E)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute inset-[49.72%_33.04%_27.06%_37.85%] opacity-64" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 29.1061 23.2196">
        <g id="Group">
          <path d={svgPaths.p271cf380} fill="var(--fill-0, #ADCEFE)" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p17ddb200} fill="var(--fill-0, #1E164E)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute inset-[49.72%_35.01%_27.06%_35.89%] opacity-64" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 29.1061 23.2196">
        <g id="Group">
          <path d={svgPaths.p271cf380} fill="var(--fill-0, #79B0FD)" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p17ddb200} fill="var(--fill-0, #1E164E)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute inset-[49.72%_70.32%_40.79%_20.19%] opacity-64" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.48491 9.48484">
        <g id="Group">
          <path d={svgPaths.p1b2abe00} fill="var(--fill-0, #79B0FD)" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p3cdfc000} fill="var(--fill-0, #1E164E)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute inset-[51.6%_72.2%_42.67%_22.07%] opacity-64" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.72854 5.72852">
        <g id="Group">
          <path d={svgPaths.p1e2da500} fill="var(--fill-0, #B3D2FE)" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p39e8b340} fill="var(--fill-0, #1E164E)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Group10() {
  return (
    <div className="absolute inset-[63.46%_70.32%_27.06%_20.19%] opacity-64" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.48491 9.48484">
        <g id="Group">
          <path d={svgPaths.p3a950dc0} fill="var(--fill-0, #79B0FD)" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p3cdfc000} fill="var(--fill-0, #1E164E)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Group11() {
  return (
    <div className="absolute inset-[65.5%_72.2%_28.77%_22.07%] opacity-64" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.72854 5.72852">
        <g id="Group">
          <path d={svgPaths.p3c606180} fill="var(--fill-0, #B3D2FE)" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p29976300} fill="var(--fill-0, #1E164E)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Group12() {
  return (
    <div className="absolute inset-[54.48%_35.83%_31.43%_36.7%] opacity-64" data-name="Group">
      <div className="absolute inset-[-1.46%_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27.4697 14.4999">
          <g id="Group">
            <path d={svgPaths.p169b0e60} id="Vector" stroke="var(--stroke-0, #1E164E)" strokeLinejoin="round" strokeMiterlimit="1.5" strokeWidth="0.412044" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group13() {
  return (
    <div className="absolute inset-[41.88%_15.66%_22.89%_15.53%] opacity-64" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 68.8113 35.2258">
        <g id="Group">
          <path d={svgPaths.p33e7fc0} fill="var(--fill-0, #F6F6F8)" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p2f4de100} fill="var(--fill-0, #1E164E)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Group14() {
  return (
    <div className="absolute inset-[55.79%_16.48%_34.99%_23.44%] opacity-64" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 60.0801 9.22206">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p71fad80} fill="var(--fill-0, #4B4571)" fillOpacity="0.5" fillRule="evenodd" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group15() {
  return (
    <div className="absolute inset-[41.88%_60.29%_22.89%_15.54%] opacity-64" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.172 35.2259">
        <g id="Group">
          <path d={svgPaths.p9c98d80} fill="var(--fill-0, #F1F1F1)" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p196fb280} fill="var(--fill-0, #1E164E)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Group16() {
  return (
    <div className="opacity-64 relative size-full" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.1739 16.0469">
        <g id="Group">
          <path d={svgPaths.peafea00} fill="var(--fill-0, #F6F6F8)" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p2028ae80} fill="var(--fill-0, #1E164E)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Unboxing() {
  return (
    <div className="absolute contents inset-[41.88%_7.65%_22.89%_7.65%]" data-name="Unboxing">
      <div className="absolute flex inset-[50.93%_22.49%_38.91%_67.36%] items-center justify-center">
        <div className="flex-none rotate-[-94.21deg] size-[9.485px]">
          <Group />
        </div>
      </div>
      <div className="absolute flex inset-[45.35%_25.97%_31.89%_51.27%] items-center justify-center">
        <div className="flex-none rotate-[-94.21deg] size-[21.258px]">
          <Group1 />
        </div>
      </div>
      <div className="absolute flex inset-[41.88%_7.65%_44.23%_59.14%] items-center justify-center">
        <div className="-scale-y-87 flex-none h-[16.047px] rotate-180 skew-x-[30.04deg] w-[25.174px]">
          <Group2 />
        </div>
      </div>
      <Group3 />
      <Group4 />
      <Group5 />
      <Group6 />
      <Group10 />
      <Group11 />
      <Group12 />
      <Group13 />
      <Group14 />
      <Group15 />
      <div className="absolute flex inset-[41.88%_59.14%_44.23%_7.65%] items-center justify-center">
        <div className="flex-none h-[16.047px] scale-y-87 skew-x-[-30.04deg] w-[25.174px]">
          <Group16 />
        </div>
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="absolute bottom-[3.73%] contents left-0 top-[41.88%]" data-name="Icon">
      <div className="-translate-x-1/2 absolute bottom-[3.73%] left-1/2 opacity-64 top-[56.44%] w-[100px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 39.8305">
          <ellipse cx="50" cy="19.9152" fill="var(--fill-0, #ADADAD)" fillOpacity="0.18" id="Ellipse 232" rx="50" ry="19.9152" />
        </svg>
      </div>
      <Unboxing />
    </div>
  );
}

function Icon1() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute contents left-1/2 top-[calc(50%-0.2px)]" data-name="Icon">
      <Icon2 />
      <div className="absolute inset-[3.33%_21.41%_88.25%_69.46%] opacity-64" data-name="Union">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.1305 8.41369">
          <path d={svgPaths.p1b467500} fill="var(--fill-0, #1E164E)" id="Union" opacity="0.8" />
        </svg>
      </div>
      <div className="absolute flex inset-[4.6%_75.02%_83.34%_12.92%] items-center justify-center">
        <div className="flex-none h-[8.468px] rotate-[46.73deg] w-[8.593px]">
          <div className="opacity-64 relative size-full" data-name="Union">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.59326 8.46837">
              <path d={svgPaths.p27890e00} fill="var(--fill-0, #1E164E)" id="Union" opacity="0.8" />
            </svg>
          </div>
        </div>
      </div>
      <div className="absolute h-[22.477px] left-[17.87px] opacity-64 top-[13.53px] w-[20.117px]">
        <div className="absolute inset-[-1.81%_-2.02%_-1.81%_-1.99%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.9234 23.2892">
            <path d={svgPaths.p1fa88500} id="Vector 1" opacity="0.8" stroke="var(--stroke-0, #1E164E)" strokeDasharray="3.25 3.25" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.812282" />
          </svg>
        </div>
      </div>
      <div className="absolute flex h-[26.505px] items-center justify-center left-[55.98px] top-[12.35px] w-[24.872px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-scale-y-100 flex-none rotate-[166.84deg]">
          <div className="h-[22.477px] opacity-64 relative w-[20.288px]">
            <div className="absolute inset-[-1.81%_-2%_-1.81%_-1.63%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.0257 23.2892">
                <path d={svgPaths.p1a9f2900} id="Vector 2" opacity="0.8" stroke="var(--stroke-0, #1E164E)" strokeDasharray="3.25 3.25" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.812282" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty1() {
  return (
    <div className="overflow-clip relative shrink-0 size-[100px]" data-name="Empty">
      <Icon1 />
    </div>
  );
}

function Empty() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-center justify-center min-h-px min-w-px relative" data-name="Empty">
      <Empty1 />
      <div className="flex flex-col font-['SF_Pro_Text:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(60,60,67,0.8)] text-center tracking-[-0.4px] whitespace-nowrap">
        <p className="leading-[20px]">Danh sách dự án trống. Tạo dự án mới để bắt đầu</p>
      </div>
    </div>
  );
}

function Layout9() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-center min-h-px min-w-px overflow-clip relative w-full z-[3]" data-name="layout">
      <TriNghimSnPhmStudio />
      <Empty />
    </div>
  );
}

function ComponentTheoDon() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] isolate items-center min-h-px min-w-px overflow-clip relative w-full" data-name="Component / theo đoạn">
      <ProjectListHeader />
      <Layout9 />
    </div>
  );
}

function Layout1() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[16px] w-full" data-name="layout">
      <div className="content-stretch flex flex-col gap-[24px] items-start p-[24px] relative size-full">
        <DnhDngTp />
        <ComponentTheoDon />
      </div>
    </div>
  );
}

function Layout() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start min-h-px min-w-px overflow-x-clip overflow-y-auto relative" data-name="Layout">
      <div className="bg-white h-[80px] relative shrink-0 w-full" data-name="Header">
        <div aria-hidden="true" className="absolute border-[rgba(30,22,78,0.16)] border-b border-solid inset-0 pointer-events-none" />
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex gap-[40px] items-center px-[24px] py-[12px] relative size-full">
            <ProjectInfo />
          </div>
        </div>
      </div>
      <Layout1 />
    </div>
  );
}

function Component() {
  return (
    <div className="absolute bg-white content-stretch flex inset-0 items-start" data-name="1280 - 1439">
      <SidebarAivoice />
      <Layout />
    </div>
  );
}

export default function DAnDanhSachTrng() {
  return (
    <div className="relative size-full" data-name="Dự án / Danh sách trống">
      <Component />
    </div>
  );
}