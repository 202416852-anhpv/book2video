import { useState, type ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Layers,
} from "lucide-react";
import { MOCK_TEMPLATES } from "@/mocks/mockBook2Video";
import type { LessonProject } from "@/types/lesson";

interface CreateLessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftProject?: LessonProject | null;
  onComplete: (data: {
    title: string;
    level: string;
    sbFileName: string;
    tbFileName: string;
    templateId: string;
  }) => void;
}

const DEMO_SB_FILES = [
  { name: "LOG_1.1.1_SB.docx", label: "SB (DOCX)" },
  { name: "LOG_1.1.1_SB.pdf", label: "SB (PDF)" },
];

const DEMO_TB_FILES = [
  { name: "LOG_1.1.1_TB.docx", label: "TB (DOCX)" },
  { name: "LOG_1.1.1_TB.pdf", label: "TB (PDF)" },
];

export default function CreateLessonModal({
  open,
  onOpenChange,
  draftProject,
  onComplete,
}: CreateLessonModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState(
    draftProject?.title || "Logistics English - Lesson 1.1.1: Hello, I'm…"
  );
  const [level, setLevel] = useState(draftProject?.level || "TB1 · A1");
  const [sbFileName, setSbFileName] = useState(
    draftProject?.sbFileName || "LOG_1.1.1_SB.docx"
  );
  const [tbFileName, setTbFileName] = useState(
    draftProject?.tbFileName || "LOG_1.1.1_TB.docx"
  );
  const [templateId, setTemplateId] = useState(
    draftProject?.templateId || MOCK_TEMPLATES[0].id
  );

  const selectedTemplate =
    MOCK_TEMPLATES.find((t) => t.id === templateId) || MOCK_TEMPLATES[0];

  const handleSbChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSbFileName(file.name);
  };

  const handleTbChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setTbFileName(file.name);
  };

  const handleFinish = () => {
    onComplete({
      title: title.trim() || "Bài giảng Tiếng Anh mới",
      level,
      sbFileName,
      tbFileName,
      templateId,
    });
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-slate-50/70 dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  Tạo bài giảng Slide có lồng tiếng
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Bước {step}/3 ·{" "}
                  {step === 1
                    ? "Import 2 file học liệu: Student Book (SB) & Teacher's Book (TB)"
                    : step === 2
                    ? "Chọn Template Slide"
                    : "AI phân tích SB + TB & lên danh sách 99 Slide"}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              Môn: Tiếng Anh
            </Badge>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-blue-600" : "bg-slate-200 dark:bg-neutral-800"
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Tên bài giảng
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Logistics English - Lesson 1.1.1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Trình độ
                  </label>
                  <Input
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="TB1 · A1"
                  />
                </div>
              </div>

              {/* Dual-file upload: SB & TB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student Book (SB) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground block">
                    1. Student Book (SB)
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 dark:border-blue-800 rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50/40 transition-colors text-center">
                    <Upload className="w-6 h-6 text-blue-600 mb-1.5" />
                    <span className="text-xs font-medium">
                      Tải file SB (.docx, .pdf)
                    </span>
                    <span className="text-[11px] text-blue-700 font-semibold mt-1 truncate max-w-full">
                      {sbFileName}
                    </span>
                    <input
                      type="file"
                      accept=".docx,.pdf,.txt,.md"
                      className="hidden"
                      onChange={handleSbChange}
                    />
                  </label>
                  <div className="flex gap-1.5">
                    {DEMO_SB_FILES.map((f) => (
                      <button
                        key={f.name}
                        type="button"
                        onClick={() => setSbFileName(f.name)}
                        className={`flex-1 py-1.5 px-2 rounded-md border text-[11px] font-medium flex items-center justify-center gap-1 ${
                          sbFileName === f.name
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-border text-muted-foreground hover:border-slate-300"
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Teacher's Book (TB) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground block">
                    2. Teacher&apos;s Book (TB)
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 dark:border-emerald-800 rounded-xl p-4 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors text-center">
                    <Upload className="w-6 h-6 text-emerald-600 mb-1.5" />
                    <span className="text-xs font-medium">
                      Tải file TB (.docx, .pdf)
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold mt-1 truncate max-w-full">
                      {tbFileName}
                    </span>
                    <input
                      type="file"
                      accept=".docx,.pdf,.txt,.md"
                      className="hidden"
                      onChange={handleTbChange}
                    />
                  </label>
                  <div className="flex gap-1.5">
                    {DEMO_TB_FILES.map((f) => (
                      <button
                        key={f.name}
                        type="button"
                        onClick={() => setTbFileName(f.name)}
                        className={`flex-1 py-1.5 px-2 rounded-md border text-[11px] font-medium flex items-center justify-center gap-1 ${
                          tbFileName === f.name
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : "border-border text-muted-foreground hover:border-slate-300"
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Chọn 1 template cố định. AI sẽ dựa vào cấu trúc ô của template để
                phân tích và sinh ra các <strong>Assets</strong> phù hợp.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_TEMPLATES.map((tpl) => {
                  const selected = tpl.id === templateId;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setTemplateId(tpl.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                        selected
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                          : "border-border hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-semibold text-sm flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: tpl.accentColor }}
                            />
                            {tpl.name}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {tpl.badge}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                      <div className="mt-3 pt-3 border-t flex flex-wrap gap-1.5">
                        {tpl.slots.map((slot) => (
                          <span
                            key={slot}
                            className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-neutral-900 border text-muted-foreground"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold text-blue-950 dark:text-blue-100">
                    AI đã phân tích xong cặp học liệu SB + TB
                  </div>
                  <p className="text-xs text-blue-800/80 dark:text-blue-200/80 mt-1">
                    Kết hợp <strong>{sbFileName}</strong> và{" "}
                    <strong>{tbFileName}</strong> theo template{" "}
                    <strong>{selectedTemplate.name}</strong>, hệ thống đã chuẩn
                    bị <strong>12 Assets</strong> và{" "}
                    <strong>99 Slide bài giảng</strong> kèm lời đọc chi tiết.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-medium">99 Slide nguyên bản</div>
                    <div className="text-muted-foreground">
                      Khớp 100% kịch bản & mục tiêu
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-medium">8 Phần kỹ năng</div>
                    <div className="text-muted-foreground">
                      Mở đầu, A–F, Tổng kết
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-slate-50/70 dark:bg-neutral-900 flex items-center justify-between">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Quay lại
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}>
              Tiếp tục
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Tiếp tục duyệt Assets
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
