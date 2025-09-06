import { useDrag } from "react-dnd";
import { X, UserCheck, Power } from "lucide-react";
import { useState, useRef } from "react";
import {
  getUserTableStatusLabel,
  getUserTableStatusBadgeClass,
} from "@/utils/userUtils";
import { useAuthStore } from "@/stores/authStore";

export default function DraggableUser({
  user,
  onClick,
  isOffline = false,
  isTableUser = false,
  isModalUser = false,
  className = "",
  showWaitTime = false,
  waitTimeDisplay = "",
  showCloseButton = false,
  onClose,
  onMoveToEntrance,
  isSelected = false,
  isMobile = false,
  sessionGameCount = 0,
  showGameCount = false,
  isDraggable = true,
}) {
  const { user: authUser } = useAuthStore();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const [{ isDragging }, drag] = useDrag({
    type: "USER",
    item: () => {
      return { user };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => {
      // isDraggable이 false면 드래그 불가 (게임 중일 때)
      if (!isDraggable) return false;
      // 모바일에서는 드래그 비활성화
      if (isMobile) return false;
      // 로그인하지 않은 사용자는 드래그 비활성화
      if (!authUser) return false;
      const result = !isModalUser;
      return result;
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      
      // 드롭 결과가 있으면 처리되었으므로 추가 처리 안함
      if (dropResult && dropResult.dropped) {
        return;
      }
      
      // 허공으로 던진 경우 (드롭되지 않은 경우)
      if (!monitor.didDrop()) {
        // 테이블 내부 사용자인 경우에만 대기 상태로 변경
        if (isTableUser && onClick) {
          // 약간의 딜레이를 추가하여 드롭 이벤트 완료 대기
          setTimeout(() => {
            onClick(user);
          }, 100);
        }
      }
    },
  });

  const getStatusColor = () => {
    if (isOffline) {
      return "bg-gray-100 text-gray-600";
    }
    if (isTableUser) {
      return "bg-blue-100 text-blue-700";
    }
    return getUserTableStatusBadgeClass(user.status);
  };

  const getStatusLabel = () => {
    if (isOffline) {
      return "오프라인";
    }
    if (isTableUser) {
      return "테이블";
    }
    return getUserTableStatusLabel(user.status);
  };

  const getContainerClasses = () => {
    if (isModalUser) {
      // 모달 내부에서는 배경 없이 깔끔하게
      return `px-3 py-2 text-zinc-900 font-medium transition-all ${className}`;
    }
    
    let baseClasses = isTableUser
      ? "px-1.5 py-1 font-medium transition-all bg-zinc-100 text-zinc-700 rounded-md cursor-pointer text-xs overflow-visible"
      : className?.includes('w-20') || className?.includes('w-24') || className?.includes('w-full')
      ? "px-1 py-1 bg-white rounded-md font-medium hover:bg-zinc-50 transition-all cursor-pointer border border-zinc-200 text-xs min-w-0 flex-shrink-0 overflow-hidden h-full"
      : "px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-lg sm:rounded-xl font-medium hover:bg-zinc-50 transition-all cursor-pointer border border-zinc-200 min-w-0 flex-shrink-0";

    if (isDragging) {
      baseClasses += " opacity-50 scale-95";
    }

    if (isSelected) {
      baseClasses += " ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 border-blue-300";
    }

    if (isOffline) {
      baseClasses += " border-zinc-300 bg-zinc-100 text-zinc-600";
    }

    if (isTableUser) {
      baseClasses += " hover:bg-zinc-200";
    } else {
      baseClasses += " hover:scale-[1.02] text-zinc-900";
    }

    return `${baseClasses} ${className}`;
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200); // 200ms 딜레이
  };

  const handleMenuMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMenuMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200); // 200ms 딜레이
  };

  return (
    <div className="relative">
      <div
        ref={(node) => {
          if (user.status === 'outing') {
            }
          // 모바일에서는 드래그 ref 적용 안 함
          if (!isMobile) {
            drag(node);
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => onClick(user)}
        className={getContainerClasses()}
        style={{ 
          cursor: isModalUser ? "pointer" : 
                 isMobile ? "pointer" : 
                 !authUser ? "default" :
                 (isDragging ? "grabbing" : "grab") 
        }}
      >
        <div className={`relative w-full min-w-0 ${showGameCount ? 'pt-1' : ''}`}>
          {/* 게임 횟수 - 우측 상단에 작게 배치 */}
          {showGameCount && (
            <span className="absolute -top-1 -right-1 text-xs bg-blue-500 text-white px-1 py-0.5 rounded font-medium whitespace-nowrap z-5 leading-none">
              {sessionGameCount || 0}
            </span>
          )}
          <div className="flex flex-col justify-center min-h-0 h-full">
            <div className="relative w-full min-w-0">
              <span
                className={`${isTableUser ? "text-xs" : className?.includes('w-20') || className?.includes('w-24') || className?.includes('w-full') ? "text-xs font-medium" : "text-sm sm:text-base font-semibold"} ${
                  isModalUser ? "text-zinc-900" : "text-zinc-900"
                } block truncate leading-none ${showGameCount ? 'pr-4' : ''}`}
                title={user.name}
              >
                {user.name}
              </span>
            </div>
            {showWaitTime && !isModalUser && !(className?.includes('w-20') || className?.includes('w-24') || className?.includes('w-full')) && (
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-xs text-zinc-500 truncate">
                  {waitTimeDisplay}
                </span>
                <span className="px-1 py-0.5 text-xs rounded bg-zinc-200 text-zinc-700 self-start whitespace-nowrap">
                  대기중
                </span>
              </div>
            )}
            {showWaitTime && (className?.includes('w-20') || className?.includes('w-24') || className?.includes('w-full')) && (
              <div className="flex items-center justify-center mt-1">
                <span className="text-xs text-zinc-500 truncate text-center">
                  {waitTimeDisplay}
                </span>
              </div>
            )}
            {showWaitTime && isModalUser && (
              <div className="flex items-center justify-between mt-1 gap-1">
                <span className="text-xs text-zinc-500 truncate flex-1">
                  {waitTimeDisplay}
                </span>
                <span className="px-1 py-0.5 text-xs rounded bg-zinc-200 text-zinc-700 whitespace-nowrap flex-shrink-0">
                  대기
                </span>
              </div>
            )}
            {!isTableUser && !showWaitTime && !isModalUser && (
              <div className="flex justify-center mt-1">
                <span
                  className={`px-1 py-0.5 text-xs rounded ${getStatusColor()} whitespace-nowrap text-center`}
                >
                  {getStatusLabel()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 호버 시 나타나는 액션 버튼들 - 대기중 사용자만 */}
      {isHovered && showWaitTime && authUser && !isMobile && (
        <div 
          className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-1 flex gap-1 min-w-max whitespace-nowrap"
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveToEntrance && onMoveToEntrance(user);
              setIsHovered(false);
            }}
            className="flex-1 flex items-center justify-center px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors whitespace-nowrap"
            title="입장으로 이동"
          >
            입장
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose && onClose(user);
              setIsHovered(false);
            }}
            className="flex-1 flex items-center justify-center px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors whitespace-nowrap"
            title="오프라인으로 전환"
          >
            종료
          </button>
        </div>
      )}
    </div>
  );
}
