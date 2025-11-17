import { useContext } from "react";
import { Context } from "@/context/UserContext";

export function useUser() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}
