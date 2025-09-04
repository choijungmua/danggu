"use client";

import { useState, useEffect, useOptimistic, useMemo, startTransition } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndContext, useDroppable } from '@dnd-kit/core';
import { useSUsers, useUpdateSUser, useToggleUserOnline } from "@/hooks/useUser";
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
  const updateUserMutation = useUpdateSUser();
  const toggleOnlineMutation = useToggleUserOnline();
  const isMobile = useIsMobile();

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentTime, setCurrentTime] = useState(null);
  
  // 모바일 클릭 모드 상태
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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
      // status가 g_1, g_2, g_3, ... 형태인 경우 해당 테이블에 할당
      if (user.status && user.status.startsWith("g_")) {
        const tableNumber = parseInt(user.status.substring(2));
        if (tableNumber >= 1 && tableNumber <= 8) {
          if (!assignments[tableNumber]) {
            assignments[tableNumber] = [];
          }
          assignments[tableNumber].push(user);
        }
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
          await toggleOnlineMutation.mutateAsync({
            userId: user.id,
            isCurrentlyOnline: user.is_online,
            currentOnlineCount: user.online_count || 0,
          });
        } catch (error) {
          console.error("Toggle online error:", error);
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
        console.error("Failed to set user to outing:", error);
      }

      setSelectedUser(null);
      setIsSelectionMode(false);
    }
  };

  // dnd-kit 드래그 이벤트 핸들러
  function handleDragEnd(event) {
    const { active, over } = event;
    
    if (!over) return;
    
    // active.data.current에서 드래그된 유저 정보 추출
    const draggedUser = active.data.current?.user;
    if (!draggedUser) return;

    console.log('=== dnd-kit 드래그 완료 ===', draggedUser.name, 'to:', over.id);

    // 대기 영역으로 드롭
    if (over.id === 'waiting-area') {
      handleUserDropOutside(draggedUser);
    }
  }

  const handleUserDrop = async (tableNumber, user) => {
    const newStatus = `g_${tableNumber}`;
    
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
          ...user,
          status: newStatus,
        },
      });
    } catch (error) {
      console.error("Failed to assign user to table:", error);
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
          ...user,
          status: "wait",
        },
      });
    } catch (error) {
      console.error("Failed to remove user from table:", error);
      // 실패 시 원래 상태로 되돌리기 (React Query가 자동으로 캐시를 무효화하므로 원래 데이터로 복원됨)
    }
  };

  const handleTableClick = (tableNumber, assignedUsers) => {
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
        },
      });
    } catch (error) {
      console.error("Failed to remove user from table:", error);
      // 실패 시 원래 상태로 되돌리기 (React Query가 자동으로 캐시를 무효화하므로 원래 데이터로 복원됨)
    }
  };

  const handleSetAllUsersToWait = async (users) => {
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
            ...user,
            status: "wait",
          },
        })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Failed to set users to wait:", error);
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
      console.error("Failed to finish waiting users:", error);
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
              <div className="max-w-7xl mx-auto p-3 sm:p-6 pt-[84px] sm:pt-[84px] flex flex-col items-center">
            {/* 대기 상태 사용자 목록 */}
            <div className="mb-6 sm:mb-8 w-full max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">대기 중</h2>
                {waitUsers.length > 0 && (
                  <button
                    onClick={() => handleFinishAllWaitingUsers(waitUsers)}
                    className="text-xs sm:text-sm bg-red-100 hover:bg-red-200 text-red-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-colors flex items-center gap-1 self-start sm:self-auto"
                    title="모든 대기 사용자를 오프라인으로 전환"
                  >
                    <span>전체 종료</span>
                    <span className="text-xs">({waitUsers.length}명)</span>
                  </button>
                )}
              </div>
              {waitUsers.length > 0 ? (
                <>
                  {isMobile && isSelectionMode && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-blue-800 mb-2">
                        <span className="font-medium">{selectedUser?.name}</span> 선택됨
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="text-xs text-blue-600 flex-1">
                          테이블을 클릭하여 배치하거나 아래 버튼을 사용하세요
                        </div>
                        <button
                          onClick={handleMobileOutingClick}
                          className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded-md transition-colors"
                        >
                          외출로 이동
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(null);
                            setIsSelectionMode(false);
                          }}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {waitUsers.map((user) => (
                      <DraggableUser
                        key={user.id}
                        user={user}
                        onClick={isMobile ? () => handleUserClick(user) : () => {}}
                        showWaitTime={true}
                        waitTimeDisplay={getWaitTimeDisplay(user)}
                        showCloseButton={!isMobile}
                        onClose={isMobile ? null : handleUserClick}
                        isSelected={isMobile && selectedUser?.id === user.id}
                        isMobile={isMobile}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 sm:py-6 bg-zinc-50 rounded-lg">
                  <div className="text-zinc-500 text-sm">대기 중인 사용자가 없습니다</div>
                </div>
              )}
            </div>




            {/* 당구대 그리드 - 반응형 배치 */}
            <div className="mb-6 sm:mb-8 w-full max-w-6xl">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">당구대</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {Array.from({ length: 8 }, (_, index) => {
                  const tableNumber = index + 1;
                  const assignedUsers = tableAssignments[tableNumber] || [];

                  return (
                    <div key={index} className="relative">
                      <DroppableTable
                        tableNumber={tableNumber}
                        assignedUsers={assignedUsers}
                        onUserDrop={handleUserDrop}
                        onTableClick={isMobile && isSelectionMode ? handleMobileTableClick : handleTableClick}
                        onRemoveUser={handleRemoveFromTable}
                        onSetAllUsersToWait={handleSetAllUsersToWait}
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


          {/* 테이블 사용자 추가 모달 */}
          <TableUserModal
            isOpen={isTableModalOpen}
            onClose={() => setIsTableModalOpen(false)}
            tableNumber={selectedTable}
            currentUsers={
              selectedTable ? tableAssignments[selectedTable] || [] : []
            }
            onUserAdd={() => {}} // 빈 함수로 설정 (React Query가 자동으로 데이터 업데이트 처리)
          />

            </DndKitDroppable>
          </DroppablePage>
        
          {/* 사용자 관리 Drawer (오프라인 & 외출) */}
          <UserManagementDrawer />
        </DndProvider>
      </DndContext>
  );
}
