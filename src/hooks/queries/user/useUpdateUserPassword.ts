import { passwordChanged } from "@/auth/session";
import { useMutation } from "@tanstack/react-query";

import api from "@/utils/api";
import { showToast } from "@/utils/toast";
import type { UpdateUserPasswordData } from "@/components/user/updateUserPassword";

export const useUpdateUserPassword = (id?: string) => {
  return useMutation({
    mutationFn: async (userData: UpdateUserPasswordData) => {
    
      const { data } = await api.patch(`/users/${id}`, userData);

      return data.data;
    },
    onSuccess: () => passwordChanged(),
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });
};
