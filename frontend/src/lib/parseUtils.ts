import { DateTime } from 'luxon';

/**
 * 날짜 문자열을 파싱하여 YYYY-MM-DD 형식으로 반환
 * @param dateStr 날짜 문자열 (예: "어제", "그저께", "3일 전", "12.25", "어제 오후 3시")
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export const parseDate = (dateStr: string): string => {
  const now = DateTime.now().setZone('Asia/Seoul');

  // 시간 정보를 제거한 순수 날짜 부분 추출
  const cleanDateStr = dateStr
    .replace(/\s*(오전|오후)?\s*\d{1,2}시(\s*\d{1,2}분)?/g, '')
    .trim();

  // 1. 상대적 날짜 표현
  // "오늘"
  if (cleanDateStr === '오늘' || cleanDateStr === '') {
    return now.toFormat('yyyy-MM-dd');
  }

  // "어제"
  if (cleanDateStr === '어제' || cleanDateStr.startsWith('어제')) {
    return now.minus({ days: 1 }).toFormat('yyyy-MM-dd');
  }

  // "그저께" 또는 "그제"
  if (cleanDateStr === '그저께' || cleanDateStr === '그제') {
    return now.minus({ days: 2 }).toFormat('yyyy-MM-dd');
  }

  // "N일 전" (예: "3일 전", "5일전")
  const daysAgoPattern = /^(\d+)일\s*전$/;
  const daysAgoMatch = cleanDateStr.match(daysAgoPattern);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    return now.minus({ days }).toFormat('yyyy-MM-dd');
  }

  // "N주 전" (예: "2주 전")
  const weeksAgoPattern = /^(\d+)주\s*전$/;
  const weeksAgoMatch = cleanDateStr.match(weeksAgoPattern);
  if (weeksAgoMatch) {
    const weeks = parseInt(weeksAgoMatch[1], 10);
    return now.minus({ weeks }).toFormat('yyyy-MM-dd');
  }

  // "N개월 전" 또는 "N달 전" (예: "2개월 전", "3달 전")
  const monthsAgoPattern = /^(\d+)(개월|달)\s*전$/;
  const monthsAgoMatch = cleanDateStr.match(monthsAgoPattern);
  if (monthsAgoMatch) {
    const months = parseInt(monthsAgoMatch[1], 10);
    return now.minus({ months }).toFormat('yyyy-MM-dd');
  }

  // "지난주" 또는 "저번주"
  if (cleanDateStr === '지난주' || cleanDateStr === '저번주') {
    return now.minus({ weeks: 1 }).toFormat('yyyy-MM-dd');
  }

  // "지난달" 또는 "저번달"
  if (cleanDateStr === '지난달' || cleanDateStr === '저번달') {
    return now.minus({ months: 1 }).toFormat('yyyy-MM-dd');
  }

  // 2. 요일 기반 표현
  // "지난주 월요일", "저번주 화요일" 등
  const lastWeekdayPattern = /^(지난주|저번주)\s*(월|화|수|목|금|토|일)요일$/;
  const lastWeekdayMatch = cleanDateStr.match(lastWeekdayPattern);
  if (lastWeekdayMatch) {
    const weekdayMap: { [key: string]: number } = {
      '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7
    };
    const targetWeekday = weekdayMap[lastWeekdayMatch[2]];
    const lastWeek = now.minus({ weeks: 1 });
    const diff = lastWeek.weekday - targetWeekday;
    return lastWeek.minus({ days: diff }).toFormat('yyyy-MM-dd');
  }

  // 3. 절대 날짜 표현
  // "mm.dd 오후 3시", "12.25 3시" 등 - 날짜 + 시간 조합
  const dateTimePattern = /^(\d{1,2}\.\d{1,2})\s+(?:오전|오후)?\s*\d{1,2}시/;
  const dateTimeMatch = dateStr.match(dateTimePattern);
  if (dateTimeMatch) {
    const datePart = dateTimeMatch[1];
    const monthDayMatch = datePart.match(/^(\d{1,2})\.(\d{1,2})$/);
    if (monthDayMatch) {
      const month = monthDayMatch[1].padStart(2, '0');
      const day = monthDayMatch[2].padStart(2, '0');
      return `${now.year}-${month}-${day}`;
    }
  }

  // "mm.dd" (올해)
  const monthDayPattern = /^(\d{1,2})\.(\d{1,2})$/;
  const monthDayMatch = cleanDateStr.match(monthDayPattern);
  if (monthDayMatch) {
    const month = monthDayMatch[1].padStart(2, '0');
    const day = monthDayMatch[2].padStart(2, '0');
    return `${now.year}-${month}-${day}`;
  }

  // "yy.mm.dd"
  const shortYearPattern = /^(\d{2})\.(\d{1,2})\.(\d{1,2})$/;
  const shortYearMatch = cleanDateStr.match(shortYearPattern);
  if (shortYearMatch) {
    const year = `20${shortYearMatch[1]}`;
    const month = shortYearMatch[2].padStart(2, '0');
    const day = shortYearMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // "yyyy.mm.dd"
  const fullYearPattern = /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/;
  const fullYearMatch = cleanDateStr.match(fullYearPattern);
  if (fullYearMatch) {
    const year = fullYearMatch[1];
    const month = fullYearMatch[2].padStart(2, '0');
    const day = fullYearMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 4. 시간만 있는 경우 (오늘)
  const timeOnlyPattern = /^(오전|오후)?\s*\d{1,2}시/;
  if (timeOnlyPattern.test(dateStr)) {
    return now.toFormat('yyyy-MM-dd');
  }

  // 파싱 실패 시 오늘 날짜 반환
  return now.toFormat('yyyy-MM-dd');
};

/**
 * 통화 문자열을 ISO 4217 통화 코드로 변환
 * @param currencyStr 통화 문자열 (예: "원", "달러", "엔", "바트")
 * @returns ISO 4217 통화 코드 (예: "KRW", "USD", "JPY")
 */
