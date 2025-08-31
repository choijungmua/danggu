"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown, Users, UserCheck, UserX } from "lucide-react";

const filterOptions = [
  { id: "all", label: "전체 사용자", icon: Users },
  { id: "online", label: "온라인 사용자", icon: UserCheck },
  { id: "offline", label: "오프라인 사용자", icon: UserX },
];

export default function UserFilter({ selectedFilter, onFilterChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption =
    filterOptions.find((option) => option.id === selectedFilter) ||
    filterOptions[0];

  const handleFilterSelect = (filterId) => {
    onFilterChange(filterId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-200"
      >
        <Filter size={16} className="text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {selectedOption.label}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {filterOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => handleFilterSelect(option.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    selectedFilter === option.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  <IconComponent size={16} />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

