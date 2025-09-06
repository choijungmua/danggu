"use client";

import { Users, UserCheck, UserX } from "lucide-react";
import { useSUserCounts } from "@/hooks/useUser";

const filterOptions = [
  { id: "all", label: "전체", icon: Users },
  { id: "online", label: "온라인", icon: UserCheck },
  { id: "offline", label: "오프라인", icon: UserX },
];

export default function UserFilter({ selectedFilter, onFilterChange }) {
  // 직접 데이터베이스에서 카운트 가져오기
  const { data: counts = { total: 0, online: 0, offline: 0 } } = useSUserCounts();
  
  // 각 필터별 사용자 수 반환
  const getUserCount = (filterId) => {
    switch (filterId) {
      case "all":
        return counts.total;
      case "online":
        return counts.online;
      case "offline":
        return counts.offline;
      default:
        return 0;
    }
  };

  return (
    <div className="flex border-b border-gray-200">
      {filterOptions.map((option) => {
        const IconComponent = option.icon;
        const isActive = selectedFilter === option.id;
        const count = getUserCount(option.id);
        
        return (
          <button
            key={option.id}
            onClick={() => onFilterChange(option.id)}
            className={`
              relative flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all duration-150 flex-1 whitespace-nowrap
              ${isActive 
                ? 'text-gray-900' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <IconComponent size={12} />
            <span>{option.label} ({count})</span>
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>
        );
      })}
    </div>
  );
}


