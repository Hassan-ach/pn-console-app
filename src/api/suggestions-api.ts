import { api } from './client';

export type SuggestionActionType =
    | 'RECOMMENDATION'
    | 'RISK_MITIGATION'
    | 'NEXT_STEP'
    | 'REASSIGN'
    | 'ESCALATE'
    | 'DELEGATE'
    | 'DISMISS';

export type SuggestionStatus =
    'PENDING' | 'ACCEPTED' | 'DISMISSED' | 'COMPLETED';

export interface InsightSuggestion {
    id: string;
    insightId: string;
    organizationId: string | null;
    title: string;
    description: string;
    actionType: SuggestionActionType;
    reasoning: string | null;
    status: SuggestionStatus;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    insight?: {
        id: string;
        versions: Array<{
            content: string;
            type: string;
            priority?: number | null;
        }>;
    };
}

export const suggestionsApi = {
    getUserSuggestions: (
        status?: SuggestionStatus,
    ): Promise<InsightSuggestion[]> => {
        const query = status ? `?status=${status}` : '';
        return api.get<InsightSuggestion[]>(`/suggestions${query}`);
    },

    getInsightSuggestions: (
        insightId: string,
    ): Promise<InsightSuggestion[]> => {
        return api.get<InsightSuggestion[]>(
            `/suggestions/insight/${insightId}`,
        );
    },

    generateForInsight: (insightId: string): Promise<InsightSuggestion[]> => {
        return api.post<InsightSuggestion[]>(
            `/suggestions/generate/${insightId}`,
        );
    },

    updateStatus: (
        id: string,
        status: SuggestionStatus,
    ): Promise<InsightSuggestion> => {
        return api.patch<InsightSuggestion>(`/suggestions/${id}/status`, {
            status,
        });
    },
};
