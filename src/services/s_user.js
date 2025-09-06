import apiClient from "@/lib/apiClient";
import { getKoreanISOString } from "@/utils/timezoneUtils";
import { supabase } from "@/lib/supabase";

export const sUserApi = {
  // Get user counts
  getCounts: async () => {
    try {
      const [totalResponse, onlineResponse, offlineResponse] = await Promise.all([
        apiClient.get("/s_user?select=count"),
        apiClient.get("/s_user?select=count&is_online=eq.true"),
        apiClient.get("/s_user?select=count&is_online=eq.false")
      ]);
      
      return {
        total: totalResponse.data[0]?.count || 0,
        online: onlineResponse.data[0]?.count || 0,
        offline: offlineResponse.data[0]?.count || 0
      };
    } catch (error) {
      console.error('s_user API - count error:', error);
      return { total: 0, online: 0, offline: 0 };
    }
  },

  // Get all s_user records
  getAll: async () => {
    try {
      const response = await apiClient.get(
        "/s_user?select=*&order=created_at.desc"
      );

      return response.data || [];
    } catch (error) {
      console.error('s_user API - error:', error);
      throw error;
    }
  },

  // Get s_user by id
  getById: async (id) => {
    const response = await apiClient.get(`/s_user?id=eq.${id}&select=*`);
    return response.data[0];
  },

  // Create new s_user
  create: async (userData) => {
    const response = await apiClient.post("/s_user", userData, {
      headers: {
        Prefer: "return=representation",
      },
    });
    return response.data[0];
  },

  // Update s_user
  update: async (id, userData) => {
    // ID 검증
    if (!id) {
      throw new Error("사용자 ID가 필요합니다.");
    }

    // userData 검증
    if (!userData || typeof userData !== 'object') {
      throw new Error("업데이트할 데이터가 필요합니다.");
    }

    // 허용된 필드들만 포함 (보안)
    const allowedFields = ['name', 'status', 'is_online', 'online_at', 'online_count', 'session_game_count'];
    const filteredData = {};
    
    Object.keys(userData).forEach(key => {
      if (allowedFields.includes(key) && userData[key] !== undefined) {
        filteredData[key] = userData[key];
      }
    });

    const updateData = {
      ...filteredData,
      updated_at: getKoreanISOString(),
    };


    try {
      // PATCH 요청 실행 (return=representation으로 업데이트된 데이터 반환)
      const response = await apiClient.patch(
        `/s_user?id=eq.${id}`,
        updateData,
        {
          headers: {
            Prefer: "return=representation",
          },
        }
      );


      // 응답에서 업데이트된 데이터 확인
      if (response.data && response.data.length > 0) {
        return response.data[0];
      } else {
        // 응답이 없으면 업데이트 후 데이터를 다시 조회
        const verifyResponse = await apiClient.get(
          `/s_user?id=eq.${id}&select=*`
        );

        if (verifyResponse.data && verifyResponse.data.length > 0) {
          return verifyResponse.data[0];
        } else {
          throw new Error("업데이트 후 데이터를 확인할 수 없습니다.");
        }
      }
    } catch (error) {

      // 네트워크 에러나 기타 에러 처리
      if (error.response?.status === 404) {
        throw new Error("사용자를 찾을 수 없습니다.");
      } else if (error.response?.status === 403) {
        throw new Error("권한이 없습니다.");
      } else if (error.response?.status === 400) {
        const errorDetail = error.response?.data?.details || error.response?.data?.message || error.response?.data;
        throw new Error(`잘못된 요청입니다. 세부 정보: ${JSON.stringify(errorDetail)}`);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("사용자 정보 업데이트에 실패했습니다.");
      }
    }
  },

  // Delete s_user
  delete: async (id) => {
    await apiClient.delete(`/s_user?id=eq.${id}`);
    return { id };
  },

  // Set all online users to offline and end all games
  setAllOffline: async () => {
    try {

      // 1. 먼저 모든 테이블의 게임을 종료
      try {
        const { endAllGames } = await import("./s_table");
        await endAllGames();
      } catch (tableError) {
        // 테이블 게임 종료 실패해도 계속 진행
      }

      // 2. 한 번에 모든 온라인 유저를 오프라인으로 변경
      const updateData = {
        is_online: false,
        online_at: null,
        status: 'wait', // 오프라인 상태는 wait
        session_game_count: 0, // 세션 게임 카운트도 리셋
        updated_at: getKoreanISOString(),
      };

      const { data: updatedUsers, error: updateError } = await supabase
        .from('s_user')
        .update(updateData)
        .eq('is_online', true) // 온라인 상태인 모든 유저
        .select();

      if (updateError) {
        throw updateError;
      }

      return updatedUsers || [];
    } catch (error) {
      throw error;
    }
  },
};
