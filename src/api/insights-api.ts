import { api } from './client';

export type InsightType = 'TASK' | 'URGENCY' | 'INFO' | 'DECISION';

export const INSIGHT_TYPES: InsightType[] = ['TASK', 'URGENCY', 'INFO', 'DECISION'];

export interface InsightSummary {
  id: string;
  version: number;
  type: InsightType;
  content: string;
}

export interface InsightDetail extends InsightSummary {
  organizationId: string | null;
  envolopsRef: string[];
  broadcasted: boolean;
  latestVersionId?: string;
  createdAt: string;
  sourcePlugin: string | null;
  groupId: string | null;
  channelId: string | null;
  topicId: string | null;
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
