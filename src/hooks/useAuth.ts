import type { LoginData } from "@/pages/auth/types/login.types";
import type { RegisterData } from "@/pages/auth/types/register.types";
import api from "@/utils/api";
import { showToast } from "@/utils/toast";
import { useState } from "react";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";

type LoginToken = {
  accessToken: string;
};

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(
    () => !!localStorage.getItem("token"),
  );
  const queryClient = useQueryClient();
  const loading = false;

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
    queryClient.clear();
    localStorage.setItem("token", data.accessToken);
    api.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
    setAuthenticated(true);
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

  function logout() {
    setAuthenticated(false);
    localStorage.removeItem("token");
    api.defaults.headers.Authorization = "";
    queryClient.clear();
    showToast("Logout realizado com sucesso!");
  }

  return { authenticated, register, login, logout, loading };
}
