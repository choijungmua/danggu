import { useDrag } from "react-dnd";
import { X } from "lucide-react";
import {
  getUserTableStatusLabel,
  getUserTableStatusBadgeClass,
} from "@/utils/userUtils";

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
  isSelected = false,
  isMobile = false,
}) {
  const [{ isDragging }, drag] = useDrag({
    type: "USER",
    item: () => {
      console.log('=== 드래그 아이템 생성 ===', user.name, user.status);
      return { user };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => {
      // 모바일에서는 드래그 비활성화
      if (isMobile) return false;
      const result = !isModalUser;
      console.log('=== canDrag 체크 ===', user.name, 'status:', user.status, 'canDrag:', result, 'isModalUser:', isModalUser);
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
      ? "px-2 py-1 font-medium transition-all bg-zinc-100 text-zinc-700 rounded-md cursor-pointer text-xs sm:text-sm"
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

  return (
    <div
      ref={(node) => {
        if (user.status === 'outing') {
          console.log('=== 외출중 유저 ref 연결 ===', user.name, 'node:', node);
        }
        // 모바일에서는 드래그 ref 적용 안 함
        if (!isMobile) {
          drag(node);
        }
      }}
      onClick={() => onClick(user)}
      className={getContainerClasses()}
      style={{ 
        cursor: isModalUser ? "pointer" : 
               isMobile ? "pointer" : 
               (isDragging ? "grabbing" : "grab") 
      }}
    >
      <div className={`flex items-center justify-between gap-${isTableUser ? "2" : "2 sm:gap-3"}`}>
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className={`${isTableUser ? "text-xs sm:text-sm" : "text-sm sm:text-base font-semibold"} ${
              isModalUser ? "text-zinc-900" : "text-zinc-900"
            } truncate`}
          >
            {user.name}
          </span>
          {showWaitTime && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
              <span className="text-xs text-zinc-500 truncate">
                대기: {waitTimeDisplay}
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 text-xs rounded-md bg-zinc-200 text-zinc-700 self-start">
                대기중
              </span>
            </div>
          )}
          {!isTableUser && !showWaitTime && !isModalUser && (
            <span
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-md ${getStatusColor()} self-start mt-1`}
            >
              {getStatusLabel()}
            </span>
          )}
        </div>

        {showCloseButton && onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(user);
            }}
            className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-zinc-200 hover:bg-red-100 text-zinc-500 hover:text-red-600 flex items-center justify-center transition-colors"
            title="오프라인으로 전환"
          >
            <X size={10} className="sm:hidden" />
            <X size={12} className="hidden sm:block" />
          </button>
        )}
      </div>
    </div>
  );
}
