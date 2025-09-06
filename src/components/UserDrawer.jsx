"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, X, Power, PowerOff, UserPlus, PanelRightOpen, PanelRightClose, Search, Edit, Trash2, Calendar, Clock, UserCheck } from "lucide-react";
import { useSUsers, useToggleUserOnline } from "@/hooks/useUser";
import AddUserModal from "./AddUserModal";
import UserFilter from "./UserFilter";
import EditUserModal from "./EditUserModal";
import DeleteUserDialog from "./DeleteUserDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import dayjs from "dayjs";

// SidebarContent 컴포넌트를 외부로 분리
const SidebarContent = ({ 
  users, 
  isLoading, 
  filteredUsers, 
  selectedFilter, 
  setSelectedFilter, 
  searchQuery, 
  handleSearchChange, 
  handleSearchClear, 
  handleToggleOnline, 
  toggleOnlineMutation, 
  setIsAddUserModalOpen,
  editingUser,
  setEditingUser,
  deletingUser,
  setDeletingUser,
  onClose, 
  showCloseButton = false 
}) => (
  <div className="flex flex-col h-full bg-white overflow-visible">
    {/* Header */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{users?.filter(u => u.is_online).length || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full ml-2"></div>
            <span>{users?.filter(u => !u.is_online).length || 0}</span>
          </div>
        </div>
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsAddUserModalOpen(true)}
        className="h-8 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md flex items-center justify-center"
      >
        <UserPlus size={14} className="mr-1" />
        추가
      </Button>
      
      {showCloseButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="lg:hidden h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50 absolute top-4 right-4 flex items-center justify-center"
        >
          <X size={14} />
        </Button>
      )}
    </div>

    {/* Filter and Search */}
    <div className="px-6 py-4 space-y-4">
      <UserFilter
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />
      
      {/* Search Input */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
        <Input
          type="text"
          placeholder="사용자 이름 검색..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-9 pr-8 text-sm"
        />
        {searchQuery && (
          <button
            onClick={handleSearchClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto overflow-x-visible">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="text-sm text-gray-500 mb-1">
                {selectedFilter === "online" && "온라인 사용자가 없습니다"}
                {selectedFilter === "offline" && "오프라인 사용자가 없습니다"}
                {selectedFilter === "all" && "사용자가 없습니다"}
              </div>
              <div className="text-xs text-gray-400">
                {selectedFilter === "all" && "새 사용자를 추가해보세요"}
              </div>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <TooltipProvider key={user.id}>
                <button
                  type="button"
                  className="w-full group border-b border-gray-100 py-4 cursor-pointer hover:bg-gray-50 transition-colors text-left"
                  onClick={() => handleToggleOnline(user.id, user.is_online, user.online_count || 0)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setEditingUser(user);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div  className="flex-1 min-w-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 mb-1 cursor-pointer">
                            <div className="font-medium text-gray-900 text-sm truncate">
                              {user.name || "이름 없음"}
                            </div>
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                user.is_online ? "bg-blue-600" : "bg-gray-300"
                              }`}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="right" 
                          className="max-w-48 p-2 text-xs z-[9999]"
                          sideOffset={100}
                          avoidCollisions={true}
                          collisionPadding={20}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 font-medium text-gray-900">
                              <UserCheck size={10} className="text-blue-500" />
                              <span>{user.name || "이름 없음"}</span>
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  user.is_online ? "bg-blue-600" : "bg-gray-300"
                                }`}
                              />
                            </div>
                            <div className="space-y-0.5 text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar size={8} />
                                <span>생성: {dayjs(user.created_at).format("MM/DD HH:mm")}</span>
                              </div>
                              {user.online_at && (
                                <div className="flex items-center gap-1">
                                  <Clock size={8} />
                                  <span>접속: {dayjs(user.online_at).format("MM/DD HH:mm")}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Power size={8} />
                                <span>횟수: {user.online_count || 0}</span>
                              </div>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                                user.status === "online" 
                                  ? "bg-blue-100 text-blue-700"
                                  : user.status === "wait"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}>
                                {user.status === "online" ? "온라인" : user.status === "wait" ? "대기" : "오프라인"}
                              </span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="w-1 h-1 bg-current rounded-full" />
                              <div className="w-1 h-1 bg-current rounded-full" />
                              <div className="w-1 h-1 bg-current rounded-full" />
                            </div>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end"
                          side="bottom"
                          sideOffset={4}
                          avoidCollisions={true}
                          collisionPadding={20}
                          className="z-[9999] bg-white border shadow-lg"
                        >
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Edit size={14} className="mr-2" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeletingUser(user)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 size={14} className="mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </button>
              </TooltipProvider>
            ))
          )}
        </div>
      )}
    </div>
  </div>
);

