"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { sUserApi } from "@/services/s_user";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";

export default function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const [isSettingOffline, setIsSettingOffline] = useState(false);
  const queryClient = useQueryClient();

  // Don't show nav on login/signup pages
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }


  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const handleSetAllOffline = async () => {
    if (isSettingOffline) return;
    
    try {
      setIsSettingOffline(true);
      await sUserApi.setAllOffline();
      
      // React Query 캐시 무효화로 실시간 업데이트
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.s_users] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.s_user_counts] });
      
      alert("모든 온라인 유저가 오프라인으로 변경되었습니다.");
    } catch (error) {
      alert("오프라인 설정에 실패했습니다.");
    } finally {
      setIsSettingOffline(false);
    }
  };

  return (
    <nav className="h-[60px] bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left side */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src="/image/cnb-billiards-club.svg" 
                alt="CNB Billiards Club" 
                className="h-6 sm:h-7 lg:h-8 w-auto"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Login button - only show if user is NOT logged in */}
            {!user && (
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-auto"
                >
                  로그인
                </Button>
              </Link>
            )}
            
            {/* Offline All button - only show if user is logged in */}
            {user && (
              <Button
                onClick={handleSetAllOffline}
                disabled={isSettingOffline}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-auto"
              >
                {isSettingOffline ? "처리중..." : "전체 오프라인"}
              </Button>
            )}
            
            {/* Logout button - only show if user is logged in */}
            {user && (
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-auto"
              >
                로그아웃
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
