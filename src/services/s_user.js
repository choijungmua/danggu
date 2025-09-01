import apiClient from "@/lib/apiClient";

export const sUserApi = {
  // Get all s_user records
  getAll: async () => {
    try {
      const response = await apiClient.get(
        "/s_user?select=*&order=created_at.desc"
      );
      console.log("Fetched users:", response.data?.length || 0, "users");
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch users:", error);
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
    const updateData = {
      ...userData,
      updated_at: new Date().toISOString(),
    };

    console.log("API update called with:", { id, updateData });

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

      console.log("API update response:", response);

      // 응답에서 업데이트된 데이터 확인
      if (response.data && response.data.length > 0) {
        console.log("Updated data from response:", response.data[0]);
        return response.data[0];
      } else {
        // 응답이 없으면 업데이트 후 데이터를 다시 조회
        const verifyResponse = await apiClient.get(
          `/s_user?id=eq.${id}&select=*`
        );
        console.log("Verification data:", verifyResponse.data);

        if (verifyResponse.data && verifyResponse.data.length > 0) {
          return verifyResponse.data[0];
        } else {
          throw new Error("업데이트 후 데이터를 확인할 수 없습니다.");
        }
      }
    } catch (error) {
      console.error("Update user error:", error);

      // 네트워크 에러나 기타 에러 처리
      if (error.response?.status === 404) {
        throw new Error("사용자를 찾을 수 없습니다.");
      } else if (error.response?.status === 403) {
        throw new Error("권한이 없습니다.");
      } else if (error.response?.status === 400) {
        throw new Error("잘못된 요청입니다. 입력 데이터를 확인해주세요.");
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
};
