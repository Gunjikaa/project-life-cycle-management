import { apiFetch } from "./api";
export interface CreateProjectData {
  projectId: string;
  projectName: string;
  objective: string;
  projectDirector: string;
  concernedLab: string;
  estimatedCost: string;
  startDate: string;
  completionDate: string;
  remarks: string;
}

interface CreatedProject {
  id: number;
}

export async function createProject(data: CreateProjectData) {
  return apiFetch<CreatedProject>("/api/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
