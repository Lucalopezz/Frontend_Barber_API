import { LoginForm } from "@/components/auth/loginForm";
import type { LoginData } from "./types/login.types";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";

export const Login = () => {
  const { login: loginContext } = useUser();
  const navigate = useNavigate();
  async function loginUser(elements: LoginData) {
    const confirm = await loginContext(elements);
    if (confirm) {
      navigate("/");
    }
  }

  return <LoginForm loading={false} onSubmit={loginUser} />;
};
