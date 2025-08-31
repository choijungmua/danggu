import dayjs from "@/lib/dayjs";
import {
  getTableStatusLabel,
  getTableStatusColor,
} from "@/constants/tableStatus";

/**
 * 온라인 상태인 사용자만 필터링
 * @param {Array} users - 사용자 배열
 * @returns {Array} 온라인 사용자 배열
 */
export const filterOnlineUsers = (users) => {
  if (!Array.isArray(users)) return [];
  return users.filter((user) => user.is_online === true);
};

/**
 * 사용자를 online_at 기준으로 최신순 정렬
 * @param {Array} users - 사용자 배열
 * @returns {Array} 정렬된 사용자 배열
 */
export const sortUsersByOnlineTime = (users) => {
  if (!Array.isArray(users)) return [];

  return [...users].sort((a, b) => {
    const dateA = dayjs(a.online_at || a.created_at);
    const dateB = dayjs(b.online_at || b.created_at);
    return dateB.diff(dateA);
  });
};

/**
 * 온라인 사용자를 필터링하고 최신순으로 정렬
 * @param {Array} users - 사용자 배열
 * @returns {Array} 필터링 및 정렬된 온라인 사용자 배열
 */
export const getOnlineUsersSorted = (users) => {
  return users
    .filter((user) => user.is_online)
    .sort((a, b) => {
      // online_at이 있는 경우 시간순으로 정렬
      if (a.online_at && b.online_at) {
        return new Date(b.online_at) - new Date(a.online_at);
      }
      // online_at이 없는 경우 이름순으로 정렬
      return a.name.localeCompare(b.name);
    });
};

export const getWaitUsers = (users) => {
  return users.filter((user) => user.status === "wait" && user.is_online);
};

export const getMealUsers = (users) => {
  return users.filter((user) => user.status === "meal" && user.is_online);
};

/**
 * 사용자의 온라인 상태에 따른 배지 색상 반환
 * @param {boolean} isOnline - 온라인 상태
 * @returns {string} 배지 클래스명
 */
export const getUserOnlineStatusBadgeClass = (isOnline) => {
  return isOnline
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-gray-100 text-gray-800 border-gray-200";
};

/**
 * 사용자의 온라인 상태 텍스트 반환
 * @param {boolean} isOnline - 온라인 상태
 * @returns {string} 상태 텍스트
 */
export const getUserOnlineStatusText = (isOnline) => {
  return isOnline ? "온라인" : "오프라인";
};

/**
 * 사용자의 테이블 상태 라벨 반환
 * @param {string} status - 테이블 상태
 * @returns {string} 상태 라벨
 */
export const getUserTableStatusLabel = (status) => {
  if (!status) return "대기";

  if (status === "wait") return "대기";
  if (status === "meal") return "식사";
  if (status.startsWith("g_")) {
    const tableNumber = status.substring(2);
    return `테이블 ${tableNumber}`;
  }

  return "대기";
};

/**
 * 사용자의 테이블 상태에 따른 배지 색상 반환
 * @param {string} status - 테이블 상태
 * @returns {string} 배지 클래스명
 */
export const getUserTableStatusBadgeClass = (status) => {
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
