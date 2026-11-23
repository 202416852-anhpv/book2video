import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  FileText,
  Layers,
  LayoutGrid,
  List,
  Plus,
  Search,
  Sparkles,
  Volume2,
} from "lucide-react";
import { getAllLessonProjects, saveLessonProject } from "@/lib/projectStore";
import { MOCK_TEMPLATES } from "@/mocks/mockBook2Video";
import type { LessonProject } from "@/types/lesson";
import CreateLessonModal from "./components/CreateLessonModal";

const createProjectId = () =>
  `lesson-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 5)}`;

export default function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<LessonProject[]>(() =>
    getAllLessonProjects()
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<LessonProject | null>(null);

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sbFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tbFileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProjectClick = (project: LessonProject) => {
    if (project.status === "draft") {
      setSelectedDraft(project);
      setIsModalOpen(true);
    } else {
      navigate(`/project/${project.id}/overview`);
    }
  };

  const handleCreateComplete = (data: {
    title: string;
    level: string;
    sbFileName: string;
    tbFileName: string;
    templateId: string;
  }) => {
    const newProject: LessonProject = {
      id: selectedDraft ? selectedDraft.id : createProjectId(),
      title: data.title,
      subject: "Tiếng Anh",
      level: data.level,
      sbFileName: data.sbFileName,
      tbFileName: data.tbFileName,
      templateId: data.templateId,
      slideCount: 99,
      assetCount: 12,
      textPreview:
        "Cặp học liệu SB + TB đã được AI phân tích thành 12 assets và 99 slide bài giảng.",
      createdAt: "Vừa xong",
      author: "My Anh",
      status: "ready",
      accentColor:
        MOCK_TEMPLATES.find((t) => t.id === data.templateId)?.accentColor ||
        "#2563eb",
    };

    saveLessonProject(newProject);
    setProjects(getAllLessonProjects());
    setIsModalOpen(false);
    setSelectedDraft(null);
    navigate(`/project/${newProject.id}/overview`);
  };

  const getTemplateName = (templateId: string) =>
    MOCK_TEMPLATES.find((t) => t.id === templateId)?.name || templateId;

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-stone-50/70 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-30 h-14 border-b px-4 md:px-6 flex items-center justify-between bg-white/95 dark:bg-neutral-900/95 backdrop-blur shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">Book2Video</span>
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex bg-blue-50 text-blue-700 border-blue-200 text-[11px]"
          >
            Tiếng Anh · Slide bài giảng có lồng tiếng
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground hidden sm:inline">My Anh</span>
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
            M
          </div>
        </div>
      </header>

      <div className="max-w-[1120px] mx-auto p-6 w-full flex-1">
        {/* Hero / Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Bài giảng của tôi
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tải lên học liệu Tiếng Anh (.docx, .pdf, .txt, .md) → Chọn
              template → Duyệt Assets → Tạo Slide & Lồng tiếng Vbee
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedDraft(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tạo bài giảng mới
          </Button>
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên bài giảng hoặc file nguồn..."
              className="pl-9 bg-white dark:bg-neutral-900"
            />
          </div>
          <div className="flex items-center border rounded-lg bg-white dark:bg-neutral-900 p-0.5">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Project Grid / List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className="p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between bg-white dark:bg-neutral-900"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className="text-[11px] bg-blue-50/70 text-blue-700 border-blue-200"
                    >
                      {project.subject} · {project.level}
                    </Badge>
                    {project.status === "draft" ? (
                      <Badge variant="secondary" className="text-[11px]">
                        Đang tạo
                      </Badge>
                    ) : (
                      <Badge className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                        Sẵn sàng
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-semibold text-base line-clamp-2 mb-1.5">
                    {project.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                    {project.textPreview}
                  </p>
                </div>

                <div className="pt-3 border-t space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">
                        {project.sbFileName} + {project.tbFileName}
                      </span>
                    </span>
                    <span className="shrink-0">{project.createdAt}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      {getTemplateName(project.templateId)}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {project.slideCount} slides
                      </span>
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5" />
                        Vbee
                      </span>
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="border rounded-xl bg-white dark:bg-neutral-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-neutral-800/60 text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Bài giảng</th>
                  <th className="text-left py-3 px-4 font-medium">Học liệu gốc</th>
                  <th className="text-left py-3 px-4 font-medium">Template</th>
                  <th className="text-left py-3 px-4 font-medium">Slide</th>
                  <th className="text-left py-3 px-4 font-medium">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => handleProjectClick(project)}
                    className="hover:bg-slate-50 dark:hover:bg-neutral-800/40 cursor-pointer"
                  >
                    <td className="py-3 px-4 font-medium">{project.title}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {project.sbFileName} + {project.tbFileName}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {getTemplateName(project.templateId)}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {project.slideCount} slides
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {project.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredProjects.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Không tìm thấy bài giảng nào</p>
            <p className="text-sm mt-1">Thử thay đổi từ khóa tìm kiếm</p>
          </div>
        )}
      </div>

      <CreateLessonModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        draftProject={selectedDraft}
        onComplete={handleCreateComplete}
      />
    </div>
  );
}
