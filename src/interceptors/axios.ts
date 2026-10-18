import api from "@/utils/api";
import type { AxiosError } from "axios";

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const token = localStorage.getItem("token");
    const requestAuthorization = error.config?.headers.get("Authorization");
    const isLoginRequest = error.config?.url === "/users/login";

    if (
      error.response?.status === 401 &&
      token &&
      requestAuthorization === `Bearer ${token}` &&
      !isLoginRequest
    ) {
      localStorage.removeItem("token");
      api.defaults.headers.Authorization = "";
      sessionStorage.setItem("sessionExpired", "true");
      window.location.replace("/login");
    }
    return Promise.reject(error);
  },
);
