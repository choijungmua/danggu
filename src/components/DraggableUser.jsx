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
  className = "",
}) {
  const [{ isDragging }, drag] = useDrag({
    type: "USER",
    item: { user },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      // 허공으로 던진 경우 (드롭되지 않은 경우)
      if (!monitor.didDrop()) {
        // 테이블 내부 사용자인 경우에만 대기 상태로 변경
        if (isTableUser && onClick) {
          onClick(user);
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
    let baseClasses = isTableUser
      ? "px-2 py-1 bg-white rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition-all cursor-pointer border border-gray-200"
      : "px-4 py-3 bg-white rounded-2xl text-gray-900 font-medium hover:bg-gray-50 transition-all cursor-pointer border border-gray-200";

    if (isDragging) {
      baseClasses += " opacity-50 scale-95";
    }

    if (isOffline) {
      baseClasses += " border-gray-300 bg-gray-50";
    }

    if (isTableUser) {
      baseClasses += " border-blue-200 bg-blue-50 hover:bg-blue-100";
    } else {
      baseClasses += " hover:scale-[1.02]";
    }

    return `${baseClasses} ${className}`;
  };

  return (
    <div
      ref={drag}
      onClick={() => onClick(user)}
      className={getContainerClasses()}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <div className={`flex items-center gap-${isTableUser ? "2" : "3"}`}>
        <div
          className={`${
            isTableUser ? "w-6 h-6" : "w-8 h-8"
          } rounded-full flex items-center justify-center ${
            isTableUser ? "bg-blue-200" : "bg-gray-100"
          }`}
        >
          <span
            className={`${isTableUser ? "text-xs" : "text-sm"} font-semibold ${
              isTableUser ? "text-blue-700" : "text-gray-600"
            }`}
          >
            {user.name.charAt(0)}
          </span>
        </div>
        <div className="flex flex-col">
          <span
            className={`${isTableUser ? "text-sm" : "font-semibold"} ${
              isOffline
                ? "text-gray-600"
                : isTableUser
                ? "text-blue-900"
                : "text-gray-900"
            }`}
          >
            {user.name}
          </span>
          {!isTableUser && (
            <span
              className={`px-2 py-1 text-xs rounded-full border ${getStatusColor()}`}
            >
              {getStatusLabel()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
