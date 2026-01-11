/**
 * 통화 심볼을 ISO 4217 통화 코드로 매핑
 */
export const CURRENCY_SYMBOL_TO_CODE: Record<string, string> = {
  '원': 'KRW',
  '₩': 'KRW',
  '$': 'USD',
  '달러': 'USD',
  '€': 'EUR',
  '유로': 'EUR',
  '¥': 'JPY',
  '엔': 'JPY',
  '円': 'JPY',
  '£': 'GBP',
  '파운드': 'GBP',
  '元': 'CNY',
  '위안': 'CNY',
};

/**
 * 통화 코드를 표시용 심볼로 매핑
 */
export const CURRENCY_CODE_TO_SYMBOL: Record<string, string> = {
  'KRW': '원',
  'USD': '$',
  'EUR': '€',
  'JPY': '¥',
  'GBP': '£',
  'CNY': '¥',
};

/**
 * 통화 심볼이나 이름을 ISO 통화 코드로 변환
 * @param input - 통화 심볼 또는 이름 (예: "원", "₩", "KRW")
 * @returns ISO 4217 통화 코드 (예: "KRW")
 */
export function normalizeCurrency(input: string): string {
  const trimmed = input.trim();

  // 이미 통화 코드 형식인 경우 (3자리 대문자)
  if (/^[A-Z]{3}$/.test(trimmed)) {
    return trimmed;
  }

  // 심볼/이름을 코드로 변환
  const code = CURRENCY_SYMBOL_TO_CODE[trimmed];
  if (code) {
    return code;
  }

  // 매핑되지 않은 경우 기본값 반환
  console.warn(`Unknown currency: ${input}, defaulting to KRW`);
  return 'KRW';
}

/**
 * 통화 코드를 표시용 심볼로 변환
 * @param code - ISO 4217 통화 코드 (예: "KRW")
 * @returns 표시용 심볼 (예: "원")
 */
export function getCurrencySymbol(code: string): string {
  return CURRENCY_CODE_TO_SYMBOL[code] || code;
}
