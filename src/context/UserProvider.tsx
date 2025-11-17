import type { ReactNode } from "react";
import { Context } from "./UserContext";
import { useAuth } from "../hooks/useAuth";
import type { RegisterData } from "@/pages/auth/types/register.types";

export interface UserContextType {
  authenticated: boolean;
  register: (data: RegisterData) => void;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { authenticated, register } = useAuth();

  return (
    <Context.Provider value={{ authenticated, register }}>
      {children}
    </Context.Provider>
  );
}
