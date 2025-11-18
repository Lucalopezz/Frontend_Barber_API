import api from "@/utils/api";
import { showToast } from "@/utils/toast";

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      api.defaults.headers.Authorization = "";

      showToast("Sessão expirada. Faça login novamente.", "error");

      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);