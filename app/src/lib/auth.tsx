import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiGet, apiPost, getToken, setToken, clearToken } from "./api";

export type Role = "customer" | "admin" | "staff";

export interface AppUser {
  id: number;
  uid: string; // string alias of id (kept for existing call sites)
  phone: string; // canonical digits
  name: string;
  email: string | null;
  role: Role;
  rewardPoints: number;
  blocked?: boolean;
  emailVerified?: boolean;
  emailVerifiedAt?: number | null;
  createdAt?: number;
}

export type Profile = AppUser;

export interface RegisterResult {
  ok?: boolean;
  token?: string;
  user?: AppUser;
  requiresVerification?: boolean;
  email: string;
  registrationToken?: string;
  message?: string;
}

interface AuthState {
  user: AppUser | null;
  profile: AppUser | null;
  phone: string | null;
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  register: (input: {
    phone: string;
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }) => Promise<RegisterResult>;
  login: (input: {
    identifier?: string;
    phone?: string;
    email?: string;
    password: string;
  }) => Promise<{ token?: string; user?: AppUser; requiresVerification?: boolean; email?: string } | void>;
  verifyEmail: (input: {
    email: string;
    otp: string;
    registrationToken?: string | null;
  }) => Promise<{ ok: boolean; message: string; user?: AppUser; token?: string }>;
  resendVerificationOtp: (email: string) => Promise<{ ok: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  verifyResetOtp: (input: {
    email: string;
    otp: string;
  }) => Promise<{ ok: boolean; resetToken: string; message?: string }>;
  resetPassword: (input: {
    email: string;
    resetToken?: string;
    otp?: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  phone: null,
  loading: true,
  configured: true,
  isAdmin: false,
  register: async () => ({ token: "", user: {} as AppUser, email: "" }),
  login: async () => {},
  verifyEmail: async () => ({ ok: false, message: "" }),
  resendVerificationOtp: async () => ({ ok: false, message: "" }),
  forgotPassword: async () => ({ message: "" }),
  verifyResetOtp: async () => ({ ok: false, resetToken: "" }),
  resetPassword: async () => ({ ok: false, message: "" }),
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user } = await apiGet<{ user: AppUser }>("/auth/me");
      setUser(user);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function register(input: {
    phone: string;
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }): Promise<RegisterResult> {
    const res = await apiPost<RegisterResult>("/auth/register", input);
    // DO NOT set token or user here! Account is pending OTP verification.
    return res;
  }

  async function login(input: {
    identifier?: string;
    phone?: string;
    email?: string;
    password: string;
  }) {
    const res = await apiPost<{ token?: string; user?: AppUser; requiresVerification?: boolean; email?: string }>(
      "/auth/login",
      input,
    );
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  }

  async function verifyEmail(input: { email: string; otp: string; registrationToken?: string | null }) {
    const res = await apiPost<{ ok: boolean; message: string; user?: AppUser; token?: string }>(
      "/auth/verify-email",
      input,
    );
    if (res.token) {
      setToken(res.token);
    }
    if (res.user) {
      setUser(res.user);
    }
    return res;
  }

  async function resendVerificationOtp(email: string) {
    return apiPost<{ ok: boolean; message: string }>("/auth/resend-verification-otp", {
      email,
    });
  }

  async function forgotPassword(email: string) {
    return apiPost<{ message: string }>("/auth/forgot-password", { email });
  }

  async function verifyResetOtp(input: { email: string; otp: string }) {
    return apiPost<{ ok: boolean; resetToken: string; message?: string }>(
      "/auth/verify-reset-otp",
      input,
    );
  }

  async function resetPassword(input: {
    email: string;
    resetToken?: string;
    otp?: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return apiPost<{ ok: boolean; message: string }>("/auth/reset-password", input);
  }

  async function signOut() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user,
        phone: user?.phone ?? null,
        loading,
        configured: true,
        isAdmin: user?.role === "admin",
        register,
        login,
        verifyEmail,
        resendVerificationOtp,
        forgotPassword,
        verifyResetOtp,
        resetPassword,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
