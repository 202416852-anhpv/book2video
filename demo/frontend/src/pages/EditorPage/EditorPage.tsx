import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Pause,
  Play,
  Plus,
  Trash2,
  Volume2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { getLessonProject } from "@/lib/projectStore";
import {
  MOCK_LESSON_SLIDES,
  MOCK_TEMPLATES,
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
  const [templateId, setTemplateId] = useState<string>(
    project?.templateId || MOCK_TEMPLATES[0].id
  );
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

  const totalSlideDuration = activeSlide.narrations.reduce(
    (sum, n) => sum + n.durationSec + n.pauseAfterSec,
    0
  );

  const updateNarration = (
    segId: string,
    patch: Partial<NarrationSegment>
  ) => {
    setSlides((prev) =>
      prev.map((s) =>
        s.id !== activeSlide.id
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
      text: "Nhập lời đọc mới cho slide này...",
      durationSec: 3.5,
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

  const handleAddSlide = () => {
    const nextIndex = slides.length + 1;
    const newSlide: LessonSlide = {
      id: `slide-${Date.now()}`,
      index: nextIndex,
      section: "Mở rộng",
      layout: "vocab-card",
      title: `Slide ${nextIndex}`,
      subtitle: "Nội dung mới",
      content: {
        word: "warehouse",
        ipa: "/ˈweəhaʊs/",
        meaning: "nhà kho",
        exampleEn: "This is our main warehouse.",
        exampleVi: "Đây là nhà kho chính của chúng tôi.",
        note: "Nghe và nhắc lại",
      },
      narrations: [
        {
          id: `nar-new-${Date.now()}`,
          voiceId: MOCK_VOICES[0].id,
          lang: "vi",
          speed: 1.0,
          pauseAfterSec: 0.5,
          text: "Từ tiếp theo là warehouse, nghĩa là nhà kho.",
          durationSec: 4.0,
        },
      ],
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideId(newSlide.id);
  };

  const activeSubtitle = isPlaying
    ? activeSlide.narrations[0]?.text
    : playingSegmentId
    ? activeSlide.narrations.find((n) => n.id === playingSegmentId)?.text
    : undefined;

  return (
    <div className="h-full flex flex-col bg-stone-50/70 dark:bg-neutral-950 overflow-hidden">
      {/* Studio Header */}
      <header className="h-14 border-b px-4 flex items-center justify-between bg-white dark:bg-neutral-900 shrink-0 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project/${project.id}/overview`)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Duyệt Assets
          </Button>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <h1 className="font-semibold text-sm truncate hidden sm:block">
            {project.title}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 hidden md:block" />
            <Select value={templateId} onValueChange={(v) => v && setTemplateId(v)}>
              <SelectTrigger className="h-8 w-[170px] text-xs">
                <SelectValue placeholder="Chọn template" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={() => setIsExportOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Xuất bản
          </Button>
        </div>
      </header>

      {/* Main 2-Column Studio: Left = Vbee Narration, Right = Slide Canvas & Filmstrip */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANEL: Lời đọc & Giọng đọc (Vbee-style) */}
        <aside className="w-full lg:w-[440px] xl:w-[480px] border-r bg-white dark:bg-neutral-900 flex flex-col min-h-0 shrink-0">
          <div className="p-3.5 border-b flex items-center justify-between bg-slate-50/70 dark:bg-neutral-900">
            <div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-sm">
                  Lời đọc & Giọng đọc (Vbee)
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Slide {activeSlide.index}/{slides.length} · {activeSlide.section} ·{" "}
                ~{totalSlideDuration.toFixed(1)}s
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={activeSlideIndex === 0}
                onClick={() =>
                  setActiveSlideId(slides[activeSlideIndex - 1].id)
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={activeSlideIndex === slides.length - 1}
                onClick={() =>
                  setActiveSlideId(slides[activeSlideIndex + 1].id)
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Narration Segments List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {activeSlide.narrations.map((seg, idx) => {
              const isSegPlaying = playingSegmentId === seg.id;
              return (
                <div
                  key={seg.id}
                  className="p-3 rounded-xl border bg-stone-50/60 dark:bg-neutral-800/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        Đoạn {idx + 1}
                      </Badge>
                      <Select
                        value={seg.voiceId}
                        onValueChange={(v) =>
                          v && updateNarration(seg.id, { voiceId: v })
                        }
                      >
                        <SelectTrigger className="h-7 text-xs bg-white dark:bg-neutral-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MOCK_VOICES.map((voice) => (
                            <SelectItem
                              key={voice.id}
                              value={voice.id}
                              className="text-xs"
                            >
                              {voice.lang === "vi" ? "🇻🇳" : "🇺🇸"} {voice.name} (
                              {voice.accent})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => deleteNarrationSegment(seg.id)}
                      title="Xóa đoạn lời đọc"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <Textarea
                    rows={3}
                    value={seg.text}
                    onChange={(e) =>
                      updateNarration(seg.id, { text: e.target.value })
                    }
                    className="text-xs bg-white dark:bg-neutral-900 resize-none leading-relaxed"
                  />

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        Tốc độ: <strong>{seg.speed.toFixed(2)}x</strong>
                      </span>
                      <Slider
                        value={[seg.speed]}
                        min={0.75}
                        max={1.5}
                        step={0.05}
                        onValueChange={(vals) => {
                          const v = Array.isArray(vals) ? vals[0] : vals;
                          updateNarration(seg.id, { speed: v });
                        }}
                        className="w-24"
                      />
                    </div>

                    <Button
                      size="sm"
                      variant={isSegPlaying ? "default" : "outline"}
                      onClick={() => handlePreviewVoice(seg.id)}
                      className={`h-7 text-xs ${
                        isSegPlaying
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-white dark:bg-neutral-900"
                      }`}
                    >
                      {isSegPlaying ? (
                        <>
                          <Pause className="w-3 h-3 mr-1" />
                          Đang đọc…
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          Nghe thử
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={addNarrationSegment}
              className="w-full border-dashed text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Thêm đoạn lời đọc
            </Button>
          </div>
        </aside>

        {/* RIGHT PANEL: Slide Preview & Filmstrip */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-100/70 dark:bg-neutral-950">
          {/* Canvas Area */}
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto">
            <div className="w-full max-w-3xl space-y-3">
              <SlideCanvas
                slide={activeSlide}
                templateId={templateId}
                activeSubtitle={activeSubtitle}
              />

              {/* Playback Bar */}
              <div className="flex items-center justify-between bg-white dark:bg-neutral-900 px-4 py-2 rounded-xl border shadow-xs">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isPlaying ? "default" : "outline"}
                    onClick={() => setIsPlaying((p) => !p)}
                    className={
                      isPlaying ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                    }
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 mr-1.5" />
                        Tạm dừng
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                        Phát thử bài giảng
                      </>
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Slide {activeSlide.index} / {slides.length}
                  </span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  ~{totalSlideDuration.toFixed(1)}s
                </span>
              </div>
            </div>
          </div>

          {/* Section Filter Bar + Bottom Slide Filmstrip */}
          <div className="border-t bg-white dark:bg-neutral-900 shrink-0">
            <div className="px-4 pt-2 pb-1 flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 dark:border-neutral-800">
              {sections.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSectionFilter(sec)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0 transition-colors ${
                    sectionFilter === sec
                      ? "bg-blue-600 text-white"
                      : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  {sec === "all" ? `Tất cả (${slides.length})` : sec}
                </button>
              ))}
            </div>

            <div className="h-28 px-4 py-2 flex items-center gap-2.5 overflow-x-auto">
              {visibleSlides.map((s) => {
                const isActive = s.id === activeSlide.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setActiveSlideId(s.id);
                    }}
                    className={`w-36 h-20 rounded-lg border-2 overflow-hidden relative shrink-0 transition-all bg-white ${
                      isActive
                        ? "border-blue-600 ring-2 ring-blue-600/20"
                        : "border-border hover:border-slate-300"
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
                      <div className="p-2 text-left text-[11px] font-medium line-clamp-2">
                        {s.content.word || s.title}
                      </div>
                    )}
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/75 text-white text-[10px] font-bold">
                      #{s.index}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleAddSlide}
                className="w-24 h-20 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-blue-600 shrink-0 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Export Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Xuất bản bài giảng
            </DialogTitle>
            <DialogDescription>
              Chọn định dạng xuất bản cho "{project.title}" ({slides.length}{" "}
              slides có lồng tiếng Vbee).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <div className="p-3 rounded-lg border flex items-center justify-between">
              <div>
                <div className="font-medium">Video bài giảng (.MP4)</div>
                <div className="text-xs text-muted-foreground">
                  1920x1080 · Kèm lồng tiếng Vbee & phụ đề
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
