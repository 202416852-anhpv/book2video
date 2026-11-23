import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Flag,
  Languages,
  Maximize2,
  Menu,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
  Volume2,
  CheckCircle2,
} from "lucide-react";
import { getLessonProject } from "@/lib/projectStore";
import {
  MOCK_LESSON_SLIDES,
  MOCK_VOICES,
} from "@/mocks/mockBook2Video";
import type { LessonSlide, NarrationSegment } from "@/types/lesson";
import SlideCanvas from "./components/SlideCanvas";

export default function EditorPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const project = useMemo(
    () => (projectId ? getLessonProject(projectId) : undefined),
    [projectId]
  );

  const [slides, setSlides] = useState<LessonSlide[]>(MOCK_LESSON_SLIDES);
  const [activeSlideId, setActiveSlideId] = useState<string>(
    MOCK_LESSON_SLIDES[0].id
  );
  const [viewTab, setViewTab] = useState<"current" | "all">("current");
  const [activeTool, setActiveTool] = useState<string>("voices");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<string>("all");

  const sections = useMemo(
    () => ["all", ...Array.from(new Set(slides.map((s) => s.section)))],
    [slides]
  );
  const visibleSlides = useMemo(
    () =>
      sectionFilter === "all"
        ? slides
        : slides.filter((s) => s.section === sectionFilter),
    [slides, sectionFilter]
  );

  const activeSlideIndex = Math.max(
    0,
    slides.findIndex((s) => s.id === activeSlideId)
  );
  const activeSlide = slides[activeSlideIndex] || slides[0];

  const totalChars = useMemo(
    () =>
      slides.reduce(
        (sum, s) =>
          sum + s.narrations.reduce((nSum, n) => nSum + n.text.length, 0),
        0
      ),
    [slides]
  );

  // Simulated presentation playback
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveSlideId((currentId) => {
        const idx = slides.findIndex((s) => s.id === currentId);
        if (idx < slides.length - 1) {
          return slides[idx + 1].id;
        }
        setIsPlaying(false);
        return currentId;
      });
    }, 3200);
    return () => clearInterval(timer);
  }, [isPlaying, slides]);

  if (!project) {
    return <Navigate to="/" replace />;
  }

  const updateNarration = (
    slideId: string,
    segId: string,
    patch: Partial<NarrationSegment>
  ) => {
    setSlides((prev) =>
      prev.map((s) =>
        s.id !== slideId
          ? s
          : {
              ...s,
              narrations: s.narrations.map((n) =>
                n.id === segId ? { ...n, ...patch } : n
              ),
            }
      )
    );
  };

  const addNarrationSegment = () => {
    const newSeg: NarrationSegment = {
      id: `nar-${Date.now()}`,
      voiceId: MOCK_VOICES[0].id,
      lang: "vi",
      speed: 1.0,
      pauseAfterSec: 0.5,
      text: "",
      durationSec: 3.0,
    };
    setSlides((prev) =>
      prev.map((s) =>
        s.id !== activeSlide.id
          ? s
          : { ...s, narrations: [...s.narrations, newSeg] }
      )
    );
  };

  const deleteNarrationSegment = (segId: string) => {
    setSlides((prev) =>
      prev.map((s) =>
        s.id !== activeSlide.id
          ? s
          : {
              ...s,
              narrations: s.narrations.filter((n) => n.id !== segId),
            }
      )
    );
  };

  const handlePreviewVoice = (segId: string) => {
    if (playingSegmentId === segId) {
      setPlayingSegmentId(null);
      return;
    }
    setPlayingSegmentId(segId);
    setTimeout(() => {
      setPlayingSegmentId((curr) => (curr === segId ? null : curr));
    }, 2200);
  };

  const activeSubtitle = isPlaying
    ? activeSlide.narrations[0]?.text
    : playingSegmentId
    ? activeSlide.narrations.find((n) => n.id === playingSegmentId)?.text
    : undefined;

  const toolItems = [
    { id: "voices", label: "Giọng đọc và nhân vật", icon: UserRound },
    { id: "ai-check", label: "AI kiểm tra cách đọc", icon: Sparkles },
    { id: "replace", label: "Tìm và thay thế", icon: Search },
    { id: "translate", label: "Dịch", icon: Languages },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-950 overflow-hidden text-slate-900 dark:text-slate-100">
      {/* 1. TOP HEADER */}
      <header className="h-14 border-b px-4 flex items-center justify-between bg-white dark:bg-neutral-900 shrink-0 gap-3">
        {/* Left: Menu + Breadcrumb + Undo/Redo + Saved */}
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => navigate("/")}
            title="Về danh sách dự án"
          >
            <Menu className="w-4 h-4" />
          </Button>
          <button
            type="button"
            onClick={() => navigate(`/project/${project.id}/overview`)}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            Dự án
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <h1 className="font-semibold text-sm truncate max-w-[220px] md:max-w-xs">
            {project.title}
          </h1>
        </div>

        {/* Right: Xuất file */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => setIsExportOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-8 px-4 rounded-lg shadow-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Xuất file
          </Button>
        </div>
      </header>

      {/* 2. MIDDLE WORKSPACE */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Tool Rail */}
        <nav className="hidden md:flex w-[76px] border-r bg-white dark:bg-neutral-900 flex-col items-center py-3 gap-2 shrink-0">
          {toolItems.map((item) => {
            const Icon = item.icon;
            const active = activeTool === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTool(item.id)}
                className={`w-16 py-2 px-1 rounded-lg flex flex-col items-center gap-1 text-center transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-medium"
                    : "text-muted-foreground hover:bg-slate-50 dark:hover:bg-neutral-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Center-Left: Narration Editor (50% of remaining width) */}
        <section className="flex-1 min-w-0 border-r bg-white dark:bg-neutral-900 flex flex-col min-h-0">
          {/* Sub-header */}
          <div className="px-4 py-2.5 border-b flex items-center justify-between gap-2 shrink-0">
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-neutral-800 p-0.5">
              <button
                type="button"
                onClick={() => setViewTab("current")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewTab === "current"
                    ? "bg-white dark:bg-neutral-900 shadow-xs text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Trang hiện tại
              </button>
              <button
                type="button"
                onClick={() => setViewTab("all")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewTab === "all"
                    ? "bg-white dark:bg-neutral-900 shadow-xs text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Tất cả trang
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>
                Trang {activeSlide.index}/{slides.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={activeSlideIndex === 0}
                onClick={() =>
                  setActiveSlideId(slides[activeSlideIndex - 1].id)
                }
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={activeSlideIndex === slides.length - 1}
                onClick={() =>
                  setActiveSlideId(slides[activeSlideIndex + 1].id)
                }
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Narration Document Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {viewTab === "current" ? (
              <>
                {activeSlide.narrations.map((seg) => {
                  const isSegPlaying = playingSegmentId === seg.id;
                  return (
                    <div key={seg.id} className="group space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Select
                          value={seg.voiceId}
                          onValueChange={(v) =>
                            v &&
                            updateNarration(activeSlide.id, seg.id, {
                              voiceId: v,
                            })
                          }
                        >
                          <SelectTrigger className="h-7 w-auto min-w-[160px] rounded-full text-xs bg-slate-50 dark:bg-neutral-800 border-slate-200 px-3">
                            <SelectValue>
                              {(() => {
                                const v = MOCK_VOICES.find(
                                  (item) => item.id === seg.voiceId
                                );
                                return v
                                  ? `${v.lang === "vi" ? "🇻🇳" : "🇺🇸"} ${v.name}`
                                  : seg.voiceId;
                              })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {MOCK_VOICES.map((voice) => (
                              <SelectItem
                                key={voice.id}
                                value={voice.id}
                                className="text-xs"
                              >
                                {voice.lang === "vi" ? "🇻🇳" : "🇺🇸"} {voice.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handlePreviewVoice(seg.id)}
                            title="Nghe thử đoạn này"
                          >
                            {isSegPlaying ? (
                              <Pause className="w-3 h-3 text-blue-600" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteNarrationSegment(seg.id)}
                            title="Xóa đoạn"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="border-l-2 border-blue-200 dark:border-blue-900 pl-3.5">
                        <Textarea
                          rows={2}
                          value={seg.text}
                          placeholder="Nhập lời đọc..."
                          onChange={(e) =>
                            updateNarration(activeSlide.id, seg.id, {
                              text: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              addNarrationSegment();
                            }
                          }}
                          className="border-0 shadow-none focus-visible:ring-0 p-0 text-sm leading-relaxed resize-none bg-transparent min-h-[44px]"
                        />
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addNarrationSegment}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground pt-1"
                >
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 border text-[10px] font-medium">
                    Enter
                  </span>
                  <span>để xuống đoạn mới.</span>
                </button>
              </>
            ) : (
              <div className="space-y-3">
                {slides.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActiveSlideId(s.id);
                      setViewTab("current");
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-xs space-y-1 transition-colors ${
                      s.id === activeSlide.id
                        ? "border-slate-900 bg-slate-50 dark:bg-neutral-800"
                        : "border-border hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      Trang {s.index} · {s.section}
                    </div>
                    <div className="text-muted-foreground line-clamp-2">
                      {s.narrations.map((n) => n.text).join(" ")}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right: Slide Preview + Ghi chú của trang (50% of remaining width) */}
        <section className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-white dark:bg-neutral-950 p-4 md:p-5">
          <div className="flex items-center justify-end mb-2.5 shrink-0">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <Maximize2 className="w-3 h-3" />
              Mở rộng
            </Button>
          </div>

          <div className="w-full max-w-3xl mx-auto space-y-4">
            <SlideCanvas
              slide={activeSlide}
              templateId={project.templateId}
              activeSubtitle={activeSubtitle}
            />

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ghi chú của trang
              </div>
              <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-neutral-900 text-xs text-muted-foreground leading-relaxed min-h-[56px]">
                {activeSlide.content.note ||
                  activeSlide.narrations[0]?.text ||
                  "Chưa có ghi chú cho trang này."}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 3. BOTTOM FULL-WIDTH SLIDE FILMSTRIP */}
      <div className="border-t bg-white dark:bg-neutral-900 shrink-0">
        <div className="px-4 pt-1.5 pb-1 flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 dark:border-neutral-800">
          {sections.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSectionFilter(sec)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium shrink-0 transition-colors ${
                sectionFilter === sec
                  ? "bg-blue-600 text-white"
                  : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-neutral-800"
              }`}
            >
              {sec === "all" ? `Tất cả (${slides.length})` : sec}
            </button>
          ))}
        </div>

        <div className="h-24 px-4 py-2 flex items-center gap-3 overflow-x-auto">
          {visibleSlides.map((s) => {
            const isActive = s.id === activeSlide.id;
            return (
              <div key={s.id} className="flex items-start gap-1 shrink-0">
                <span className="text-[11px] text-muted-foreground font-medium pt-0.5 w-4 text-right">
                  {s.index}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveSlideId(s.id);
                  }}
                  className={`w-32 h-18 rounded-lg border-2 overflow-hidden bg-white transition-all ${
                    isActive
                      ? "border-blue-600 ring-2 ring-blue-600/20 shadow-sm"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {s.imageUrl ? (
                    <img
                      src={s.imageUrl}
                      alt={s.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-2 text-[10px] font-medium line-clamp-2">
                      {s.title}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. BOTTOM FOOTER PLAYER BAR */}
      <footer className="h-12 border-t px-4 flex items-center justify-between bg-white dark:bg-neutral-900 shrink-0 text-xs">
        <div className="text-muted-foreground hidden sm:block">
          {totalChars.toLocaleString()}/100.000 ký tự
        </div>

        <div className="flex items-center gap-4 mx-auto sm:mx-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            disabled={activeSlideIndex === 0}
            onClick={() => setActiveSlideId(slides[activeSlideIndex - 1].id)}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-colors"
            title={isPlaying ? "Tạm dừng" : "Phát thử bài giảng"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            disabled={activeSlideIndex === slides.length - 1}
            onClick={() => setActiveSlideId(slides[activeSlideIndex + 1].id)}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </Button>
          <span className="font-mono text-muted-foreground">
            {activeSlide.index}:00 / {slides.length}:00
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Volume2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Flag className="w-3.5 h-3.5" />
          </Button>
        </div>
      </footer>

      {/* Export Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Xuất bản bài giảng
            </DialogTitle>
            <DialogDescription>
              Chọn định dạng xuất bản cho &quot;{project.title}&quot; (
              {slides.length} slides có lồng tiếng Vbee).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <div className="p-3 rounded-lg border flex items-center justify-between">
              <div>
                <div className="font-medium">Video bài giảng (.MP4)</div>
                <div className="text-xs text-muted-foreground">
                  1920x1080 · Kèm lồng tiếng Vbee &amp; phụ đề
                </div>
              </div>
              <Button size="sm" onClick={() => setIsExportOpen(false)}>
                Tải MP4
              </Button>
            </div>
            <div className="p-3 rounded-lg border flex items-center justify-between">
              <div>
                <div className="font-medium">Slide PowerPoint (.PPTX)</div>
                <div className="text-xs text-muted-foreground">
                  Kèm file âm thanh rời từng slide
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExportOpen(false)}
              >
                Tải PPTX
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsExportOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
