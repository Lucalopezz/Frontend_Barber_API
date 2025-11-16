import { RegisterForm } from "@/components/auth/registerForm";
import type { LoginData } from "./types/login.types";

function teste(elements: LoginData) {
  console.log(elements);
  // need to be implemented
}

export const Register = () => {
  return <RegisterForm loading={false} onSubmit={teste} />;
};
