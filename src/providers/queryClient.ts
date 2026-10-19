import { getAuthState } from "@/auth/session";
import { isAxiosError } from "axios";
import { MutationCache, QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 403) {
        void queryClient.invalidateQueries({ queryKey: ["user"] });
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (count, error) => getAuthState().status === "authenticated" &&
        !(isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) && count < 3,
    },
  },
});
