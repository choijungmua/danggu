import dayjs from 'dayjs';
import 'dayjs/locale/ko';

// 한국 로케일 설정
dayjs.locale('ko');

/**
 * 현재 한국 시간을 ISO 문자열로 반환
 * @returns {string} 한국 시간대 기준 ISO 문자열  
 */
export function getKoreanISOString() {
  // 한국은 UTC+9이므로 9시간을 더함
  return dayjs().add(9, 'hour').toISOString();
}

/**
 * 주어진 날짜를 한국 시간대로 변환
 * @param {string|Date} date - 변환할 날짜
 * @returns {string} 한국 시간대 기준 ISO 문자열
 */
export function toKoreanTime(date) {
  if (!date) return getKoreanISOString();
  return dayjs(date).add(9, 'hour').toISOString();
}

/**
 * 디버깅용: 현재 시간을 여러 형식으로 출력
 */
export function debugTimeInfo() {
  const now = dayjs();
  const koreanTime = now.add(9, 'hour');
  
}