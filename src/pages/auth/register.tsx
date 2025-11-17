import { RegisterForm } from "@/components/auth/registerForm";

import type { RegisterData } from "./types/register.types";
import { useUser } from "@/hooks/useUser";

export const Register = () => {
  const { register: registerContext } = useUser();

  function registerUser(elements: RegisterData) {
    registerContext(elements);
  }

  return <RegisterForm loading={false} onSubmit={registerUser} />;
};
