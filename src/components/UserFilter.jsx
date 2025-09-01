"use client";

import { Users, UserCheck, UserX } from "lucide-react";

const filterOptions = [
  { id: "all", label: "전체", icon: Users },
  { id: "online", label: "온라인", icon: UserCheck },
  { id: "offline", label: "오프라인", icon: UserX },
];

export default function UserFilter({ selectedFilter, onFilterChange }) {
  return (
    <div className="flex border-b border-gray-200">
      {filterOptions.map((option) => {
        const IconComponent = option.icon;
        const isActive = selectedFilter === option.id;
        
        return (
          <button
            key={option.id}
            onClick={() => onFilterChange(option.id)}
            className={`
              relative flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-medium transition-all duration-150 flex-1 whitespace-nowrap
              ${isActive 
                ? 'text-gray-900' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <IconComponent size={12} />
            <span>{option.label}</span>
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>
        );
      })}
    </div>
  );
}