export default function UserDrawer() {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  
  // 검색어 변경 핸들러
  const handleSearchChange = useCallback((e) => {
    e.preventDefault();
    setSearchQuery(e.target.value);
  }, []);
  
  // 검색어 초기화 핸들러를 useCallback으로 최적화
  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
  }, []);
  const { data: users, isLoading } = useSUsers();
  const toggleOnlineMutation = useToggleUserOnline();



  // 필터링된 사용자 목록 (useMemo로 최적화)
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let filtered = users;
    // 온라인/오프라인 필터링
    switch (selectedFilter) {
      case "online":
        filtered = filtered.filter((user) => user.is_online);
        break;
      case "offline":
        filtered = filtered.filter((user) => !user.is_online);
        break;
      default:
        break;
    }
    // 검색 필터링
    if (searchQuery.trim()) {
      filtered = filtered.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }
    return filtered;
  }, [users, selectedFilter, searchQuery]);

  const handleToggleOnline = useCallback(async (
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
    }
  }, [toggleOnlineMutation]);

  return (
    <>
      {/* 토글 버튼 - 데스크톱 */}
      <Button
        onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
        className={`
          hidden lg:flex items-center justify-center fixed z-[60] w-10 h-10 p-0 bg-white hover:bg-gray-50 border border-gray-200 transition-all duration-300 shadow-sm rounded-md
          ${isDesktopSidebarOpen ? 'left-[324px] top-[68px]' : 'left-4 top-16'}
        `}
        title="사용자 관리"
      >
        {isDesktopSidebarOpen ? (
          <X size={16} className="text-gray-600" />
        ) : (
          <Users size={16} className="text-gray-600" />
        )}
        {users?.filter((user) => !user.is_online).length > 0 && !isDesktopSidebarOpen && (
          <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {users.filter((user) => !user.is_online).length}
          </span>
        )}
      </Button>

      {/* 토글 버튼 - 태블릿 */}
      <Button
        onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        className="hidden md:flex lg:hidden fixed left-4 top-16 z-[60] w-10 h-10 p-0 bg-white hover:bg-gray-50 border border-gray-200 transition-all duration-200 shadow-sm rounded-md items-center justify-center"
        title="사용자 관리"
      >
        <Users size={16} className="text-gray-600" />
        {users?.filter((user) => !user.is_online).length > 0 && (
          <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {users.filter((user) => !user.is_online).length}
          </span>
        )}
      </Button>

      {/* 토글 버튼 - 모바일 */}
      <Button
        onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        className="md:hidden fixed left-4 top-16 z-[60] w-12 h-12 p-0 bg-white hover:bg-gray-50 border border-gray-200 transition-all duration-200 shadow-sm rounded-lg flex items-center justify-center"
        title="사용자 관리"
      >
        <Users size={18} className="text-gray-600" />
        {users?.filter((user) => !user.is_online).length > 0 && (
          <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {users.filter((user) => !user.is_online).length}
          </span>
        )}
      </Button>

      {/* 데스크톱 사이드바 (lg 이상) */}
      <div
        className={`
        hidden lg:block fixed left-0 top-[60px] h-[calc(100vh-60px)] w-80 bg-white border-r border-gray-100 z-40 transform transition-transform duration-300 ease-in-out shadow-sm overflow-visible
        ${isDesktopSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <SidebarContent 
          users={users}
          isLoading={isLoading}
          filteredUsers={filteredUsers}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          searchQuery={searchQuery}
          handleSearchChange={handleSearchChange}
          handleSearchClear={handleSearchClear}
          handleToggleOnline={handleToggleOnline}
          toggleOnlineMutation={toggleOnlineMutation}
          setIsAddUserModalOpen={setIsAddUserModalOpen}
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          deletingUser={deletingUser}
          setDeletingUser={setDeletingUser}
          onClose={() => setIsDesktopSidebarOpen(false)} 
          showCloseButton={false} 
        />
      </div>

      {/* 모바일 오버레이 */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-50 transition-opacity lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* 모바일 드로어 (lg 미만) */}
      <div
        className={`
        fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden overflow-visible
        ${isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <SidebarContent 
          users={users}
          isLoading={isLoading}
          filteredUsers={filteredUsers}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          searchQuery={searchQuery}
          handleSearchChange={handleSearchChange}
          handleSearchClear={handleSearchClear}
          handleToggleOnline={handleToggleOnline}
          toggleOnlineMutation={toggleOnlineMutation}
          setIsAddUserModalOpen={setIsAddUserModalOpen}
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          deletingUser={deletingUser}
          setDeletingUser={setDeletingUser}
          onClose={() => setIsMobileDrawerOpen(false)} 
          showCloseButton={true} 
        />
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        user={deletingUser}
      />
    </>
  );
}
