import { api } from './client';

/**
 * Insights API
 * Wraps:
 *  - GET /api/insights
 *  - GET /api/insights/:id
 *  - GET /api/insights/:id/versions
 *  - GET /api/insights/:id/versions/:versionId
 */

export type InsightType = 'TASK' | 'URGENCY' | 'INFO' | 'DECISION';

export const INSIGHT_TYPES: InsightType[] = ['TASK', 'URGENCY', 'INFO', 'DECISION'];

/** Shape returned by the list endpoint and the versions-list endpoint */
export interface InsightSummary {
  id: string;
  version: number;
  type: InsightType;
  content: string;
}

/** Shape returned by the single-insight and single-version endpoints */
export interface InsightDetail extends InsightSummary {
  organizationId: string | null;
  envolopsRef: string[];
  broadcasted: boolean;
  createdAt: string;
  sourcePlugin: string | null;
  groupId: string | null;
  channelId: string | null;
  topicId: string | null;
}

export const insightsApi = {
  /** GET /api/insights?type=... — omit `type` to fetch every insight */
  list(type?: InsightType) {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    return api.get<InsightSummary[]>(`/insights${query}`);
  },

  /** GET /api/insights/:id — latest version, full details */
  get(id: string) {
    return api.get<InsightDetail>(`/insights/${id}`);
  },

  /** GET /api/insights/:id/versions — every version, oldest to newest, lightweight */
  listVersions(id: string) {
    return api.get<InsightSummary[]>(`/insights/${id}/versions`);
  },

  /** GET /api/insights/:id/versions/:versionId — one version, full details */
  getVersion(id: string, versionId: string) {
    return api.get<InsightDetail>(`/insights/${id}/versions/${versionId}`);
  },
};
