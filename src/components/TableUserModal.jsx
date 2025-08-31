"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Users, UserPlus, UserCheck } from "lucide-react";
import { useSUsers, useUpdateSUser } from "@/hooks/useUser";
import DraggableUser from "./DraggableUser";

export default function TableUserModal({
  isOpen,
  onClose,
  tableNumber,
  currentUsers = [],
  onUserAdd,
}) {
  const { data: users, isLoading } = useSUsers();
  const updateUserMutation = useUpdateSUser();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // wait 상태의 온라인 유저들만 필터링
  const waitUsers =
    users?.filter((user) => user.status === "wait" && user.is_online) || [];

  // 현재 테이블에 있는 유저들의 ID 목록
  const currentUserIds = currentUsers.map((user) => user.id);

  // 이미 테이블에 있는 유저는 제외
  const availableUsers = waitUsers.filter(
    (user) => !currentUserIds.includes(user.id)
  );

  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const handleUserSelect = (user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.find((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAddUsers = async () => {
    if (selectedUsers.length === 0) return;

    setIsSubmitting(true);
    try {
      // 선택된 모든 유저를 해당 테이블로 이동
      for (const user of selectedUsers) {
        await updateUserMutation.mutateAsync({
          id: user.id,
          data: {
            ...user,
            status: `g_${tableNumber}`,
          },
        });
      }

      // 부모 컴포넌트에 추가된 유저들 알림
      onUserAdd(selectedUsers);
      onClose();
    } catch (error) {
      console.error("Failed to add users to table:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-md border-0 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                테이블 {tableNumber}에 사용자 추가
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                대기 중인 사용자를 선택하여 테이블에 추가하세요
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
          >
            <X size={16} className="text-gray-500" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-2">
                추가할 수 있는 사용자가 없습니다
              </div>
              <div className="text-sm text-gray-400">
                대기 상태의 온라인 사용자가 없습니다
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 현재 테이블 사용자 */}
              {currentUsers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    현재 테이블 사용자 ({currentUsers.length}명)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentUsers.map((user) => (
                      <div
                        key={`current-${user.id}`}
                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                      >
                        {user.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 선택 가능한 사용자들 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  추가할 사용자 선택 ({selectedUsers.length}명 선택됨)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto scrollbar-hide">
                  {availableUsers.map((user) => {
                    const isSelected = selectedUsers.find(
                      (u) => u.id === user.id
                    );
                    return (
                      <div
                        key={`available-${user.id}`}
                        onClick={() => handleUserSelect(user)}
                        className={`cursor-pointer transition-all ${
                          isSelected ? "ring-2 ring-blue-500" : ""
                        }`}
                      >
                        <DraggableUser
                          user={user}
                          onClick={() => {}} // 빈 함수로 설정하여 이벤트 버블링 방지
                          className={`${
                            isSelected ? "bg-blue-50 border-blue-200" : ""
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border-gray-200 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  onClick={handleAddUsers}
                  className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting || selectedUsers.length === 0}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      추가 중...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus size={16} />
                      {selectedUsers.length}명 추가
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
