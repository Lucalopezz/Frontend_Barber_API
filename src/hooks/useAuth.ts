import type { RegisterData } from "@/pages/auth/types/register.types";
import api from "@/utils/api";
import { useState } from "react";

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);

  async function register(data: RegisterData) {
    const { confirmPassword, ...userData } = data;
    try {
      const user = await api.post("/users", userData);
      console.log(user);
    } catch (error) {
      console.error(error);
    }
  }

  return { authenticated, register };
}
