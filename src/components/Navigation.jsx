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
              <img 
                src="/image/cnb-billiards-club.svg" 
                alt="CNB Billiards Club" 
                className="h-8 w-auto"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">


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
