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
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[70] p-4">
      <Card className="w-full max-w-2xl  border border-zinc-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-zinc-600" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-medium text-zinc-900 w-48">
                테이블 {tableNumber}에 사용자 추가
              </CardTitle>
              <p className="text-sm text-zinc-500 mt-0.5">
                대기 중인 사용자를 선택하여 테이블에 추가하세요
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 p-0 hover:bg-zinc-100 rounded-md flex-shrink-0"
          >
            <X size={16} className="text-zinc-500" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-200 border-t-zinc-600"></div>
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-zinc-600 mb-1 font-medium">
                추가할 수 있는 사용자가 없습니다
              </div>
              <div className="text-sm text-zinc-400">
                대기 상태의 온라인 사용자가 없습니다
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 현재 테이블 사용자 */}
              {currentUsers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-700 mb-3">
                    현재 테이블 사용자 ({currentUsers.length}명)
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {currentUsers.map((user) => (
                      <div
                        key={`current-${user.id}`}
                        className="px-3 py-2 bg-zinc-100 text-zinc-700 rounded-md text-sm font-medium"
                      >
                        {user.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 선택 가능한 사용자들 */}
              <div>
                <h3 className="text-sm font-medium text-zinc-700 mb-3 w-64">
                  추가할 사용자 선택 ({selectedUsers.length}명 선택됨)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 scrollbar-hide p-0.5">
                  {availableUsers.map((user) => {
                    const isSelected = selectedUsers.find(
                      (u) => u.id === user.id
                    );
                    return (
                      <div
                        key={`available-${user.id}`}
                        onClick={() => handleUserSelect(user)}
                        className={`rounded-lg p-2 cursor-pointer transition-all duration-150 ${
                          isSelected ? "bg-zinc-100" : "hover:bg-zinc-50/50"
                        }`}
                      >
                        <DraggableUser
                          user={user}
                          onClick={() => {}} // 빈 함수로 설정하여 이벤트 버블링 방지
                          className="border-0 !cursor-pointer"
                          isModalUser={true}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-lg border-zinc-200 hover:bg-zinc-50 font-medium"
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  onClick={handleAddUsers}
                  className="flex-1 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium"
                  disabled={isSubmitting || selectedUsers.length === 0}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-zinc-300 border-t-white"></div>
                      추가 중...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus size={16} />
                      {selectedUsers.length > 0 ? `${selectedUsers.length}명 ` : ''}추가
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
