import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30초로 단축
      gcTime: 5 * 60 * 1000, // 5분으로 단축
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // 재연결시 refetch 활성화
      refetchOnMount: true, // 마운트시 refetch 활성화
      retry: 3, // 실패시 3번 재시도
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
