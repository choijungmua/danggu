import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  logUserAction,
  getUserHistory, 
  getUserSessionGameCount,
  getUserTotalGameCount,
  getAllUsersSessionGameCount
} from '@/services/s_user_history';

// 쿼리 키
export const USER_HISTORY_QUERY_KEYS = {
  all: ['user_history'],
  lists: () => [...USER_HISTORY_QUERY_KEYS.all, 'list'],
  list: (filters) => [...USER_HISTORY_QUERY_KEYS.lists(), { filters }],
  details: () => [...USER_HISTORY_QUERY_KEYS.all, 'detail'],
  detail: (userId) => [...USER_HISTORY_QUERY_KEYS.details(), userId],
  sessionGameCount: (userId) => [...USER_HISTORY_QUERY_KEYS.all, 'session_game_count', userId],
  totalGameCount: (userId) => [...USER_HISTORY_QUERY_KEYS.all, 'total_game_count', userId],
  allSessionGameCounts: () => [...USER_HISTORY_QUERY_KEYS.all, 'all_session_game_counts'],
};

// 사용자 히스토리 조회
export function useUserHistory(userId = null, limit = 50, offset = 0) {
  return useQuery({
    queryKey: USER_HISTORY_QUERY_KEYS.list({ userId, limit, offset }),
    queryFn: () => getUserHistory(userId, limit, offset),
    staleTime: 30000, // 30초
    refetchInterval: 60000, // 1분마다 갱신
  });
}

// 특정 사용자의 세션 게임 횟수 조회
export function useUserSessionGameCount(userId) {
  return useQuery({
    queryKey: USER_HISTORY_QUERY_KEYS.sessionGameCount(userId),
    queryFn: () => getUserSessionGameCount(userId),
    enabled: !!userId,
    staleTime: 10000, // 10초
    refetchInterval: 30000, // 30초마다 갱신
  });
}

// 특정 사용자의 총 게임 횟수 조회
export function useUserTotalGameCount(userId) {
  return useQuery({
    queryKey: USER_HISTORY_QUERY_KEYS.totalGameCount(userId),
    queryFn: () => getUserTotalGameCount(userId),
    enabled: !!userId,
    staleTime: 60000, // 1분
    refetchInterval: 120000, // 2분마다 갱신
  });
}

// 모든 사용자의 세션 게임 횟수 조회
export function useAllUsersSessionGameCount() {
  return useQuery({
    queryKey: USER_HISTORY_QUERY_KEYS.allSessionGameCounts(),
    queryFn: getAllUsersSessionGameCount,
    staleTime: 30000, // 30초
    refetchInterval: 60000, // 1분마다 갱신
  });
}

// 사용자 액션 로깅 mutation
export function useLogUserAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, action, previousStatus, newStatus, tableNumber, metadata }) =>
      logUserAction(userId, action, previousStatus, newStatus, tableNumber, metadata),
    onSuccess: (data, variables) => {
      // 관련 쿼리들을 무효화하여 최신 데이터로 갱신
      queryClient.invalidateQueries({ queryKey: USER_HISTORY_QUERY_KEYS.all });
      
      // 특정 사용자의 게임 카운트 쿼리 갱신
      if (variables.userId) {
        queryClient.invalidateQueries({ 
          queryKey: USER_HISTORY_QUERY_KEYS.sessionGameCount(variables.userId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: USER_HISTORY_QUERY_KEYS.totalGameCount(variables.userId) 
        });
      }
      
      // 전체 사용자 세션 게임 카운트 갱신
      queryClient.invalidateQueries({ 
        queryKey: USER_HISTORY_QUERY_KEYS.allSessionGameCounts() 
      });
    },
    onError: (error) => {
    },
  });
}