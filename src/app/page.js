"use client";

import { useState, useEffect } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSUsers, useUpdateSUser } from "@/hooks/useUser";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import NotFound from "@/components/NotFound";
import UserStatusModal from "@/components/UserStatusModal";
import UserDrawer from "@/components/UserDrawer";
import DraggableUser from "@/components/DraggableUser";
import DroppableTable from "@/components/DroppableTable";
import TableUserModal from "@/components/TableUserModal";
import {
  getOnlineUsersSorted,
  getUserTableStatusLabel,
  getUserTableStatusBadgeClass,
  getWaitUsers,
  getMealUsers,
} from "@/utils/userUtils";
import { getWaitTimeDisplay } from "@/utils/dateUtils";

// 전체 페이지를 드롭 가능하게 만드는 컴포넌트
function DroppablePage({ children, onUserDropOutside }) {
  const [{ isOver }, drop] = useDrop({
    accept: "USER",
    drop: (item) => onUserDropOutside(item.user),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`min-h-screen transition-colors ${
        isOver ? "bg-red-50" : "bg-gray-50"
      }`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const { data: users, isLoading, error } = useSUsers();
  const updateUserMutation = useUpdateSUser();

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableAssignments, setTableAssignments] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());

  // 대기 상태와 식사 상태의 온라인 유저들 필터링
  const waitUsers = getWaitUsers(users || []);
  const mealUsers = getMealUsers(users || []);

  // 실시간 업데이트를 위한 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(timer);
  }, []);

  // 사용자 데이터가 로드되면 테이블 할당 상태 복원
  useEffect(() => {
    if (users) {
      const assignments = {};
      users.forEach((user) => {
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
      setTableAssignments(assignments);
    }
  }, [users]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleUpdateUser = async (updateData) => {
    try {
      await updateUserMutation.mutateAsync(updateData);
      // 성공적으로 업데이트되면 모달이 자동으로 닫힙니다 (UserStatusModal에서 처리)
    } catch (error) {
      console.error("Failed to update user:", error);
      // 에러는 UserStatusModal에서 처리되므로 여기서는 로그만 남깁니다
      throw error; // UserStatusModal에서 catch할 수 있도록 에러를 다시 던집니다
    }
  };

  const handleUserDrop = async (tableNumber, user) => {
    try {
      // 기존에 다른 테이블에 할당된 사용자가 있다면 제거
      const newAssignments = { ...tableAssignments };
      Object.keys(newAssignments).forEach((key) => {
        newAssignments[key] = newAssignments[key].filter(
          (assignedUser) => assignedUser.id !== user.id
        );
      });

      // 새 테이블에 사용자 추가
      if (!newAssignments[tableNumber]) {
        newAssignments[tableNumber] = [];
      }
      newAssignments[tableNumber].push(user);
      setTableAssignments(newAssignments);

      // 사용자 상태를 해당 테이블로 업데이트
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: {
          ...user,
          status: `g_${tableNumber}`, // g_1, g_2, g_3, ... 형태로 테이블 번호 저장
        },
      });
    } catch (error) {
      console.error("Failed to assign user to table:", error);
    }
  };

  // 테이블 외부로 드래그하여 제거하는 함수
  const handleUserDropOutside = async (user) => {
    try {
      // 모든 테이블에서 사용자 제거
      const newAssignments = { ...tableAssignments };
      Object.keys(newAssignments).forEach((key) => {
        newAssignments[key] = newAssignments[key].filter(
          (assignedUser) => assignedUser.id !== user.id
        );
      });
      setTableAssignments(newAssignments);

      // 사용자 상태를 대기 상태로 변경
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: {
          ...user,
          status: "wait",
        },
      });
    } catch (error) {
      console.error("Failed to remove user from table:", error);
    }
  };

  const handleTableClick = (tableNumber, assignedUsers) => {
    setSelectedTable(tableNumber);
    setIsTableModalOpen(true);
  };

  const handleRemoveFromTable = async (tableNumber, userId) => {
    try {
      // 사용자 상태를 대기 상태로 변경
      await updateUserMutation.mutateAsync({
        id: userId,
        data: {
          status: "wait",
        },
      });

      // 테이블 할당에서 제거
      setTableAssignments((prev) => {
        const newAssignments = { ...prev };
        if (newAssignments[tableNumber]) {
          newAssignments[tableNumber] = newAssignments[tableNumber].filter(
            (user) => user.id !== userId
          );
          if (newAssignments[tableNumber].length === 0) {
            delete newAssignments[tableNumber];
          }
        }
        return newAssignments;
      });
    } catch (error) {
      console.error("Failed to remove user from table:", error);
    }
  };

  const handleTableUserAdd = (addedUsers) => {
    // 테이블 할당 상태 업데이트
    setTableAssignments((prev) => {
      const newAssignments = { ...prev };
      if (!newAssignments[selectedTable]) {
        newAssignments[selectedTable] = [];
      }
      newAssignments[selectedTable] = [
        ...newAssignments[selectedTable],
        ...addedUsers,
      ];
      return newAssignments;
    });
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
          <div className="max-w-7xl mx-auto p-6">
            {/* 대기 상태 사용자 목록 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                대기 중인 사용자
              </h2>
              <p className="text-gray-600 mb-6">
                드래그하여 당구대에 배치하거나 테이블을 클릭하여 추가하세요
              </p>
              {waitUsers.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {waitUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className="px-4 py-3 bg-white rounded-2xl text-gray-900 font-medium hover:bg-gray-50 transition-all cursor-pointer border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                          <span className="text-sm font-semibold text-gray-600">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {user.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            대기 시간: {getWaitTimeDisplay(user)}
                          </span>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200">
                          대기
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <NotFound
                  title="대기 중인 사용자가 없습니다"
                  message="현재 대기 상태인 온라인 사용자가 없습니다."
                  className="py-8"
                />
              )}
            </div>

            {/* 식사 상태 사용자 목록 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                식사 중인 사용자
              </h2>
              {mealUsers.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {mealUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className="px-4 py-3 bg-white rounded-2xl text-gray-900 font-medium hover:bg-gray-50 transition-all cursor-pointer border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-100">
                          <span className="text-sm font-semibold text-orange-600">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {user.name}
                          </span>
                          <span className="text-xs text-gray-500">식사 중</span>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full border bg-orange-50 text-orange-700 border-orange-200">
                          식사
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <NotFound
                  title="식사 중인 사용자가 없습니다"
                  message="현재 식사 상태인 온라인 사용자가 없습니다."
                  className="py-8"
                />
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
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="mt-8 p-4 bg-gray-100 rounded-2xl text-center">
              <p className="text-gray-600 text-sm">
                테이블에서 사용자를 허공으로 드래그하면 대기 상태로 변경됩니다
              </p>
            </div>
          </div>

          {/* 사용자 상태 변경 모달 */}
          <UserStatusModal
            user={selectedUser}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onUpdate={handleUpdateUser}
          />

          {/* 테이블 사용자 추가 모달 */}
          <TableUserModal
            isOpen={isTableModalOpen}
            onClose={() => setIsTableModalOpen(false)}
            tableNumber={selectedTable}
            currentUsers={
              selectedTable ? tableAssignments[selectedTable] || [] : []
            }
            onUserAdd={handleTableUserAdd}
          />

          {/* 오프라인 사용자 관리 Drawer */}
          <UserDrawer />
        </DroppablePage>
      </DndProvider>
    </ProtectedRoute>
  );
}
