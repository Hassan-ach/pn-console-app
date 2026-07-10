import { api } from "./client";

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignupResponse {
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
};
