import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getTables, 
  getTable, 
  updateTable, 
  startGame, 
  endGame, 
  updateTablePlayers,
  updateGameDuration
} from '@/services/s_table';

// 쿼리 키
export const TABLE_QUERY_KEYS = {
  all: ['tables'],
  lists: () => [...TABLE_QUERY_KEYS.all, 'list'],
  list: (filters) => [...TABLE_QUERY_KEYS.lists(), { filters }],
  details: () => [...TABLE_QUERY_KEYS.all, 'detail'],
  detail: (id) => [...TABLE_QUERY_KEYS.details(), id],
};

// 모든 테이블 조회
export function useTables() {
  return useQuery({
    queryKey: TABLE_QUERY_KEYS.lists(),
    queryFn: getTables,
    staleTime: 30000, // 30초
    refetchInterval: 5000, // 5초마다 실시간 업데이트
  });
}

// 특정 테이블 조회
export function useTable(tableNumber) {
  return useQuery({
    queryKey: TABLE_QUERY_KEYS.detail(tableNumber),
    queryFn: () => getTable(tableNumber),
    enabled: !!tableNumber,
    staleTime: 30000,
    refetchInterval: 1000, // 1초마다 실시간 업데이트
  });
}

// 테이블 업데이트
export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableNumber, updates }) => updateTable(tableNumber, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TABLE_QUERY_KEYS.all });
      queryClient.setQueryData(TABLE_QUERY_KEYS.detail(variables.tableNumber), data);
    },
  });
}

// 게임 시작
export function useStartGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableNumber, playerIds }) => startGame(tableNumber, playerIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TABLE_QUERY_KEYS.all });
      queryClient.setQueryData(TABLE_QUERY_KEYS.detail(variables.tableNumber), data);
    },
  });
}

// 게임 종료
export function useEndGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tableNumber) => endGame(tableNumber),
    onSuccess: (data, tableNumber) => {
      queryClient.invalidateQueries({ queryKey: TABLE_QUERY_KEYS.all });
      queryClient.setQueryData(TABLE_QUERY_KEYS.detail(tableNumber), data);
    },
  });
}

// 테이블 플레이어 업데이트
export function useUpdateTablePlayers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableNumber, currentPlayers, waitingPlayers }) => 
      updateTablePlayers(tableNumber, currentPlayers, waitingPlayers),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TABLE_QUERY_KEYS.all });
      queryClient.setQueryData(TABLE_QUERY_KEYS.detail(variables.tableNumber), data);
    },
  });
}

// 게임 시간 업데이트
export function useUpdateGameDuration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableNumber, duration }) => updateGameDuration(tableNumber, duration),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(TABLE_QUERY_KEYS.detail(variables.tableNumber), data);
    },
  });
}