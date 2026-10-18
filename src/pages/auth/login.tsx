import { AuthLayout } from "@/components/layout/AuthLayout";
import { LoginForm } from "@/components/auth/loginForm";
import type { LoginData } from "./types/login.types";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export const Login = () => {
  const { login: loginContext } = useUser();
  const navigate = useNavigate();
  const [sessionExpired] = useState(
    () => sessionStorage.getItem("sessionExpired") === "true",
  );

  useEffect(() => {
    sessionStorage.removeItem("sessionExpired");
  }, []);

  async function loginUser(elements: LoginData) {
    const confirm = await loginContext(elements);
    if (confirm) {
      navigate("/");
    }
  }

  return (
    <AuthLayout>
      <LoginForm sessionExpired={sessionExpired} onSubmit={loginUser} />
    </AuthLayout>
  );
};
