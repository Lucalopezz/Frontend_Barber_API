import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { User } from "@/types/user.type";
import api from "@/utils/api";
import type { UpdateUserData } from "@/components/user/updateUserForm";
import { showToast } from "@/utils/toast";

export const useUpdateUser = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: UpdateUserData) => {
      const token = localStorage.getItem("token");

      const { data } = await api.put(`/users/${id}`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return data.data;
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(["user"], updatedUser);
    },
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });
};
