import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sUserApi } from "@/services/s_user";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { getKoreanISOString } from "@/utils/timezoneUtils";

// Get user counts
export const useSUserCounts = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.s_user_counts],
    queryFn: sUserApi.getCounts,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
};

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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.s_user_counts] });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.s_user_counts] });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.s_user_counts] });
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
        online_at: !isCurrentlyOnline ? getKoreanISOString() : null,
      };

      // 오프라인으로 전환할 때는 status를 "wait"로 변경하고 session_game_count를 0으로 리셋
      if (isCurrentlyOnline) {
        updateData.status = "wait";
        updateData.session_game_count = 0; // 오프라인 시 게임 카운트 리셋
      } else {
        // 온라인으로 전환할 때는 status를 "entrance"로 변경하고 online_count 증가
        updateData.status = "entrance";
        updateData.online_count = currentOnlineCount + 1;
        updateData.session_game_count = 0; // 온라인 시작 시에도 0으로 초기화
      }
      

      return sUserApi.update(userId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.s_users] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.s_user_counts] });
    },
  });
};

