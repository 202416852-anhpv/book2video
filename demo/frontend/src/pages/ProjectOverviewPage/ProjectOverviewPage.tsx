import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  FileText,
  Loader2,
  Pencil,
  RefreshCw,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { getLessonProject } from "@/lib/projectStore";
import {
  MOCK_LESSON_ASSETS,
  MOCK_SOURCE_SECTIONS,
  MOCK_TEMPLATES,
} from "@/mocks/mockBook2Video";
import type { LessonAsset, LessonAssetType } from "@/types/lesson";

type FilterTab = "all" | LessonAssetType;

export default function ProjectOverviewPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const project = useMemo(
    () => (projectId ? getLessonProject(projectId) : undefined),
    [projectId]
  );

  const [assets, setAssets] = useState<LessonAsset[]>(MOCK_LESSON_ASSETS);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [editingAsset, setEditingAsset] = useState<LessonAsset | null>(null);
  const [showSourcePanel, setShowSourcePanel] = useState(true);

  if (!project) {
    return <Navigate to="/" replace />;
  }

  const template =
    MOCK_TEMPLATES.find((t) => t.id === project.templateId) || MOCK_TEMPLATES[0];

  const approvedCount = assets.filter((a) => a.status === "approved").length;

  const filteredAssets = assets.filter((a) =>
    activeTab === "all" ? true : a.type === activeTab
  );

  const toggleApprove = (id: string) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "approved" ? "pending" : "approved" }
          : a
      )
    );
  };

  const approveAll = () => {
    setAssets((prev) => prev.map((a) => ({ ...a, status: "approved" })));
  };

  const handleRegenerate = (id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "regenerating" } : a))
    );
    setTimeout(() => {
      setAssets((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a))
      );
    }, 900);
  };

  const handleSaveEdit = () => {
    if (!editingAsset) return;
    setAssets((prev) =>
      prev.map((a) => (a.id === editingAsset.id ? editingAsset : a))
    );
    setEditingAsset(null);
  };

  return (
    <div className="h-full flex flex-col bg-stone-50/70 dark:bg-neutral-950 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b px-4 md:px-6 flex items-center justify-between bg-white dark:bg-neutral-900 shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Trang chủ
          </Button>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm md:text-base truncate">
                {project.title}
              </h1>
              <Badge
                variant="secondary"
                className="hidden md:inline-flex text-[11px] bg-blue-50 text-blue-700 border-blue-200"
              >
                Template: {template.name}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Badge
            variant="outline"
            className="text-xs py-1 px-2.5 bg-emerald-50/70 text-emerald-700 border-emerald-200"
          >
            {approvedCount}/{assets.length} assets đã duyệt
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSourcePanel((v) => !v)}
            className="hidden lg:inline-flex"
          >
            <BookOpen className="w-4 h-4 mr-1.5" />
            {showSourcePanel ? "Ẩn học liệu gốc" : "Xem học liệu gốc"}
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/editor/${project.id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sinh Slide & Vào Studio
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left: Assets Review Grid */}
        <main className="flex-1 min-h-0 overflow-y-auto p-5 md:p-6">
          <div className="max-w-5xl mx-auto space-y-5">
            {/* Info Banner & Bulk Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-xl border">
              <div>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Duyệt Assets do AI phân tích từ học liệu
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kiểm tra hình ảnh minh họa, từ vựng, câu ví dụ trước khi AI
                  ghép vào 12 slide bài giảng.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={approveAll}
                className="shrink-0"
              >
                <CheckCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                Duyệt tất cả
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: "all", label: `Tất cả (${assets.length})` },
                {
                  id: "vocab-visual",
                  label: `Từ vựng & Ảnh (${
                    assets.filter((a) => a.type === "vocab-visual").length
                  })`,
                },
                {
                  id: "character",
                  label: `Nhân vật & Bối cảnh (${
                    assets.filter((a) => a.type === "character").length
                  })`,
                },
                {
                  id: "exercise",
                  label: `Bài tập (${
                    assets.filter((a) => a.type === "exercise").length
                  })`,
                },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as FilterTab)}
                  className={
                    activeTab === tab.id
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-white dark:bg-neutral-900"
                  }
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Asset Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => {
                const isApproved = asset.status === "approved";
                const isRegen = asset.status === "regenerating";

                return (
                  <Card
                    key={asset.id}
                    className={`overflow-hidden flex flex-col justify-between bg-white dark:bg-neutral-900 transition-all ${
                      isApproved ? "border-emerald-300/80" : "border-border"
                    }`}
                  >
                    <div>
                      {/* Visual Preview */}
                      <div
                        className={`h-32 bg-gradient-to-br ${asset.visualBg} relative flex flex-col items-center justify-center p-3 border-b`}
                      >
                        <Badge
                          variant="secondary"
                          className="absolute top-2 left-2 text-[10px] bg-white/90 text-slate-700"
                        >
                          {asset.templateSlot}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="absolute top-2 right-2 text-[10px] bg-white/90 text-slate-700"
                        >
                          {asset.section}
                        </Badge>

                        {isRegen ? (
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        ) : (
                          <span className="text-4xl mb-1">{asset.visualEmoji}</span>
                        )}
                        <span className="font-bold text-slate-900 text-base">
                          {asset.title}
                        </span>
                        {asset.subtitle && (
                          <span className="text-xs text-slate-600 font-mono">
                            {asset.subtitle}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="p-3.5 space-y-1.5 text-xs">
                        {asset.meaning && (
                          <div>
                            <span className="text-muted-foreground">Nghĩa: </span>
                            <strong className="text-foreground">
                              {asset.meaning}
                            </strong>
                          </div>
                        )}
                        {asset.exampleEn && (
                          <div className="p-2 rounded bg-slate-50 dark:bg-neutral-800/60 text-[11px]">
                            <div className="font-medium text-blue-700 dark:text-blue-300">
                              {asset.exampleEn}
                            </div>
                            {asset.exampleVi && (
                              <div className="text-muted-foreground">
                                {asset.exampleVi}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-3.5 py-2.5 border-t bg-slate-50/50 dark:bg-neutral-900 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant={isApproved ? "default" : "outline"}
                        onClick={() => toggleApprove(asset.id)}
                        className={`h-7 text-xs flex-1 ${
                          isApproved
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : ""
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        {isApproved ? "Đã duyệt" : "Duyệt"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRegenerate(asset.id)}
                        disabled={isRegen}
                        className="h-7 px-2 text-xs"
                        title="Tạo lại bằng AI"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isRegen ? "animate-spin" : ""}`}
                        />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingAsset(asset)}
                        className="h-7 px-2 text-xs"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>

        {/* Right: Source Material Structure Panel */}
        {showSourcePanel && (
          <aside className="hidden lg:flex w-80 border-l bg-white dark:bg-neutral-900 flex-col shrink-0">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                Cấu trúc học liệu gốc
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                SB: {project.sbFileName} · TB: {project.tbFileName}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {MOCK_SOURCE_SECTIONS.map((sec) => (
                <div
                  key={sec.skill}
                  className="p-3 rounded-lg border bg-stone-50/70 dark:bg-neutral-800/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">
                      {sec.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {sec.start_hms} – {sec.end_hms}
                    </span>
                  </div>
                  <div className="font-medium text-foreground leading-snug">
                    {sec.title}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Edit Asset Dialog */}
      <Dialog
        open={!!editingAsset}
        onOpenChange={(open) => !open && setEditingAsset(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Asset</DialogTitle>
          </DialogHeader>
          {editingAsset && (
            <div className="space-y-3 py-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Từ vựng / Tiêu đề
                </label>
                <Input
                  value={editingAsset.title}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Nghĩa tiếng Việt
                </label>
                <Input
                  value={editingAsset.meaning || ""}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, meaning: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Prompt sinh ảnh AI
                </label>
                <Textarea
                  rows={3}
                  value={editingAsset.prompt}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, prompt: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAsset(null)}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
