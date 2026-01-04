/**
 * 시간 변환 유틸리티 (Luxon 사용)
 *
 * 서버: UTC 기준으로 저장 (Instant를 ISO-8601 형식으로 전송)
 * 클라이언트: 한국 시간(KST, UTC+9)으로 표시
 */

import { DateTime } from 'luxon';

const KOREA_TIMEZONE = 'Asia/Seoul';

/**
 * UTC ISO 문자열을 한국 시간 DateTime 객체로 변환
 * @param utcString - ISO 8601 UTC 문자열 (예: "2024-01-03T10:30:00Z")
 * @returns Luxon DateTime 객체 (한국 시간대)
 */
function toKST(utcString: string): DateTime {
  return DateTime.fromISO(utcString, { zone: 'utc' }).setZone(KOREA_TIMEZONE);
}

/**
 * UTC ISO 문자열을 한국 날짜만 포맷팅
 * @param utcString - ISO 8601 UTC 문자열
 * @returns 한국 날짜 문자열 (예: "2024년 1월 3일")
 */
export function formatKSTDate(utcString: string): string {
  return toKST(utcString).toFormat('yyyy년 M월 d일');
}

/**
 * UTC ISO 문자열을 한국 시간만 포맷팅
 * @param utcString - ISO 8601 UTC 문자열
 * @returns 한국 시간 문자열 (예: "오후 7:30:00")
 */
export function formatKSTTime(utcString: string): string {
  const dt = toKST(utcString);
  const hour = dt.hour;
  const period = hour >= 12 ? '오후' : '오전';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${period} ${displayHour}:${dt.toFormat('mm:ss')}`;
}

/**
 * UTC ISO 문자열을 한국 날짜+시간 포맷팅
 * @param utcString - ISO 8601 UTC 문자열
 * @returns 한국 날짜+시간 문자열 (예: "2024년 1월 3일 오후 7:30:00")
 */
export function formatKSTDateTime(utcString: string): string {
  const dt = toKST(utcString);
  const date = dt.toFormat('yyyy년 M월 d일');
  const hour = dt.hour;
  const period = hour >= 12 ? '오후' : '오전';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const time = `${period} ${displayHour}:${dt.toFormat('mm:ss')}`;
  return `${date} ${time}`;
}

/**
 * UTC ISO 문자열을 간결한 한국 날짜+시간 포맷팅
 * @param utcString - ISO 8601 UTC 문자열
 * @returns 간결한 날짜+시간 (예: "2024.01.03 19:30")
 */
export function formatKSTShort(utcString: string): string {
  return toKST(utcString).toFormat('yyyy.MM.dd HH:mm');
}

/**
 * 한국 시간 기준 현재 날짜를 YYYY-MM-DD 형식으로 반환
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export function getCurrentKSTDate(): string {
  return DateTime.now().setZone(KOREA_TIMEZONE).toFormat('yyyy-MM-dd');
}

/**
 * 로컬 날짜를 UTC ISO 문자열로 변환 (서버 전송용)
 * @param localDate - 로컬 Date 객체
 * @returns UTC ISO 8601 문자열
 */
export function toUTCString(localDate: Date): string {
  return DateTime.fromJSDate(localDate).toUTC().toISO() || '';
}

/**
 * YYYY-MM-DD 형식 날짜 문자열을 한국 시간대 DateTime으로 변환
 * @param dateString - YYYY-MM-DD 형식 문자열
 * @returns Luxon DateTime 객체
 */
export function parseKSTDate(dateString: string): DateTime {
  return DateTime.fromFormat(dateString, 'yyyy-MM-dd', { zone: KOREA_TIMEZONE });
}

/**
 * UTC ISO 문자열을 상대 시간으로 표시 (예: "3분 전", "2시간 전")
 * @param utcString - ISO 8601 UTC 문자열
 * @returns 상대 시간 문자열
 */
export function formatRelativeTime(utcString: string): string {
  const dt = toKST(utcString);
  const now = DateTime.now().setZone(KOREA_TIMEZONE);
  const diff = now.diff(dt, ['days', 'hours', 'minutes', 'seconds']);

  const days = Math.floor(diff.days);
  const hours = Math.floor(diff.hours);
  const minutes = Math.floor(diff.minutes);
  const seconds = Math.floor(diff.seconds);

  if (seconds < 60) {
    return '방금 전';
  } else if (minutes < 60) {
    return `${minutes}분 전`;
  } else if (hours < 24) {
    return `${hours}시간 전`;
  } else if (days < 7) {
    return `${days}일 전`;
  } else {
    return formatKSTDate(utcString);
  }
}

/**
 * 두 날짜 사이의 일수 차이 계산
 * @param startDate - 시작 날짜 (ISO 문자열)
 * @param endDate - 종료 날짜 (ISO 문자열)
 * @returns 일수 차이
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = DateTime.fromISO(startDate);
  const end = DateTime.fromISO(endDate);
  return Math.floor(end.diff(start, 'days').days);
}

/**
 * Date 객체를 YYYY-MM-DD 형식으로 변환 (타임존 변환 없이)
 * @param date - JavaScript Date 객체
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
