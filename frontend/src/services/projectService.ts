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

export async function createProject(data: CreateProjectData) {
  const response = await apiFetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
    method: "POST",
   headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
},
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create project");
  }

  return response.json();
}