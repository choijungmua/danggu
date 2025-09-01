"use client";

import { memo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

const SearchInput = memo(({ searchQuery, onSearchChange, onSearchClear }) => {
  const inputRef = useRef(null);
  const wasFocused = useRef(false);

  useEffect(() => {
    if (wasFocused.current && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchQuery]);

  const handleFocus = () => {
    wasFocused.current = true;
  };

  const handleBlur = () => {
    wasFocused.current = false;
  };

  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="사용자 이름 검색..."
        value={searchQuery}
        onChange={onSearchChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full pl-9 pr-8 text-sm"
      />
      {searchQuery && (
        <button
          onClick={onSearchClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
});

SearchInput.displayName = "SearchInput";

export default SearchInput;