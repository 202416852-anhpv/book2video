import { authFetch } from "./auth";

export interface ProjectSummary {
  id: string;
  name: string;
  type: string;
  createdAt: number;
  updatedAt: number;
  thumbnail: string | null;
}

export interface Project extends ProjectSummary {
  data: Record<string, any>;
}

// In-memory (RAM) project store only — resets completely on page reload / F5
const ramProjects: Map<string, Project> = new Map();

export async function listProjects(): Promise<ProjectSummary[]> {
  return Array.from(ramProjects.values()).map(({ data, ...summary }) => summary);
}

export async function createProject(name: string, type: string, data: Record<string, any> = {}): Promise<Project> {
  const newProj: Project = {
    id: "proj_" + Date.now(),
    name,
    type,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    thumbnail: null,
    data,
  };
  ramProjects.set(newProj.id, newProj);
  return newProj;
}

export async function getProject(id: string): Promise<Project> {
  const proj = ramProjects.get(id);
  if (proj) return proj;

  const defaultProj: Project = {
    id,
    name: "Dự án mới",
    type: "video",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    thumbnail: null,
    data: {},
  };
  ramProjects.set(id, defaultProj);
  return defaultProj;
}

export async function saveProject(id: string, data: Record<string, any>, thumbnail?: string | null): Promise<void> {
  const existing = ramProjects.get(id);
  if (existing) {
    existing.data = { ...existing.data, ...data };
    existing.updatedAt = Date.now();
    if (thumbnail !== undefined) existing.thumbnail = thumbnail;
    ramProjects.set(id, existing);
  }
}

export async function renameProject(id: string, name: string): Promise<void> {
  const existing = ramProjects.get(id);
  if (existing) {
    existing.name = name;
    existing.updatedAt = Date.now();
    ramProjects.set(id, existing);
  }
}

export async function deleteProject(id: string): Promise<void> {
  ramProjects.delete(id);
}
