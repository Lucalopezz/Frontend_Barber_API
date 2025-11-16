import { LoginForm } from "@/components/auth/loginForm";
import type { LoginData } from "./types/login.types";

function teste(elements: LoginData) {
  console.log(elements);
  // need to be implemented
}

export const Login = () => {
  return <LoginForm loading={false} onSubmit={teste} />;
};
