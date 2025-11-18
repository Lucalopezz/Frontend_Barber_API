import { RegisterForm } from "@/components/auth/registerForm";

import type { RegisterData } from "./types/register.types";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";

export const Register = () => {
  const { register: registerContext } = useUser();
  const navigate = useNavigate();

  async function registerUser(elements: RegisterData) {
    const confirm = await registerContext(elements);
    if (confirm) {
      navigate("/login");
    }
  }

  return <RegisterForm loading={false} onSubmit={registerUser} />;
};
