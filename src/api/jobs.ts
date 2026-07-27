import { api } from "./client";

export type JobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface Job {
  id: string;
  title: string;
  description: string;
  progressable: boolean;
  progress: number | null;
  message: string;
  status: JobStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const jobsApi = {
  list(status?: JobStatus) {
    const params = status ? `?status=${status}` : "";
    return api.get<Job[]>(`/jobs${params}`);
  },

  get(id: string) {
    return api.get<Job>(`/jobs/${id}`);
  },
};
