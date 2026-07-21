import { api } from './client';

export type InsightType = 'TASK' | 'URGENCY' | 'INFO' | 'DECISION';

export type InsightActionStatus = 'PENDING' | 'NOTED' | 'DONE' | 'BLOCKED' | 'IN_REVIEW' | 'DECIDED' | 'DELEGATED' | 'DELAYED' | 'HIDDEN';

export const INSIGHT_TYPES: InsightType[] = ['TASK', 'URGENCY', 'INFO', 'DECISION'];

export const VALID_ACTIONS: Record<InsightType, InsightActionStatus[]> = {
  INFO: ['NOTED'],
  TASK: ['DONE', 'BLOCKED', 'IN_REVIEW'],
  DECISION: ['DECIDED', 'DELEGATED', 'DELAYED'],
  URGENCY: ['HIDDEN'],
};

export const STATUS_LABELS: Record<InsightActionStatus, string> = {
  PENDING: 'Pending',
  NOTED: 'Noted',
  DONE: 'Done',
  BLOCKED: 'Blocked',
  IN_REVIEW: 'In Review',
  DECIDED: 'Decided',
  DELEGATED: 'Delegated',
  DELAYED: 'Delayed',
  HIDDEN: 'Hidden',
};

export const STATUS_COLORS: Record<InsightActionStatus, string> = {
  PENDING: 'bg-stone-100 text-stone-600',
  NOTED: 'bg-blue-50 text-blue-700',
  DONE: 'bg-emerald-50 text-emerald-700',
  BLOCKED: 'bg-red-50 text-red-700',
  IN_REVIEW: 'bg-amber-50 text-amber-700',
  DECIDED: 'bg-purple-50 text-purple-700',
  DELEGATED: 'bg-indigo-50 text-indigo-700',
  DELAYED: 'bg-orange-50 text-orange-700',
  HIDDEN: 'bg-stone-200 text-stone-500',
};

export interface InsightSummary {
  id: string;
  version: number;
  type: InsightType;
  content: string;
  status: InsightActionStatus;
}

export interface InsightDetail extends InsightSummary {
  organizationId: string | null;
  envolopsRef: string[];
  broadcasted: boolean;
  latestVersionId?: string;
  createdAt: string;
  sourcePlugin: string | null;
}

export interface SourceEnvelope {
  envolopId: string;
  sourcePlugin: string;
  occurredAt: string;
  content: string;
}

export const insightsApi = {
  list(type?: InsightType) {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    return api.get<InsightSummary[]>(`/insights${query}`);
  },

  get(id: string) {
    return api.get<InsightDetail>(`/insights/${id}`);
  },

  setAction(id: string, action: InsightActionStatus) {
    return api.patch<InsightDetail>(`/insights/${id}?action=${encodeURIComponent(action)}`);
  },

  listVersions(id: string) {
    return api.get<InsightSummary[]>(`/insights/${id}/versions`);
  },

  getVersion(id: string, versionId: string) {
    return api.get<InsightDetail>(`/insights/${id}/versions/${versionId}`);
  },

  getSourceEnvelopes(insightId: string, versionId: string) {
    return api.get<SourceEnvelope[]>(`/insights/${insightId}/versions/${versionId}/envelope-refs`);
  },
};
