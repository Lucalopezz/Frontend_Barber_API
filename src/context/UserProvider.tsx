import type { ReactNode } from "react";
import { UserContext } from "./UserContext";
import { useAuth } from "../hooks/useAuth";
import type { RegisterData } from "@/pages/auth/types/register.types";
import type { LoginData } from "@/pages/auth/types/login.types";

export interface UserContextType {
  authenticated: boolean;
  register: (data: RegisterData) => Promise<boolean>;
  login: (data: LoginData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  sessionError?: string;
  retrySession: () => Promise<void>;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { authenticated, register, login, logout, loading, sessionError, retrySession } = useAuth();

  return (
    <UserContext.Provider
      value={{ authenticated, register, login, logout, loading, sessionError, retrySession }}
    >
      {children}
    </UserContext.Provider>
  );
}
