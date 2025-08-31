"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, X, Power, PowerOff, UserPlus } from "lucide-react";
import { useSUsers, useToggleUserOnline } from "@/hooks/useUser";
import AddUserModal from "./AddUserModal";
import UserFilter from "./UserFilter";

export default function UserDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const { data: users, isLoading } = useSUsers();
  const toggleOnlineMutation = useToggleUserOnline();

  // 필터링된 사용자 목록
  const getFilteredUsers = () => {
    if (!users) return [];

    switch (selectedFilter) {
      case "online":
        return users.filter((user) => user.is_online);
      case "offline":
        return users.filter((user) => !user.is_online);
      default:
        return users;
    }
  };

  const filteredUsers = getFilteredUsers();

  const handleToggleOnline = async (
    userId,
    isCurrentlyOnline,
    currentOnlineCount
  ) => {
    try {
      await toggleOnlineMutation.mutateAsync({
        userId,
        isCurrentlyOnline,
        currentOnlineCount,
      });
    } catch (error) {
      console.error("Toggle online error:", error);
    }
  };

  return (
    <>
      {/* Drawer Toggle Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed right-6 top-6 z-[60] rounded-2xl w-14 h-14 p-0 bg-white hover:bg-gray-50 border border-gray-200 transition-all duration-200 shadow-sm"
        title="사용자 관리"
      >
        <Users size={20} className="text-gray-600" />
        {users?.filter((user) => !user.is_online).length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {users.filter((user) => !user.is_online).length}
          </span>
        )}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`
        fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">사용자 관리</h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsAddUserModalOpen(true)}
                className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus size={14} className="mr-1" />
                추가
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Filter */}
          <div className="p-6 border-b border-gray-100">
            <UserFilter
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  {selectedFilter === "all" &&
                    `총 ${users?.length || 0}명의 사용자`}
                  {selectedFilter === "online" &&
                    `온라인 ${filteredUsers.length}명`}
                  {selectedFilter === "offline" &&
                    `오프라인 ${filteredUsers.length}명`}
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-2">
                      {selectedFilter === "online" &&
                        "온라인 사용자가 없습니다"}
                      {selectedFilter === "offline" &&
                        "오프라인 사용자가 없습니다"}
                      {selectedFilter === "all" && "사용자가 없습니다"}
                    </div>
                    <div className="text-sm text-gray-400">
                      {selectedFilter === "online" &&
                        "오프라인 사용자를 온라인으로 변경해보세요"}
                      {selectedFilter === "offline" &&
                        "모든 사용자가 온라인 상태입니다"}
                      {selectedFilter === "all" && "새 사용자를 추가해보세요"}
                    </div>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <Card
                      key={user.id}
                      className="border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="font-medium text-gray-900">
                                {user.name || "이름 없음"}
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.is_online
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {user.is_online ? "온라인" : "오프라인"}
                              </span>
                            </div>

                            <div className="text-xs text-gray-500 space-y-1">
                              <div>접속 횟수: {user.online_count || 0}회</div>
                              <div>
                                생성일:{" "}
                                {new Date(user.created_at).toLocaleDateString(
                                  "ko-KR"
                                )}
                              </div>
                              {user.online_at && (
                                <div>
                                  최근 접속:{" "}
                                  {new Date(user.online_at).toLocaleDateString(
                                    "ko-KR"
                                  )}{" "}
                                  {new Date(user.online_at).toLocaleTimeString(
                                    "ko-KR"
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleToggleOnline(
                                user.id,
                                user.is_online,
                                user.online_count || 0
                              )
                            }
                            disabled={toggleOnlineMutation.isPending}
                            className={`ml-3 h-8 w-8 p-0 ${
                              user.is_online
                                ? "hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                                : "hover:bg-green-50 hover:border-green-200 hover:text-green-600"
                            }`}
                          >
                            {user.is_online ? (
                              <PowerOff size={14} />
                            ) : (
                              <Power size={14} />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
      />
    </>
  );
}
