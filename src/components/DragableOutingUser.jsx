import React from 'react';
import { useDrag } from "react-dnd";
import {
  getUserTableStatusLabel,
  getUserTableStatusBadgeClass,
} from "@/utils/userUtils";

export function DragableOutingUser({user, onClick, isMobile = false, sessionGameCount = 0, showGameCount = false}) {
  const [{ isDragging }, drag] = useDrag({
    type: "USER",
    item: () => {
      return { user };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => {
      // 모바일에서는 드래그 비활성화
      if (isMobile) return false;
      return true;
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      
      // 드롭 결과가 있으면 처리되었으므로 추가 처리 안함
      if (dropResult && dropResult.dropped) {
        return;
      }
      
      // 허공으로 던진 경우 (드롭되지 않은 경우) - 대기 상태로 변경
      if (!monitor.didDrop()) {
        if (onClick) {
          setTimeout(() => {
            onClick(user);
          }, 100);
        }
      }
    },
  });

  const getStatusColor = () => {
    return getUserTableStatusBadgeClass(user.status);
  };

  const getStatusLabel = () => {
    return getUserTableStatusLabel(user.status);
  };

  const getContainerClasses = () => {
    let baseClasses = "px-4 py-3 bg-white rounded-xl font-medium hover:bg-zinc-50 transition-all cursor-grab border border-zinc-200 mb-3";

    if (isDragging) {
      baseClasses += " opacity-50 scale-95";
    }

    baseClasses += " hover:scale-[1.02] text-zinc-900";

    return baseClasses;
  };

  return (
    <div
      ref={isMobile ? null : drag}
      onClick={() => onClick(user)}
      className={getContainerClasses()}
      style={{ cursor: isMobile ? "pointer" : (isDragging ? "grabbing" : "grab") }}
    >
      <div className="relative w-full">
        <div className="flex flex-col">
          <div className="relative w-full">
            <span 
              className={`font-semibold text-zinc-900 block overflow-hidden text-ellipsis whitespace-nowrap ${
                showGameCount ? 'pr-12' : ''
              }`}
            >
              {user.name}
            </span>
            {showGameCount && (
              <span className="absolute top-0 right-0 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap z-10">
                {sessionGameCount || 0}회
              </span>
            )}
          </div>
          <span className={`px-2 py-1 text-xs rounded-md ${getStatusColor()} self-start mt-1`}>
            {getStatusLabel()}
          </span>
        </div>
      </div>
    </div>
  );
}