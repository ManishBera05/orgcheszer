// --- START OF FILE src/api/auth.ts ---
import api from "./axios";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  VerifyOtpRequest,
  InitiateResponse,
} from "../types";

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/api/auth/login", data);
  return res.data;
}

// 1. Initiate Registration (Sends OTP)
export async function initiateRegistration(
  data: RegisterRequest,
): Promise<InitiateResponse> {
  const res = await api.post<InitiateResponse>(
    "/api/auth/register/initiate",
    data,
  );
  return res.data;
}

// 2. Verify OTP (Returns Token)
export async function verifyRegistration(
  data: VerifyOtpRequest,
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/api/auth/register/verify", data);
  return res.data;
}
// --- END OF FILE src/api/auth.ts ---
