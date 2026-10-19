import { getAuthState } from '@/auth/session';
import { isAxiosError } from 'axios';
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: (count, error) => getAuthState().status === 'authenticated' && !(isAxiosError(error) && error.response?.status === 401) && count < 3 } } });

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
