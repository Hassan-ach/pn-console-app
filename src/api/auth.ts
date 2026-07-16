import { api } from "./client";

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
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    providerType: string;
  };
}

export const authApi = {
  signup: (data: SignupPayload) =>
    api.post<SignupResponse>("/auth/signup", data),
  login: (data: LoginPayload) => api.post<LoginResponse>("/auth/login", data),
};
