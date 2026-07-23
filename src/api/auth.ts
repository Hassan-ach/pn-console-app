import { api } from './client';

export interface SignupPayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface SignupResponse {
    access_token: string;
    is_new_user: boolean;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        providerType: string;
    };
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    is_new_user: boolean;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        providerType: string;
    };
}

export interface LogoutResponse {
    message: string;
}

export interface ForgotPasswordPayload {
    email: string;
}

export interface ForgotPasswordResponse {
    message: string;
}

export interface ResetPasswordPayload {
    token: string;
    password: string;
}

export interface ResetPasswordResponse {
    access_token: string;
    message: string;
}

export interface PendingResetResponse {
    token: string | null;
}

export const authApi = {
    signup: (data: SignupPayload) =>
        api.post<SignupResponse>('/auth/signup', data),
    login: (data: LoginPayload) => api.post<LoginResponse>('/auth/login', data),
    logout: () => api.post<LogoutResponse>('/auth/logout'),
    forgotPassword: (data: ForgotPasswordPayload) =>
        api.post<ForgotPasswordResponse>('/auth/forgot-password', data),
    resetPassword: (data: ResetPasswordPayload) =>
        api.post<ResetPasswordResponse>('/auth/reset-password', data),
    getPendingReset: (email: string) =>
        api.get<PendingResetResponse>(
            `/auth/pending-reset?email=${encodeURIComponent(email)}`,
        ),
};
