"use client";

import { useState, useEffect, useOptimistic, useMemo, startTransition } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndContext, useDroppable } from '@dnd-kit/core';
import { useSUsers, useUpdateSUser, useToggleUserOnline } from "@/hooks/useUser";
import { useTables, useStartGame, useEndGame, useUpdateTablePlayers } from "@/hooks/useTable";
import { useLogUserAction } from "@/hooks/useUserHistory";
import { USER_ACTIONS } from "@/services/s_user_history";
import { useIsMobile } from "@/hooks/useIsMobile";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import NotFound from "@/components/NotFound";
import UserManagementDrawer from "@/components/UserManagementDrawer";
import DraggableUser from "@/components/DraggableUser";
import DroppableTable from "@/components/DroppableTable";
import TableUserModal from "@/components/TableUserModal";
import {
  getOnlineUsersSorted,
  getUserTableStatusLabel,
  getUserTableStatusBadgeClass,
  getWaitUsers,
  getOutingUsers,
} from "@/utils/userUtils";
import { getWaitTimeDisplay } from "@/utils/dateUtils";
import { getKoreanISOString } from "@/utils/timezoneUtils";
import { useAuthStore } from "@/stores/authStore";


// 전체 페이지를 드롭 가능하게 만드는 컴포넌트 - 좌측 영역 제외
function DroppablePage({ children, onUserDropOutside }) {
  const [{ isOver }, drop] = useDrop({
    accept: "USER",
    drop: (item, monitor) => {
      // 다른 드롭 타겟에 이미 드롭되지 않은 경우에만 처리
      const dropResult = monitor.getDropResult();
      if (!dropResult) {
        onUserDropOutside(item.user);
        return { dropped: true };
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  });

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* 메인 콘텐츠 영역만 드롭 가능 - 좌측 사이드바 제외 */}
      <div className="min-h-screen relative">
        <div
          ref={drop}
          className={`min-h-screen transition-colors relative z-10 ${
            isOver ? "bg-red-50" : ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// dnd-kit용 드롭 영역 컴포넌트
function DndKitDroppable({ children, id, onDrop }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-screen transition-colors relative z-10 ${
        isOver ? "bg-green-50" : ""
      }`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const { data: users, isLoading, error } = useSUsers();
  const { data: tables, isLoading: tablesLoading } = useTables();
  const updateUserMutation = useUpdateSUser();
  const toggleOnlineMutation = useToggleUserOnline();
  const startGameMutation = useStartGame();
  const endGameMutation = useEndGame();
  const logUserActionMutation = useLogUserAction();
  const isMobile = useIsMobile();

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentTime, setCurrentTime] = useState(null);
  
  // 모바일 클릭 모드 상태
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const { user: authUser } = useAuthStore();

  // 낙관적 업데이트를 위한 상태
  const [optimisticUsers, updateOptimisticUsers] = useOptimistic(
    users || [],
    (currentUsers, optimisticUpdate) => {
      return currentUsers.map(user => 
        user.id === optimisticUpdate.userId 
          ? { ...user, ...optimisticUpdate.changes }
          : user
      );
    }
  );

  // 대기 상태와 외출 상태의 온라인 유저들 필터링 (낙관적 업데이트된 데이터 사용)
  const waitUsers = getWaitUsers(optimisticUsers);
  const outingUsers = getOutingUsers(optimisticUsers);

  // 실시간 업데이트를 위한 타이머
  useEffect(() => {
    // 클라이언트에서만 초기 시간 설정
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(timer);
  }, []);

  // 테이블 할당 상태를 메모이제이션하여 계산
  const tableAssignments = useMemo(() => {
    if (!optimisticUsers || optimisticUsers.length === 0) {
      return {};
    }
    
    const assignments = {};
    optimisticUsers.forEach((user) => {
      let tableNumber = null;
      
      // status가 g_1, g_2, g_3, ... 형태인 경우 (준비 상태)
      if (user.status && user.status.startsWith("g_")) {
        tableNumber = parseInt(user.status.substring(2));
      }
      // status가 playing_1, playing_2, ... 형태인 경우 (게임 중)
      else if (user.status && user.status.startsWith("playing_")) {
        tableNumber = parseInt(user.status.substring(8));
      }
      
      if (tableNumber >= 1 && tableNumber <= 8) {
        if (!assignments[tableNumber]) {
          assignments[tableNumber] = [];
        }
        assignments[tableNumber].push(user);
      }
    });
    return assignments;
  }, [optimisticUsers]);

  // 모바일: 사용자 선택/해제, 데스크톱: 오프라인으로 변경
  const handleUserClick = async (user) => {
    if (isMobile) {
      // 모바일에서는 사용자 선택 모드
      if (selectedUser?.id === user.id) {
        // 같은 사용자 클릭 시 선택 해제
        setSelectedUser(null);
        setIsSelectionMode(false);
      } else {
        // 다른 사용자 클릭 시 선택
        setSelectedUser(user);
        setIsSelectionMode(true);
      }
    } else {
      // 데스크톱에서는 기존 로직 (오프라인으로 변경)
      if (user.status === 'wait') {
        try {
          const wasOnline = user.is_online;
          await toggleOnlineMutation.mutateAsync({
            userId: user.id,
            isCurrentlyOnline: user.is_online,
            currentOnlineCount: user.online_count || 0,
          });
          
          // 온라인/오프라인 상태 변경 히스토리 로깅
          await logUserActionMutation.mutateAsync({
            userId: user.id,
            action: wasOnline ? USER_ACTIONS.OFFLINE : USER_ACTIONS.ONLINE,
            previousStatus: user.status,
            newStatus: wasOnline ? "wait" : "entrance",
            metadata: {
              timestamp: getKoreanISOString(),
              was_online: wasOnline,
              online_count: wasOnline ? user.online_count : (user.online_count || 0) + 1,
              session_game_count_reset: wasOnline ? true : false // 오프라인 시 게임 카운트 리셋됨을 표시
            }
          });
        } catch (error) {
        }
      }
    }
  };

  // 모바일에서 테이블 클릭 시 선택된 사용자를 해당 테이블에 할당
  const handleMobileTableClick = async (tableNumber) => {
    if (isMobile && selectedUser && isSelectionMode) {
      await handleUserDrop(tableNumber, selectedUser);
      setSelectedUser(null);
      setIsSelectionMode(false);
    }
  };

  // 모바일에서 외출 상태로 변경
  const handleMobileOutingClick = async () => {
    if (isMobile && selectedUser && isSelectionMode) {
      // 즉시 UI 업데이트 (낙관적 업데이트)
      startTransition(() => {
        updateOptimisticUsers({
          userId: selectedUser.id,
          changes: { status: "outing" }
        });
      });

      try {
        // 백그라운드에서 실제 API 호출
        await updateUserMutation.mutateAsync({
          id: selectedUser.id,
          data: {
            ...selectedUser,
            status: "outing",
          },
        });
      } catch (error) {
      }

      setSelectedUser(null);
      setIsSelectionMode(false);
    }
  };

  // 모바일에서 입장 상태로 변경
  const handleMobileEntranceClick = async () => {
    if (isMobile && selectedUser && isSelectionMode) {
      // 즉시 UI 업데이트 (낙관적 업데이트)
      startTransition(() => {
        updateOptimisticUsers({
          userId: selectedUser.id,
          changes: { status: "entrance" }
        });
      });

      try {
        // 백그라운드에서 실제 API 호출
        await updateUserMutation.mutateAsync({
          id: selectedUser.id,
          data: {
            ...selectedUser,
            status: "entrance",
          },
        });
      } catch (error) {
      }

      setSelectedUser(null);
      setIsSelectionMode(false);
    }
  };

  // 개별 사용자를 입장으로 이동 (데스크톱 hover 버튼용)
  const handleMoveUserToEntrance = async (user) => {
    const previousStatus = user.status;
    
    // 즉시 UI 업데이트 (낙관적 업데이트)
    startTransition(() => {
      updateOptimisticUsers({
        userId: user.id,
        changes: { status: "entrance" }
      });
    });

    try {
      // 백그라운드에서 실제 API 호출
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: {
          status: "entrance",
        },
      });
      
      // 입장 상태 변경 히스토리 로깅
      await logUserActionMutation.mutateAsync({
        userId: user.id,
        action: USER_ACTIONS.ENTRANCE,
        previousStatus: previousStatus,
        newStatus: "entrance",
        metadata: {
          timestamp: getKoreanISOString(),
          action_type: 'status_change'
        }
      });
    } catch (error) {
    }
  };

  // dnd-kit 드래그 이벤트 핸들러
  function handleDragEnd(event) {
    const { active, over } = event;
    
    if (!over) return;
    
    // active.data.current에서 드래그된 유저 정보 추출
    const draggedUser = active.data.current?.user;
    if (!draggedUser) return;


    // 대기 영역으로 드롭
    if (over.id === 'waiting-area') {
      handleUserDropOutside(draggedUser);
    }
  }

  const handleUserDrop = async (tableNumber, user) => {
    const newStatus = `g_${tableNumber}`;
    const previousStatus = user.status;
    
    // 즉시 UI 업데이트 (낙관적 업데이트)
    startTransition(() => {
      updateOptimisticUsers({
        userId: user.id,
        changes: { status: newStatus }
      });
    });

    try {
      // 백그라운드에서 실제 API 호출
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: {
          status: newStatus,
          updated_at: getKoreanISOString(), // 대기 시간 리셋
        },
      });
      
      // 사용자 히스토리 로깅
      await logUserActionMutation.mutateAsync({
        userId: user.id,
        action: USER_ACTIONS.TABLE_JOIN,
        previousStatus: previousStatus,
        newStatus: newStatus,
        tableNumber: tableNumber,
        metadata: {
          timestamp: getKoreanISOString(),
          action_type: 'table_assignment'
        }
      });
    } catch (error) {
      // 실패 시 원래 상태로 되돌리기 (React Query가 자동으로 캐시를 무효화하므로 원래 데이터로 복원됨)
    }
  };

  // 테이블 외부로 드래그하여 제거하는 함수
  const handleUserDropOutside = async (user) => {
    // 즉시 UI 업데이트 (낙관적 업데이트)
    startTransition(() => {
      updateOptimisticUsers({
        userId: user.id,
        changes: { status: "wait" }
      });
    });

    try {
      // 백그라운드에서 실제 API 호출
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: {
          status: "wait",
        },
      });
    } catch (error) {
      // 실패 시 원래 상태로 되돌리기 (React Query가 자동으로 캐시를 무효화하므로 원래 데이터로 복원됨)
    }
  };

  const handleTableClick = (tableNumber, assignedUsers) => {
    // 로그인하지 않은 사용자는 모달을 열 수 없음
    if (!authUser) return;
    
    setSelectedTable(tableNumber);
    setIsTableModalOpen(true);
  };

  const handleRemoveFromTable = async (tableNumber, userId) => {
    // 즉시 UI 업데이트 (낙관적 업데이트)
    startTransition(() => {
      updateOptimisticUsers({
        userId: userId,
        changes: { status: "wait" }
      });
    });

    try {
      // 백그라운드에서 실제 API 호출
      await updateUserMutation.mutateAsync({
        id: userId,
        data: {
          status: "wait",
          updated_at: getKoreanISOString(), // 대기 시간 리셋
          online_at: getKoreanISOString(), // 대기 시간 0분으로 리셋
        },
      });
    } catch (error) {
      // 실패 시 원래 상태로 되돌리기 (React Query가 자동으로 캐시를 무효화하므로 원래 데이터로 복원됨)
    }
  };

  const handleSetAllUsersToWait = async (users) => {
    // 테이블 번호 추출 (게임 종료)
    const tableNumber = users[0]?.status.match(/(?:g_|playing_)(\d+)/)?.[1];
    
    // 모든 유저에 대해 즉시 UI 업데이트 (낙관적 업데이트)
    startTransition(() => {
      users.forEach(user => {
        updateOptimisticUsers({
          userId: user.id,
          changes: { status: "wait" } // 항상 대기 상태로 변경
        });
      });
    });

    try {
      // 모든 유저에 대해 백그라운드에서 실제 API 호출
      const updatePromises = users.map(user => 
        updateUserMutation.mutateAsync({
          id: user.id,
          data: {
            status: "wait",
            updated_at: getKoreanISOString(), // 대기 시간 리셋
            online_at: getKoreanISOString(), // 대기 시간 0분으로 리셋
          },
        })
      );
      
      await Promise.all(updatePromises);
      
      // 게임 종료 히스토리 로깅
      
      const historyPromises = users.map(async (user, index) => {
        try {
          const result = await logUserActionMutation.mutateAsync({
            userId: user.id,
            action: USER_ACTIONS.GAME_END,
            previousStatus: user.status,
            newStatus: "wait",
            tableNumber: tableNumber ? parseInt(tableNumber) : null,
            metadata: {
              timestamp: getKoreanISOString(),
              game_duration: user.game_started_at ? 
                Math.floor((new Date() - new Date(user.game_started_at)) / 60000) : null // 분 단위
            }
          });
          return result;
        } catch (error) {
          throw error;
        }
      });
      
      await Promise.all(historyPromises);
      
      // 게임 종료 후 해당 테이블 대기열 처리
      if (tableNumber) {
        await handleProcessTableWaitlist(parseInt(tableNumber));
      }
    } catch (error) {
      // 실패 시 원래 상태로 되돌리기 (React Query가 자동으로 캐시를 무효화하므로 원래 데이터로 복원됨)
    }
  };

  const handleFinishAllWaitingUsers = async (users) => {
    try {
      // 모든 대기 유저에 대해 toggleOnline 호출 (오프라인으로 변경)
      const togglePromises = users.map(user => 
        toggleOnlineMutation.mutateAsync({
          userId: user.id,
          isCurrentlyOnline: user.is_online,
          currentOnlineCount: user.online_count || 0,
        })
      );
      
      await Promise.all(togglePromises);
    } catch (error) {
    }
  };

  const handleMoveAllWaitingToEntrance = async (users) => {
    // 모든 유저에 대해 즉시 UI 업데이트 (낙관적 업데이트)
    startTransition(() => {
      users.forEach(user => {
        updateOptimisticUsers({
          userId: user.id,
          changes: { status: "entrance" }
        });
      });
    });

    try {
      // 모든 유저에 대해 백그라운드에서 실제 API 호출
      const updatePromises = users.map(user => 
        updateUserMutation.mutateAsync({
          id: user.id,
          data: {
            status: "entrance",
          },
        })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
    }
  };

  // 테이블 대기열에 사용자 추가
  const handleAddToWaitlist = async (tableNumber, user) => {
    const newStatus = `table_wait_${tableNumber}`;
    const previousStatus = user.status;
    
    // 즉시 UI 업데이트 (낙관적 업데이트)
    startTransition(() => {
      updateOptimisticUsers({
        userId: user.id,
        changes: { status: newStatus }
      });
    });

    try {
      // 백그라운드에서 실제 API 호출
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: {
          status: newStatus,
        },
      });
      
      // 대기열 추가 히스토리 로깅
      await logUserActionMutation.mutateAsync({
        userId: user.id,
        action: USER_ACTIONS.TABLE_WAIT,
        previousStatus: previousStatus,
        newStatus: newStatus,
        tableNumber: tableNumber,
        metadata: {
          timestamp: getKoreanISOString(),
          action_type: 'waitlist_join'
        }
      });
    } catch (error) {
    }
  };

  // 게임 종료 시 대기열 처리 - 모든 대기 사용자를 테이블로 이동
  const handleProcessTableWaitlist = async (tableNumber) => {
    try {
      // 해당 테이블 대기열의 모든 사용자 찾기 (최신 데이터 사용)
      const currentUsers = users || optimisticUsers; // users가 있으면 우선 사용
      const waitlistUsers = currentUsers?.filter(user => 
        user.status === `table_wait_${tableNumber}` && user.is_online
      ).sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at)); // 먼저 온 순서
      
      if (!waitlistUsers || waitlistUsers.length === 0) {
        return; // 대기열이 없으면 조기 반환
      }

      // 현재 테이블에 배치된 사용자 수 확인
      const currentTableUsers = currentUsers?.filter(user => 
        user.status === `g_${tableNumber}` || user.status === `playing_${tableNumber}`
      ) || [];
      
      // 테이블 최대 용량 계산 (6명 - 현재 인원)
      const maxCapacity = 6;
      const availableSlots = maxCapacity - currentTableUsers.length;
      
      if (availableSlots <= 0) {
        return; // 테이블이 가득 찬 경우 조기 반환
      }
      
      // 배치 가능한 최대 인원 계산
      const usersToMove = waitlistUsers.slice(0, Math.min(availableSlots, waitlistUsers.length));
      
      // 병렬 처리로 성능 향상 - 모든 사용자를 동시에 처리
      const movePromises = usersToMove.map(user => 
        handleUserDrop(tableNumber, user)
      );
      
      await Promise.all(movePromises);
      
    } catch (error) {
      console.error(`테이블 ${tableNumber} 대기열 처리 중 오류:`, error);
    }
  };
  
  // 게임 시작 함수 - 간단한 버전
  const handleStartGame = async (tableNumber, readyUsers) => {
    try {
      const playerIds = readyUsers.map(user => user.id.toString());
      
      // s_table 업데이트
      await startGameMutation.mutateAsync({ tableNumber, playerIds });
      
      // 모든 준비된 사용자를 playing 상태로 변경하고 session_game_count 증가
      const updatePromises = readyUsers.map(user => 
        updateUserMutation.mutateAsync({
          id: user.id,
          data: {
            status: `playing_${tableNumber}`,
            session_game_count: (user.session_game_count || 0) + 1, // 간단히 +1 증가
          },
        })
      );
      
      await Promise.all(updatePromises);
      
    } catch (error) {
    }
  };




  if (isLoading) {
    return <LoadingSpinner message="사용자 정보를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorMessage message={error.message} />;
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <DndProvider backend={HTML5Backend}>
        <DroppablePage onUserDropOutside={handleUserDropOutside}>
          <DndKitDroppable id="waiting-area">
              <div className="min-h-screen max-w-7xl mx-auto p-2 sm:p-3 md:p-6flex flex-col">
            {/* 대기 상태 사용자 목록 */}
            <div className="flex-shrink-0 mb-3 sm:mb-4 w-full max-w-6xl pt-[60px] ">
              <div className="h-24 sm:h-28 md:h-32 overflow-y-auto overflow-x-hidden border rounded-lg bg-gray-50 relative scrollbar-hide">
              {waitUsers.length > 0 ? (
                <>
                  {isMobile && isSelectionMode && (
                    <div className="sticky top-0 z-10 mb-2 mx-1 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs text-blue-800 mb-1">
                        <span className="font-medium truncate">{selectedUser?.name}</span> 선택됨
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={handleMobileOutingClick}
                          className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded transition-colors whitespace-nowrap"
                        >
                          외출
                        </button>
                        <button
                          onClick={handleMobileEntranceClick}
                          className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors whitespace-nowrap"
                        >
                          입장
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(null);
                            setIsSelectionMode(false);
                          }}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors whitespace-nowrap"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1 p-1 auto-rows-max">
                    {waitUsers.map((user) => (
                      <div key={user.id} className="w-full min-w-0">
                        <DraggableUser
                          user={user}
                          onClick={isMobile ? () => handleUserClick(user) : () => {}}
                          showWaitTime={true}
                          waitTimeDisplay={getWaitTimeDisplay(user)}
                          showCloseButton={!isMobile}
                          onClose={isMobile ? null : handleUserClick}
                          onMoveToEntrance={handleMoveUserToEntrance}
                          isSelected={isMobile && selectedUser?.id === user.id}
                          isMobile={isMobile}
                          sessionGameCount={user.session_game_count || 0}
                          showGameCount={true}
                          className="w-full h-9 sm:h-10 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                  {waitUsers.length > 36 && (
                    <div className="sticky bottom-0 bg-gradient-to-t from-gray-50 to-transparent p-1 text-center">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        총 {waitUsers.length}명 (스크롤)
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-xs sm:text-sm">
                  대기 중인 사용자가 없습니다
                </div>
              )}
              </div>
            </div>




            {/* 당구대 그리드 - 반응형 배치 */}
            <div className="w-full max-w-6xl">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 p-2 sm:p-0" style={{gridAutoRows: 'minmax(180px, auto)'}}>
                {Array.from({ length: 8 }, (_, index) => {
                    const tableNumber = index + 1;
                    const assignedUsers = tableAssignments[tableNumber] || [];
                    // 테이블별 대기 사용자들 필터링
                    const tableWaitUsers = optimisticUsers?.filter(user => 
                      user.status === `table_wait_${tableNumber}` && user.is_online
                    ) || [];

                    return (
                      <div key={index} className="relative w-full min-h-0 pt-4">
                        <DroppableTable
                          tableNumber={tableNumber}
                          assignedUsers={assignedUsers}
                          waitlistUsers={tableWaitUsers}
                          onUserDrop={handleUserDrop}
                          onTableClick={isMobile && isSelectionMode ? handleMobileTableClick : handleTableClick}
                          onRemoveUser={handleRemoveFromTable}
                          onSetAllUsersToWait={handleSetAllUsersToWait}
                          onAddToWaitlist={handleAddToWaitlist}
                          onProcessWaitlist={handleProcessTableWaitlist}
                          onStartGame={handleStartGame}
                          isMobile={isMobile}
                          isSelectionMode={isSelectionMode}
                          selectedUser={selectedUser}
                        />
                      </div>
                    );
                })}
              </div>
            </div>


          </div>


          {/* 테이블 사용자 추가 모달 - 로그인한 사용자만 */}
          {authUser && (
            <TableUserModal
              isOpen={isTableModalOpen}
              onClose={() => setIsTableModalOpen(false)}
              tableNumber={selectedTable}
              currentUsers={
                selectedTable ? tableAssignments[selectedTable] || [] : []
              }
              onUserAdd={() => {}} // 빈 함수로 설정 (React Query가 자동으로 데이터 업데이트 처리)
              onProcessWaitlist={handleProcessTableWaitlist}
            />
          )}

            </DndKitDroppable>
          </DroppablePage>
        
          {/* 사용자 관리 Drawer (오프라인 & 외출) */}
          <UserManagementDrawer />
        </DndProvider>
      </DndContext>
  );
}
