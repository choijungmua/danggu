"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

export default function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();

  // Don't show nav on login/signup pages
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  // Don't show nav if user is not logged in
  if (!user) {
    return null;
  }

  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="h-[60px] bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left side */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Danggu</h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* User info */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {user?.email?.split("@")[0]}
                </span>
                <span className="text-xs text-gray-500">관리자</span>
              </div>
            </div>

            {/* Logout button */}
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
