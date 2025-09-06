"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateSUser } from "@/hooks/useUser";

export default function EditUserModal({ isOpen, onClose, user }) {
  const [formData, setFormData] = useState({
    name: "",
  });
  const [errors, setErrors] = useState({});

  const updateUserMutation = useUpdateSUser();

  // 모달이 열릴 때 기존 사용자 데이터로 폼 초기화
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || "",
      });
      setErrors({});
    }
  }, [isOpen, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // 유효성 검사
    const newErrors = {};
    if (!formData.name?.trim()) {
      newErrors.name = "이름을 입력해주세요.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: {
          name: formData.name.trim(),
        },
      });
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || "사용자 수정에 실패했습니다." });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 에러 초기화
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleClose = () => {
    setFormData({ name: "" });
    setErrors({});
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] mx-3 sm:mx-0">
        <DialogHeader>
          <DialogTitle>사용자 수정</DialogTitle>
          <DialogDescription>
            사용자 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="사용자 이름을 입력하세요"
              className={errors.name ? "border-red-500" : ""}
              disabled={updateUserMutation.isPending}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {errors.submit && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
              {errors.submit}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateUserMutation.isPending}
              className="order-2 sm:order-1 w-full sm:w-auto"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={updateUserMutation.isPending}
              className="order-1 sm:order-2 w-full sm:w-auto"
            >
              {updateUserMutation.isPending ? "수정 중..." : "수정"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}