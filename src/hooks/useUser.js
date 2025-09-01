import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sUserApi } from "@/services/s_user";
import { QUERY_KEYS } from "@/constants/queryKeys";

// Get all s_users
export const useSUsers = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.s_users],
    queryFn: sUserApi.getAll,
    refetchOnMount: true, // 항상 마운트시 최신 데이터 가져오기
    refetchOnWindowFocus: true, // 포커스시에도 refetch
    staleTime: 0, // 항상 fresh 데이터 요청
  });
};

// Get s_user by id
export const useSUser = (id) => {
  return useQuery({
    queryKey: [QUERY_KEYS.s_user, id],
    queryFn: () => sUserApi.getById(id),
    enabled: !!id,
  });
};

// Create s_user mutation
export const useCreateSUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sUserApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.s_users] });
    },
  });
};

// Update s_user mutation
export const useUpdateSUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => sUserApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.s_users] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.s_user, variables.id],
      });
    },
  });
};

// Delete s_user mutation
export const useDeleteSUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sUserApi.delete,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.s_users] });
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.s_user, id] });
    },
  });
};

// Toggle user online status mutation
export const useToggleUserOnline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isCurrentlyOnline, currentOnlineCount = 0 }) => {
      const updateData = {
        is_online: !isCurrentlyOnline,
        online_at: !isCurrentlyOnline ? new Date().toISOString() : null,
      };

      // 오프라인으로 전환할 때만 status를 "wait"로 변경
      if (isCurrentlyOnline) {
        updateData.status = "wait";
      } else {
        // 온라인으로 전환할 때 online_count 증가
        updateData.online_count = currentOnlineCount + 1;
      }

      return sUserApi.update(userId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.s_users] });
    },
  });
};
