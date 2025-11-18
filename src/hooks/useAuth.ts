import type { LoginData } from "@/pages/auth/types/login.types";
import type { RegisterData } from "@/pages/auth/types/register.types";
import api from "@/utils/api";
import { showToast } from "@/utils/toast";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";

type LoginToken = {
  accessToken: string;
};

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthenticated(true);
    }
  }, []);

  async function register(data: RegisterData) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...userData } = data;
    try {
      await api.post("/users", userData);
      showToast("Conta criada com sucesso! Faça o login para continuar");
      return true;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        const message = error.response.data.message;
        showToast(message, "error");
      } else {
        showToast("Erro inesperado", "error");
      }
      return false;
    }
  }

  async function authUser(data: LoginToken) {
    setAuthenticated(true);
    localStorage.setItem("token", JSON.stringify(data.accessToken));
  }

  async function login(loginData: LoginData) {
    try {
      const response = await api.post("/users/login", loginData);

      showToast("Login realizado com sucesso!");
      await authUser(response.data);
      return true;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        const message = error.response.data.message;
        showToast(message, "error");
      } else {
        showToast("Erro inesperado", "error");
      }
      return false;
    }
  }

  return { authenticated, register, login, authUser };
}
