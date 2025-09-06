"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useDrop } from "react-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, X, Power, PowerOff, UserPlus, Search, Edit, Trash2, Calendar, Clock, UserCheck, Utensils } from "lucide-react";
import { useSUsers, useToggleUserOnline, useUpdateSUser } from "@/hooks/useUser";
import { useAllUsersSessionGameCount } from "@/hooks/useUserHistory";
import { useOptimistic, startTransition } from "react";
import AddUserModal from "./AddUserModal";
import UserFilter from "./UserFilter";
import EditUserModal from "./EditUserModal";
import DeleteUserDialog from "./DeleteUserDialog";
import DraggableUser from "./DraggableUser";
import { DragableOutingUser } from "./DragableOutingUser";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAuthStore } from "@/stores/authStore";
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

// SidebarContent 컴포넌트
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
  showCloseButton = false,
  activeTab,
  setActiveTab,
  outingUsers,
  entranceUsers,
  onUserDropToOuting,
  onUserClickToWait,
  isDragOver,
  isGlobalDragging,
  isMobile,
  allSessionGameCounts = {}
}) => {
  const { user: authUser } = useAuthStore();
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`
              relative flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all duration-150 flex-1 whitespace-nowrap
              ${
                activeTab === 'users' 
                  ? 'text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <Users size={12} />
            <span>일반유저 ({users?.filter(u => !u.is_online).length || 0})</span>
            {activeTab === 'users' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('outing')}
            className={`
              relative flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all duration-150 flex-1 whitespace-nowrap
              ${
                activeTab === 'outing' 
                  ? 'text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <Utensils size={12} />
            <span>외출중 ({users?.filter(u => u.status === 'outing' && u.is_online).length || 0})</span>
            {activeTab === 'outing' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('entrance')}
            className={`
              relative flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all duration-150 flex-1 whitespace-nowrap
              ${
                activeTab === 'entrance' 
                  ? 'text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <UserCheck size={12} />
            <span>입장 ({users?.filter(u => u.status === 'entrance' && u.is_online).length || 0})</span>
            {activeTab === 'entrance' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>
        </div>
      </div>
      

      
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


      {/* Search (일반유저 탭에서만) */}
      {activeTab === 'users' && (
        <div className="flex-shrink-0 px-6 py-4 space-y-4">
          <UserFilter
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />
          
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
      )}

      {/* Action Button */}
      {
        authUser && (
          <>
          

      <div className="flex-shrink-0 px-6 py-3 border-b border-gray-100">
        {activeTab === 'users' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAddUserModalOpen(true)}
            className="h-8 w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md flex items-center"
          >
            <UserPlus size={14} className="mr-2" />
            사용자 추가
          </Button>
        )}
      </div>
      </>
        )
      }
      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className={`h-full ${isGlobalDragging ? 'overflow-visible' : 'overflow-y-auto scrollbar-hide'}`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
          </div>
        ) : activeTab === 'outing' ? (
          // 외출중 사용자 목록
          <div className="p-4 space-y-3">
            {outingUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-zinc-400 text-sm">외출 중인 사용자가 없습니다</div>
              </div>
            ) : (
              outingUsers.map((user) => (
                <DragableOutingUser
                  key={user.id}
                  user={user}
                  onClick={() => onUserClickToWait(user)}
                  isMobile={isMobile}
                  sessionGameCount={user.session_game_count || 0}
                  showGameCount={true}
                />
              ))
            )}
          </div>
        ) : activeTab === 'entrance' ? (
          // 입장 사용자 목록
          <div className="p-4 space-y-3">
            {entranceUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-zinc-400 text-sm">입장한 사용자가 없습니다</div>
              </div>
            ) : (
              entranceUsers.map((user) => (
                <DragableOutingUser
                  key={user.id}
                  user={user}
                  onClick={() => onUserClickToWait(user)}
                  isMobile={isMobile}
                  sessionGameCount={user.session_game_count || 0}
                  showGameCount={true}
                />
              ))
            )}
          </div>
        ) : (
          // 일반 사용자 목록
          <div className="p-4 space-y-2 ">
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
                  <div 
                    className="group border-b border-gray-100 py-4 hover:bg-gray-50 transition-colors relative"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      // 로그인한 사용자만 우클릭 가능
                      if (authUser) {
                        setEditingUser(user);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        className="flex-1 min-w-0 text-left"
                        onClick={() => handleToggleOnline(user.id, user.is_online, user.online_count || 0)}
                      >
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
                      </button>

{
  authUser && (

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
                          <DropdownMenuContent align="end">
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
                      )
}

                    </div>
                  </div>
                </TooltipProvider>
              ))
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default function UserManagementDrawer() {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'outing'
  const [isDragHovering, setIsDragHovering] = useState(false);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  
  const { data: users, isLoading } = useSUsers();
  const { data: allSessionGameCounts } = useAllUsersSessionGameCount();
  const toggleOnlineMutation = useToggleUserOnline();
  const updateUserMutation = useUpdateSUser();
  const isMobile = useIsMobile();

  // 전역 드래그 상태 감지
  useEffect(() => {
    const handleDragStart = () => {
      setIsGlobalDragging(true);
    };
    
    const handleDragEnd = () => {
      setIsGlobalDragging(false);
    };

    // 문서 전체에서 드래그 이벤트 감지
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

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

  // 외출 중인 사용자 필터링
  const outingUsers = useMemo(() => {
    if (!optimisticUsers) return [];
    return optimisticUsers.filter(user => user.status === 'outing' && user.is_online);
  }, [optimisticUsers]);

  // 입장 중인 사용자 필터링
  const entranceUsers = useMemo(() => {
    if (!optimisticUsers) return [];
    return optimisticUsers.filter(user => user.status === 'entrance' && user.is_online);
  }, [optimisticUsers]);

  // 데스크톱 좌측 가장자리 드래그 감지
  const [{ isLeftEdgeOverDesktop }, leftEdgeDropDesktop] = useDrop({
    accept: "USER",
    drop: (item, monitor) => {
      if (!monitor.didDrop()) {
        handleUserDropToOuting(item.user);
        setIsDragHovering(false);
        return { dropped: true };
      }
      return undefined;
    },
    collect: (monitor) => ({
      isLeftEdgeOverDesktop: monitor.isOver(),
    }),
    hover: (item, monitor) => {
      if (monitor.isOver()) {
        setActiveTab('outing');
        setIsDragHovering(true);
      }
    }
  });

  // 모바일 좌측 가장자리 드래그 감지
  const [{ isLeftEdgeOverMobile }, leftEdgeDropMobile] = useDrop({
    accept: "USER",
    drop: (item, monitor) => {
      if (!monitor.didDrop()) {
        handleUserDropToOuting(item.user);
        setIsDragHovering(false);
        return { dropped: true };
      }
      return undefined;
    },
    collect: (monitor) => ({
      isLeftEdgeOverMobile: monitor.isOver(),
    }),
    hover: (item, monitor) => {
      if (monitor.isOver()) {
        setActiveTab('outing');
        setIsDragHovering(true);
      }
    }
  });

  // 드래그 앤 드롭 설정 - 사이드바에서 외출중으로 변경 (임시 비활성화)
  const isOver = false;
  /*
  const [{ isOver }, drop] = useDrop({
    accept: "USER",
    drop: (item, monitor) => {
      // 이미 다른 곳에 드롭되지 않은 경우에만 처리
      if (!monitor.didDrop()) {
        const user = item.user;
        // 외출중 탭이 아닌 경우 자동으로 전환
        if (activeTab !== 'outing') {
          setActiveTab('outing');
        }
        handleUserDropToOuting(user);
        setIsDragHovering(false);
        return { dropped: true };
      }
      return undefined;
    },
    canDrop: (item) => {
      // 외출중이 아닌 유저만 사이드바로 드롭 가능
      return item.user.status !== 'outing';
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop(),
    }),
  });
  */

  // 외출 상태로 변경하는 함수
  const handleUserDropToOuting = async (user) => {
    const updateData = {
      status: "outing",
    };
    
    // 즉시 UI 업데이트 (낙관적 업데이트)
    startTransition(() => {
      updateOptimisticUsers({
        userId: user.id,
        changes: { status: "outing" }
      });
    });

    try {
      // 백그라운드에서 실제 API 호출
      const result = await updateUserMutation.mutateAsync({
        id: user.id,
        data: updateData,
      });
    } catch (error) {
    }
  };

  // 대기 상태로 변경하는 함수
  const handleUserClickToWait = async (user) => {
    const updateData = {
      status: "wait",
    };
    
    // 즉시 UI 업데이트 (낙관적 업데이트)
    startTransition(() => {
      updateOptimisticUsers({
        userId: user.id,
        changes: { status: "wait" }
      });
    });

    try {
      // 백그라운드에서 실제 API 호출
      const result = await updateUserMutation.mutateAsync({
        id: user.id,
        data: updateData,
      });
    } catch (error) {
    }
  };
  
  // 검색어 변경 핸들러
  const handleSearchChange = useCallback((e) => {
    e.preventDefault();
    setSearchQuery(e.target.value);
  }, []);
  
  // 검색어 초기화 핸들러
  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
  }, []);

  // 필터링된 사용자 목록 (오프라인 사용자만)
  const filteredUsers = useMemo(() => {
    if (!optimisticUsers) return [];
    let filtered = optimisticUsers;
    
    // 오프라인/온라인 필터링
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
  }, [optimisticUsers, selectedFilter, searchQuery]);

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

  const offlineCount = optimisticUsers?.filter((user) => !user.is_online).length || 0;
  const outingCount = outingUsers.length;
  const entranceCount = entranceUsers.length;

  return (
    <>
      {/* 좌측 드래그 감지 영역 - 데스크톱 - 드래그 중에만 활성화 */}
      {isGlobalDragging && (
        <div
          ref={leftEdgeDropDesktop}
          className={`hidden lg:block fixed left-0 top-0 w-20 h-full z-[60] transition-all duration-200  ${
            isLeftEdgeOverDesktop ? 'bg-orange-200/80' : ''
          }`}
          style={{ 
            pointerEvents: 'auto'
          }}
        >

          {isLeftEdgeOverDesktop && (
            <div className="flex items-center justify-center h-full pointer-events-none">
              <div className="text-orange-600 text-lg font-bold bg-white px-6 py-3 rounded-lg shadow-lg border-2 border-orange-500 pointer-events-none">
                🍽️ 외출중으로 변경
              </div>
            </div>
          )}
        </div>
      )}

      {/* 토글 버튼 - 데스크톱 */}
      <Button
        onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
        className={`
          hidden lg:flex items-center justify-center fixed z-[80] w-10 h-10 p-0 bg-white hover:bg-gray-50 border border-gray-200 transition-all duration-300 shadow-sm rounded-md
          ${isDesktopSidebarOpen ? 'left-[324px] top-[68px]' : 'left-4 top-16'}
        `}
        title="사용자 관리"
      >
        {isDesktopSidebarOpen ? (
          <X size={16} className="text-gray-600" />
        ) : (
          <Users size={16} className="text-gray-600" />
        )}
        {(offlineCount > 0 || outingCount > 0 || entranceCount > 0) && !isDesktopSidebarOpen && (
          <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {offlineCount + outingCount + entranceCount}
          </span>
        )}
      </Button>

      {/* 토글 버튼 - 태블릿 */}
      <Button
        onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        className="hidden md:flex lg:hidden fixed left-4 top-16 z-[80] w-10 h-10 p-0 bg-white hover:bg-gray-50 border border-gray-200 transition-all duration-200 shadow-sm rounded-md items-center justify-center"
        title="사용자 관리"
      >
        <Users size={16} className="text-gray-600" />
        {(offlineCount > 0 || outingCount > 0 || entranceCount > 0) && (
          <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {offlineCount + outingCount + entranceCount}
          </span>
        )}
      </Button>

      {/* 좌측 드래그 감지 영역 - 모바일 - 드래그 중에만 활성화 */}
      {isGlobalDragging && (
        <div
          ref={leftEdgeDropMobile}
          className={`lg:hidden fixed left-0 top-0 w-20 h-full z-[60] transition-all duration-200 ${
            isLeftEdgeOverMobile ? 'bg-orange-200/80' : ''
          }`}
          style={{ 
            pointerEvents: 'auto'
          }}
        >
          {isLeftEdgeOverMobile && (
            <div className="flex items-center justify-center h-full pointer-events-none">
              <div className="text-orange-600 text-lg font-bold bg-white px-6 py-3 rounded-lg shadow-lg border-2 border-orange-500 pointer-events-none">
                🍽️ 외출중으로 변경
              </div>
            </div>
          )}
        </div>
      )}

      {/* 토글 버튼 - 모바일 */}
      <Button
        onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        className={`lg:hidden fixed left-4 top-[64px] w-12 h-12 p-0 bg-white hover:bg-gray-50 border border-gray-200 transition-all duration-200 shadow-lg rounded-lg flex items-center justify-center ${
          isMobileDrawerOpen ? 'z-[95]' : 'z-[80]'
        }`}
        title="사용자 관리"
      >
        <Users size={18} className="text-gray-600" />
        {(offlineCount > 0 || outingCount > 0 || entranceCount > 0) && (
          <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {offlineCount + outingCount + entranceCount}
          </span>
        )}
      </Button>

      {/* 데스크톱 사이드바 (lg 이상) */}
      <div
        className={`
        hidden lg:block fixed left-0 top-0 h-screen w-80 bg-white border-r border-gray-100 transform transition-all duration-300 ease-in-out shadow-sm pt-[60px]
        ${isDesktopSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        ${(isOver || isDragHovering) ? "bg-orange-50 border-orange-200" : ""}
        ${isGlobalDragging ? "z-[35]" : "z-[55]"}
      `}
      >
        <SidebarContent 
          users={optimisticUsers}
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
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          outingUsers={outingUsers}
          entranceUsers={entranceUsers}
          onUserDropToOuting={handleUserDropToOuting}
          onUserClickToWait={handleUserClickToWait}
          isDragOver={isOver}
          isGlobalDragging={isGlobalDragging}
          isMobile={isMobile}
          allSessionGameCounts={allSessionGameCounts}
        />
      </div>

      {/* 모바일 오버레이 - 드로어 우측 영역만 */}
      {isMobileDrawerOpen && (
        <div
          className="fixed left-80 top-0 right-0 bottom-0 bg-black/30 z-[70] transition-opacity duration-300 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* 모바일 드로어 (lg 미만) */}
      <div
        className={`
        fixed left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-all duration-300 ease-in-out lg:hidden
        ${isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"}
        ${(isOver || isDragHovering) ? "bg-orange-50" : ""}
        ${isGlobalDragging ? "z-[35]" : "z-[85]"}
      `}
        onClick={(e) => e.stopPropagation()}
      >
        <SidebarContent 
          users={optimisticUsers}
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
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          outingUsers={outingUsers}
          entranceUsers={entranceUsers}
          onUserDropToOuting={handleUserDropToOuting}
          onUserClickToWait={handleUserClickToWait}
          isDragOver={isOver}
          isGlobalDragging={isGlobalDragging}
          isMobile={isMobile}
          allSessionGameCounts={allSessionGameCounts}
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