import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiGet, apiPost, getToken, setToken, clearToken } from "./api";

export type Role = "customer" | "admin";

export interface AppUser {
  id: number;
  uid: string; // string alias of id (kept for existing call sites)
  phone: string; // canonical digits
  name: string;
  email: string | null;
  role: Role;
  rewardPoints: number;
}

export type Profile = AppUser;

interface AuthState {
  user: AppUser | null;
  profile: AppUser | null;
  phone: string | null;
  loading: boolean;
  configured: boolean; // always true now (self-hosted backend)
  isAdmin: boolean;
  register: (input: { phone: string; name: string; password: string; email?: string }) => Promise<void>;
  login: (input: { phone: string; password: string }) => Promise<void>;
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
  register: async () => {},
  login: async () => {},
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function register(input: {
    phone: string;
    name: string;
    password: string;
    email?: string;
  }) {
    const { token, user } = await apiPost<{ token: string; user: AppUser }>(
      "/auth/register",
      input,
    );
    setToken(token);
    setUser(user);
  }

  async function login(input: { phone: string; password: string }) {
    const { token, user } = await apiPost<{ token: string; user: AppUser }>(
      "/auth/login",
      input,
    );
    setToken(token);
    setUser(user);
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
