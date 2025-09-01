import { useDrag } from "react-dnd";
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
}) {
  const [{ isDragging }, drag] = useDrag({
    type: "USER",
    item: () => ({ user }), // 함수로 변경하여 최신 user 데이터 보장
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => !isModalUser, // 모달 내부에서는 드래그 비활성화
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
      ? "px-2 py-1 font-medium transition-all bg-zinc-100 text-zinc-700 rounded-md cursor-pointer"
      : "px-4 py-3 bg-white rounded-xl font-medium hover:bg-zinc-50 transition-all cursor-pointer border border-zinc-200";

    if (isDragging) {
      baseClasses += " opacity-50 scale-95";
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
      ref={drag}
      onClick={() => onClick(user)}
      className={getContainerClasses()}
      style={{ cursor: isModalUser ? "pointer" : (isDragging ? "grabbing" : "grab") }}
    >
      <div className={`flex items-center gap-${isTableUser ? "2" : "3"}`}>

        <div className="flex flex-col">
          <span
            className={`${isTableUser ? "text-sm" : "font-semibold"} ${
              isModalUser ? "text-zinc-900" : "text-zinc-900"
            }`}
          >
            {user.name}
          </span>
          {showWaitTime && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">
                대기 시간: {waitTimeDisplay}
              </span>
              <span className="px-2 py-0.5 text-xs rounded-md bg-zinc-200 text-zinc-700">
                대기중
              </span>
            </div>
          )}
          {!isTableUser && !showWaitTime && !isModalUser && (
            <span
              className={`px-2 py-1 text-xs rounded-md ${getStatusColor()}`}
            >
              {getStatusLabel()}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
