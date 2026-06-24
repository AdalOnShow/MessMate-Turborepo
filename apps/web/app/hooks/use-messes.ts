"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMess, getMyMess, type MessInfo } from "../actions/messes";

export function useGetMyMess(enabled = true) {
  return useQuery({
    queryKey: ["my-mess"],
    queryFn: async () => {
      const result = await getMyMess();
      return result.data;
    },
    enabled,
  });
}

export function useCreateMess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const result = await createMess(payload);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-mess"] });
    },
  });
}

export { type MessInfo };
