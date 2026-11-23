import { MOCK_LESSON_PROJECTS } from "@/mocks/mockBook2Video";
import type { LessonProject } from "@/types/lesson";

const STORAGE_KEY = "book2video_lesson_projects_v1";

function loadCustomProjects(): LessonProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getAllLessonProjects(): LessonProject[] {
  const custom = loadCustomProjects();
  const customIds = new Set(custom.map((p) => p.id));
  const defaults = MOCK_LESSON_PROJECTS.filter((p) => !customIds.has(p.id));
  return [...custom, ...defaults];
}

export function saveLessonProject(project: LessonProject): void {
  const custom = loadCustomProjects().filter((p) => p.id !== project.id);
  const next = [project, ...custom];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export function getLessonProject(projectId: string): LessonProject | undefined {
  return getAllLessonProjects().find((p) => p.id === projectId);
}
