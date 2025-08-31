"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, User, Power, PowerOff } from "lucide-react";
import {
  getUserTableStatusLabel,
  getUserTableStatusBadgeClass,
} from "@/utils/userUtils";

export default function UserStatusModal({ user, isOpen, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    status: user?.status || "wait",
    is_online: user?.is_online || false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // user prop이 변경될 때마다 formData 초기화
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        status: user.status || "wait",
        is_online: user.is_online || false,
      });
      setError(null);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdate({
        id: user.id,
        data: formData,
      });
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      setError(error.message || "사용자 정보 업데이트에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserTableStatusBadgeClass = (status) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";

    if (status === "wait")
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (status === "meal")
      return "bg-orange-100 text-orange-800 border-orange-200";
    if (status.startsWith("g_")) {
      return "bg-green-100 text-green-800 border-green-200";
    }

    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getUserTableStatusLabel = (status) => {
    if (!status) return "대기";

    if (status === "wait") return "대기";
    if (status === "meal") return "식사";
    if (status.startsWith("g_")) {
      const tableNumber = status.substring(2);
      return `테이블 ${tableNumber}`;
    }

    return "대기";
  };

  const statusOptions = [
    { key: "wait", label: "대기" },
    { key: "meal", label: "식사" },
    { key: "g_1", label: "테이블 1" },
    { key: "g_2", label: "테이블 2" },
    { key: "g_3", label: "테이블 3" },
    { key: "g_4", label: "테이블 4" },
    { key: "g_5", label: "테이블 5" },
    { key: "g_6", label: "테이블 6" },
    { key: "g_7", label: "테이블 7" },
    { key: "g_8", label: "테이블 8" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-md border-0 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                사용자 정보 수정
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                사용자 상태를 변경하세요
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
          >
            <X size={16} className="text-gray-500" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 사용자 이름 */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                사용자 이름
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="사용자 이름을 입력하세요"
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* 온라인 상태 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                온라인 상태
              </Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, is_online: true }))
                  }
                  disabled={isSubmitting}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    formData.is_online
                      ? "bg-green-50 text-green-700 border-green-200 shadow-sm"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Power size={16} />
                  온라인
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, is_online: false }))
                  }
                  disabled={isSubmitting}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    !formData.is_online
                      ? "bg-red-50 text-red-700 border-red-200 shadow-sm"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <PowerOff size={16} />
                  오프라인
                </button>
              </div>
            </div>

            {/* 테이블 상태 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                상태 선택
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {statusOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, status: option.key }))
                    }
                    disabled={isSubmitting}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      formData.status === option.key
                        ? `${getUserTableStatusBadgeClass(
                            option.key
                          )} border-current shadow-sm`
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                    } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border-gray-200 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    저장 중...
                  </div>
                ) : (
                  "저장"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
