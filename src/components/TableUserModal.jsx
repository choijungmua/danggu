"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Users, UserPlus, UserCheck, Play, Square } from "lucide-react";
import { useSUsers, useUpdateSUser } from "@/hooks/useUser";
import { getKoreanISOString } from "@/utils/timezoneUtils";
import DraggableUser from "./DraggableUser";

export default function TableUserModal({
  isOpen,
  onClose,
  tableNumber,
  currentUsers = [],
  onUserAdd,
  onProcessWaitlist,
}) {
  const { data: users, isLoading } = useSUsers();
  const updateUserMutation = useUpdateSUser();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 현재 테이블의 게임 상태 확인
  const isGameInProgress = currentUsers.some(user => user.status === `playing_${tableNumber}`);
  const hasPlayersReady = currentUsers.filter(user => user.status === `g_${tableNumber}`).length >= 2;

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
            status: `g_${tableNumber}`,
          },
        });
      }

      // 부모 컴포넌트에 추가된 유저들 알림
      onUserAdd(selectedUsers);
      onClose();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  // 게임 시작 함수 - 간단한 버전
  const handleStartGame = async () => {
    if (!hasPlayersReady) return;
    
    setIsSubmitting(true);
    try {
      const readyUsers = currentUsers.filter(user => user.status === `g_${tableNumber}`);
      
      // 현재 테이블에 있는 모든 사용자를 playing 상태로 변경하고 session_game_count 증가
      for (const user of readyUsers) {
        await updateUserMutation.mutateAsync({
          id: user.id,
          data: {
            status: `playing_${tableNumber}`,
            session_game_count: (user.session_game_count || 0) + 1, // 간단히 +1 증가
          },
        });
      }
      
      onClose();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  // 게임 종료 함수
  const handleEndGame = async () => {
    if (!isGameInProgress) return;
    
    setIsSubmitting(true);
    try {
      // 현재 게임 중인 모든 사용자를 대기 상태로 변경
      for (const user of currentUsers) {
        if (user.status === `playing_${tableNumber}`) {
          await updateUserMutation.mutateAsync({
            id: user.id,
            data: {
              status: "wait",
              game_started_at: null,
            },
          });
        }
      }
      
      // 게임 종료 후 대기열 처리
      if (onProcessWaitlist) {
        await onProcessWaitlist(tableNumber);
      }
      
      onClose();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[70] p-8 sm:p-12 overflow-visible">
      <Card className="w-full max-w-2xl max-h-[80vh] border border-zinc-200 overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-zinc-600 sm:size-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm sm:text-base font-medium text-zinc-900">
                테이블 {tableNumber}에 사용자 추가
              </CardTitle>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 leading-tight">
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

        <CardContent className="pt-6 flex-1 max-h-[60vh] overflow-visible">
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
            <div className="space-y-6 overflow-y-auto max-h-full">
              {/* 현재 테이블 사용자 */}
              {currentUsers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-zinc-700">
                      현재 테이블 사용자 ({currentUsers.length}명)
                    </h3>
                    <div className="flex items-center gap-2">
                      {isGameInProgress && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          게임 중
                        </div>
                      )}
                      {!isGameInProgress && hasPlayersReady && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                          <UserCheck size={12} />
                          게임 준비
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentUsers.map((user) => (
                      <div
                        key={`current-${user.id}`}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          user.status === `playing_${tableNumber}`
                            ? 'bg-green-100 text-green-700'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {user.name}
                        {user.status === `playing_${tableNumber}` && (
                          <span className="ml-1 text-xs">🎮</span>
                        )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-32 p-2">
                  {availableUsers.map((user) => {
                    const isSelected = selectedUsers.find(
                      (u) => u.id === user.id
                    );
                    return (
                      <div
                        key={`available-${user.id}`}
                        onClick={() => handleUserSelect(user)}
                        className={`rounded-lg p-2 cursor-pointer transition-all duration-150 overflow-visible ${
                          isSelected ? "bg-zinc-100" : "hover:bg-zinc-50/50"
                        }`}
                      >
                        <DraggableUser
                          user={user}
                          onClick={() => {}} // 빈 함수로 설정하여 이벤트 버블링 방지
                          className="border-0 !cursor-pointer"
                          isModalUser={true}
                          showWaitTime={true}
                          waitTimeDisplay={user.created_at ? `${Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60))}분` : ''}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 게임 제어 버튼 */}
              {currentUsers.length > 0 && (
                <div className="flex gap-2 pt-4 border-t border-zinc-100">
                  {isGameInProgress ? (
                    <Button
                      onClick={handleEndGame}
                      className="flex-1 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-300 border-t-white"></div>
                          종료 중...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Square size={16} />
                          게임 종료
                        </div>
                      )}
                    </Button>
                  ) : hasPlayersReady ? (
                    <Button
                      onClick={handleStartGame}
                      className="flex-1 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-300 border-t-white"></div>
                          시작 중...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Play size={16} />
                          게임 시작
                        </div>
                      )}
                    </Button>
                  ) : null}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="px-6 py-3 rounded-lg border-zinc-200 hover:bg-zinc-50 font-medium"
                    disabled={isSubmitting}
                  >
                    닫기
                  </Button>
                </div>
              )}

              {/* 사용자 추가 버튼 */}
              {!isGameInProgress && (
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
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
