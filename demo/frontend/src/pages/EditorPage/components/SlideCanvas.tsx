import { Badge } from "@/components/ui/badge";
import { MOCK_LESSON_ASSETS } from "@/mocks/mockBook2Video";
import type { LessonSlide } from "@/types/lesson";

interface SlideCanvasProps {
  slide: LessonSlide;
  templateId: string;
  activeSubtitle?: string;
}

const TEMPLATE_THEME: Record<
  string,
  { bg: string; accent: string; badgeBg: string; border: string }
> = {
  "classroom-modern": {
    bg: "bg-gradient-to-br from-slate-50 via-white to-blue-50/70",
    accent: "text-blue-700",
    badgeBg: "bg-blue-600 text-white",
    border: "border-blue-200",
  },
  "vocab-card": {
    bg: "bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/70",
    accent: "text-emerald-700",
    badgeBg: "bg-emerald-600 text-white",
    border: "border-emerald-200",
  },
  "dialogue-split": {
    bg: "bg-gradient-to-br from-violet-50/60 via-white to-purple-50/70",
    accent: "text-violet-700",
    badgeBg: "bg-violet-600 text-white",
    border: "border-violet-200",
  },
  "minimal-clean": {
    bg: "bg-white",
    accent: "text-orange-600",
    badgeBg: "bg-orange-600 text-white",
    border: "border-orange-200",
  },
};

export default function SlideCanvas({
  slide,
  templateId,
  activeSubtitle,
}: SlideCanvasProps) {
  const theme = TEMPLATE_THEME[templateId] || TEMPLATE_THEME["classroom-modern"];
  const linkedAsset = slide.content.assetId
    ? MOCK_LESSON_ASSETS.find((a) => a.id === slide.content.assetId)
    : undefined;

  if (slide.imageUrl) {
    return (
      <div
        className={`w-full aspect-video rounded-xl border shadow-sm overflow-hidden relative bg-white ${theme.border}`}
      >
        <img
          src={slide.imageUrl}
          alt={slide.title}
          className="w-full h-full object-contain bg-white"
        />
        {activeSubtitle && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/85 text-white text-xs max-w-[90%] truncate shadow">
            {activeSubtitle}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`w-full aspect-video rounded-xl border shadow-sm overflow-hidden relative flex flex-col justify-between p-6 md:p-8 select-none ${theme.bg} ${theme.border}`}
    >
      {/* Top Slide Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className={`text-[11px] ${theme.badgeBg}`}>
            {slide.section}
          </Badge>
          {slide.subtitle && (
            <span className="text-xs font-medium text-slate-500">
              {slide.subtitle}
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-slate-400">
          Slide {slide.index}
        </span>
      </div>

      {/* Main Slide Body */}
      <div className="flex-1 flex items-center justify-center py-3 min-h-0">
        {slide.layout === "title" && (
          <div className="text-center space-y-3 max-w-xl">
            {linkedAsset && (
              <div className="text-5xl mb-2">{linkedAsset.visualEmoji}</div>
            )}
            <h2 className={`text-2xl md:text-3xl font-extrabold ${theme.accent}`}>
              {slide.title}
            </h2>
            <p className="text-base md:text-lg font-semibold text-slate-700">
              {slide.subtitle}
            </p>
            {slide.content.note && (
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium mt-2">
                {slide.content.note}
              </div>
            )}
          </div>
        )}

        {(slide.layout === "objectives" || slide.layout === "closing") && (
          <div className="w-full max-w-2xl space-y-4">
            <h2 className={`text-xl md:text-2xl font-bold ${theme.accent}`}>
              {slide.title}
            </h2>
            <ul className="space-y-2.5">
              {(slide.content.bullets || []).map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 bg-white/80 p-3 rounded-lg border border-slate-200/80 shadow-xs text-sm text-slate-700"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${theme.badgeBg}`}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-snug pt-0.5">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {slide.layout === "look-and-say" && (
          <div className="w-full max-w-2xl space-y-4">
            <h2 className={`text-xl font-bold text-center ${theme.accent}`}>
              {slide.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(slide.content.dialogues || []).map((d, idx) => (
                <div
                  key={idx}
                  className="bg-white/90 rounded-xl border p-4 shadow-xs flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{d.avatarEmoji}</span>
                    <span className="font-bold text-sm text-slate-800">
                      {d.speaker}
                    </span>
                  </div>
                  <div className={`text-base font-bold ${theme.accent}`}>
                    “{d.en}”
                  </div>
                  <div className="text-xs text-slate-500">{d.vi}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {slide.layout === "vocab-card" && (
          <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-5 gap-5 items-center">
            <div
              className={`sm:col-span-2 aspect-square rounded-2xl bg-gradient-to-br ${
                linkedAsset?.visualBg || "from-blue-50 to-indigo-100"
              } border flex flex-col items-center justify-center p-4 shadow-inner`}
            >
              <span className="text-6xl mb-2">
                {linkedAsset?.visualEmoji || "📘"}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Asset minh họa
              </span>
            </div>
            <div className="sm:col-span-3 space-y-3">
              <div>
                <div className={`text-3xl md:text-4xl font-extrabold ${theme.accent}`}>
                  {slide.content.word}
                </div>
                <div className="text-sm font-mono text-slate-500 mt-0.5">
                  {slide.content.ipa}
                </div>
              </div>
              <div className="text-lg font-semibold text-slate-800">
                {slide.content.meaning}
              </div>
              {slide.content.exampleEn && (
                <div className="p-3 rounded-xl bg-white/90 border space-y-0.5">
                  <div className="text-sm font-semibold text-slate-800">
                    {slide.content.exampleEn}
                  </div>
                  <div className="text-xs text-slate-500">
                    {slide.content.exampleVi}
                  </div>
                </div>
              )}
              {slide.content.note && (
                <div className="text-[11px] text-slate-400 italic">
                  💡 {slide.content.note}
                </div>
              )}
            </div>
          </div>
        )}

        {slide.layout === "exercise" && (
          <div className="w-full max-w-2xl space-y-3">
            <h2 className={`text-lg md:text-xl font-bold ${theme.accent}`}>
              {slide.title}
            </h2>
            <p className="text-xs text-slate-600">
              {slide.content.exerciseInstruction}
            </p>
            <div className="space-y-2">
              {(slide.content.exerciseItems || []).map((item) => (
                <div
                  key={item.no}
                  className="grid grid-cols-2 gap-3 text-xs md:text-sm"
                >
                  <div className="bg-white/90 border rounded-lg px-3 py-2 font-semibold text-slate-800">
                    {item.no}. {item.left}
                  </div>
                  <div className="bg-white/90 border rounded-lg px-3 py-2 text-slate-600">
                    {item.right}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Subtitle Bar (when playing) */}
      <div className="h-7 flex items-center justify-center">
        {activeSubtitle ? (
          <div className="px-3 py-1 rounded-full bg-slate-900/85 text-white text-xs max-w-xl truncate">
            {activeSubtitle}
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">
            Book2Video · Tiếng Anh Logistics
          </span>
        )}
      </div>
    </div>
  );
}
