import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";

dayjs.extend(relativeTime);
dayjs.locale("ko");

export const formatDate = (date) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

export const formatRelativeTime = (date) => {
  return dayjs(date).fromNow();
};

export const calculateWaitTime = (user) => {
  if (!user.status || user.status === "wait") {
    // 대기 상태인 경우, online_at 시간을 기준으로 대기 시간 계산
    if (user.online_at) {
      return dayjs().diff(dayjs(user.online_at), "minute");
    }
    return 0;
  }
  return 0;
};

export const formatWaitTime = (minutes) => {
  if (minutes < 1) {
    return "방금 전";
  } else if (minutes < 60) {
    return `${minutes}분`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}시간`;
    } else {
      return `${hours}시간 ${remainingMinutes}분`;
    }
  }
};

export const getWaitTimeDisplay = (user) => {
  const waitMinutes = calculateWaitTime(user);
  return formatWaitTime(waitMinutes);
};
