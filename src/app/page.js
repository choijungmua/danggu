"use client";

import { useState, useEffect, useOptimistic, useMemo, startTransition } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSUsers, useUpdateSUser } from "@/hooks/useUser";
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
          className={`min-h-screen transition-colors ml-0 lg:ml-80 ${
            isOver ? "bg-red-50" : ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: users, isLoading, error } = useSUsers();
  const updateUserMutation = useUpdateSUser();

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  // 더블 클릭 방지를 위한 빈 함수
  const handleUserClick = () => {};

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




  if (isLoading) {
    return (
      <ProtectedRoute>
        <LoadingSpinner message="사용자 정보를 불러오는 중..." />
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <ErrorMessage message={error.message} />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DndProvider backend={HTML5Backend}>
        <DroppablePage onUserDropOutside={handleUserDropOutside}>
          <div className="max-w-7xl mx-auto p-6 pt-[84px] lg:pl-6">
            {/* 대기 상태 사용자 목록 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-zinc-900 mb-4">대기 중</h2>
              {waitUsers.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {waitUsers.map((user) => (
                    <DraggableUser
                      key={user.id}
                      user={user}
                      onClick={handleUserClick}
                      showWaitTime={true}
                      waitTimeDisplay={getWaitTimeDisplay(user)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-zinc-50 rounded-lg">
                  <div className="text-zinc-500 text-sm">대기 중인 사용자가 없습니다</div>
                </div>
              )}
            </div>




            {/* 당구대 그리드 - 4x2 배치 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">당구대</h2>
              <div className="grid grid-cols-4 gap-6">
                {Array.from({ length: 8 }, (_, index) => {
                  const tableNumber = index + 1;
                  const assignedUsers = tableAssignments[tableNumber] || [];

                  return (
                    <div key={index} className="relative">
                      <DroppableTable
                        tableNumber={tableNumber}
                        assignedUsers={assignedUsers}
                        onUserDrop={handleUserDrop}
                        onTableClick={handleTableClick}
                        onRemoveUser={handleRemoveFromTable}
                        onSetAllUsersToWait={handleSetAllUsersToWait}
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

          {/* 사용자 관리 Drawer (오프라인 & 외출) */}
          <UserManagementDrawer />
        </DroppablePage>
      </DndProvider>
    </ProtectedRoute>
  );
}
