import { MOCK_LESSON_PROJECTS } from "@/mocks/mockBook2Video";
import type { LessonProject } from "@/types/lesson";

const LEGACY_STORAGE_KEY = "book2video_lesson_projects_v1";

// Xóa dữ liệu cũ trong localStorage để mỗi lần F5 đều reset về trạng thái ban đầu
try {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
} catch {
  // ignore
}

let sessionProjects: LessonProject[] = [];

export function getAllLessonProjects(): LessonProject[] {
  const customIds = new Set(sessionProjects.map((p) => p.id));
  const defaults = MOCK_LESSON_PROJECTS.filter((p) => !customIds.has(p.id));
  return [...sessionProjects, ...defaults];
}

export function saveLessonProject(project: LessonProject): void {
  sessionProjects = [
    project,
    ...sessionProjects.filter((p) => p.id !== project.id),
  ];
}

export function getLessonProject(projectId: string): LessonProject | undefined {
  return getAllLessonProjects().find((p) => p.id === projectId);
}