export const parseCurrency = (currencyStr: string): string => {
  const currencyMap: { [key: string]: string } = {
    '원': 'KRW',
    '₩': 'KRW',
    'krw': 'KRW',
    '달러': 'USD',
    '$': 'USD',
    'usd': 'USD',
    '유로': 'EUR',
    '€': 'EUR',
    'eur': 'EUR',
    '엔': 'JPY',
    '¥': 'JPY',
    'jpy': 'JPY',
    '파운드': 'GBP',
    '£': 'GBP',
    'gbp': 'GBP',
    '위안': 'CNY',
    'cny': 'CNY',
    '바트': 'THB',
    '฿': 'THB',
    'thb': 'THB',
    '동': 'VND',
    '₫': 'VND',
    'vnd': 'VND',
    'aud': 'AUD',
    'cad': 'CAD',
    'chf': 'CHF',
    'hkd': 'HKD',
    'sgd': 'SGD',
    'twd': 'TWD'
  };

  const normalized = currencyStr.toLowerCase().trim();
  return currencyMap[normalized] || 'KRW';
};

/**
 * 날짜 패턴인지 확인
 * @param text 확인할 텍스트
 * @returns 날짜 패턴이면 true
 */
export const isDatePattern = (text: string): boolean => {
  const datePatterns = [
    // 절대 날짜
    /^\d{4}\.\d{1,2}\.\d{1,2}$/, // yyyy.mm.dd
    /^\d{2}\.\d{1,2}\.\d{1,2}$/, // yy.mm.dd
    /^\d{1,2}\.\d{1,2}$/, // mm.dd
    /^\d{1,2}\.\d{1,2}\s+(오전|오후)?\s*\d{1,2}시/, // mm.dd hh시

    // 시간
    /^(오전|오후)?\s*\d{1,2}시(?:\s*\d{1,2}분)?$/, // 오후 3시, 3시 30분

    // 상대 날짜
    /^오늘/, // 오늘
    /^어제/, // 어제, 어제 오후 3시
    /^그저께/, // 그저께
    /^그제/, // 그제
    /^\d+일\s*전$/, // 3일 전
    /^\d+주\s*전$/, // 2주 전
    /^\d+(개월|달)\s*전$/, // 2개월 전, 3달 전
    /^지난주/, // 지난주, 지난주 월요일
    /^저번주/, // 저번주, 저번주 화요일
    /^지난달$/, // 지난달
    /^저번달$/, // 저번달
  ];

  return datePatterns.some(pattern => pattern.test(text));
};

export interface ParsedTransaction {
  description: string;
  amount: number;
  currency?: string;
  date?: string;
}

/**
 * 자동 입력 텍스트를 파싱하여 거래 정보로 변환
 * @param input 입력 텍스트 (예: "어제 마트 20000원", "12.25 점심 15000엔")
 * @returns 파싱된 거래 정보 또는 null
 */
export const parseAutoInput = (input: string): ParsedTransaction | null => {
  // 패턴 1: "[날짜] [설명] [금액][통화]" (예: "어제 마트 20000원", "12.25 점심 15000원")
  const pattern1 = /^(.+?)\s+(.+?)\s+([\d,]+)\s*([가-힣a-zA-Z$€¥£₩฿₫]+)?$/;

  const match = input.match(pattern1);
  if (match) {
    const firstPart = match[1].trim();
    const secondPart = match[2].trim();
    const amountStr = match[3];
    const currencyStr = match[4] || '원';

    const amount = parseFloat(amountStr.replace(/,/g, ''));
    const currency = parseCurrency(currencyStr);

    // 첫 번째 부분이 날짜인지 확인
    if (isDatePattern(firstPart)) {
      // [날짜] [설명] [금액] 형식
      return {
        date: parseDate(firstPart),
        description: secondPart,
        amount,
        currency
      };
    } else {
      // [설명] [설명] [금액] 형식 - 첫 두 부분을 합쳐서 설명으로
      return {
        description: `${firstPart} ${secondPart}`,
        amount,
        currency
      };
    }
  }

  // 패턴 2: "[설명] [금액][통화]" (기존 형식, 예: "마트 20000원")
  const pattern2 = /^(.+?)\s+([\d,]+)\s*([가-힣a-zA-Z$€¥£₩฿₫]+)?$/;
  const match2 = input.match(pattern2);
  if (match2) {
    const description = match2[1].trim();
    const amount = parseFloat(match2[2].replace(/,/g, ''));
    const currencyStr = match2[3] || '원';
    const currency = parseCurrency(currencyStr);

    return {
      description,
      amount,
      currency
    };
  }

  return null;
};
