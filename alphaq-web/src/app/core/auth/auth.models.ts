/** Mirrors the backend AuthDtos contract (com.alphaq.gaming.auth.dto). */
export interface OtpSentResponse {
  message: string;
  expiresInSeconds: number;
  /** Dev-only: the OTP, returned by the mock provider so the UI can auto-fill it. */
  devOtp?: string | null;
}

export interface UserSummary {
  id: number;
  username: string;
  mobile: string;
  email: string | null;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInMinutes: number;
  user: UserSummary;
}

export interface RegisterRequest {
  mobile: string; otp: string; username: string; password: string; email?: string | null;
}
export interface LoginRequest { identifier: string; password: string; }
export interface ResetPasswordRequest { mobile: string; otp: string; newPassword: string; }

export interface ApiError {
  timestamp: string; status: number; error: string; message: string;
  fieldErrors?: Record<string, string> | null;
}
