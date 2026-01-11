package com.household.budget.entity;

/**
 * ISO 4217 통화 코드 Enum
 * 주요 통화 코드만 정의
 */
public enum Currency {
    KRW("대한민국 원", "₩"),
    USD("미국 달러", "$"),
    EUR("유로", "€"),
    JPY("일본 엔", "¥"),
    GBP("영국 파운드", "£"),
    CNY("중국 위안", "¥"),
    AUD("호주 달러", "A$"),
    CAD("캐나다 달러", "C$"),
    CHF("스위스 프랑", "CHF"),
    HKD("홍콩 달러", "HK$"),
    SGD("싱가포르 달러", "S$"),
    THB("태국 바트", "฿"),
    VND("베트남 동", "₫"),
    TWD("대만 달러", "NT$");

    private final String displayName;
    private final String symbol;

    Currency(String displayName, String symbol) {
        this.displayName = displayName;
        this.symbol = symbol;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getSymbol() {
        return symbol;
    }

    /**
     * 문자열로부터 Currency enum 값을 찾음
     * @param value 통화 코드 문자열
     * @return Currency enum 값
     * @throws IllegalArgumentException 유효하지 않은 통화 코드인 경우
     */
    public static Currency fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return KRW; // 기본값
        }

        try {
            return Currency.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Invalid currency code: " + value + ". Supported currencies: " +
                String.join(", ", getAllCodes())
            );
        }
    }

    /**
     * 모든 지원되는 통화 코드 목록 반환
     */
    public static String[] getAllCodes() {
        Currency[] values = Currency.values();
        String[] codes = new String[values.length];
        for (int i = 0; i < values.length; i++) {
            codes[i] = values[i].name();
        }
        return codes;
    }

    /**
     * 특정 통화 코드가 유효한지 확인
     */
    public static boolean isValid(String value) {
        if (value == null || value.trim().isEmpty()) {
            return false;
        }
        try {
            Currency.valueOf(value.trim().toUpperCase());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
