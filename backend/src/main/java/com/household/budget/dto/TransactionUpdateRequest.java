package com.household.budget.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.household.budget.entity.Transaction.TransactionType;
import com.household.budget.validation.ValidCurrency;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 거래 수정용 DTO - 모든 필드가 Optional
 * null이 아닌 필드만 업데이트됨
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TransactionUpdateRequest {

    private TransactionType type;
    private BigDecimal amount;
    private String description;
    private Long paymentMethodId;

    @ValidCurrency
    private String currency;

    private BigDecimal originalAmount;
    private BigDecimal discountRate;
    private BigDecimal exchangeRate;
    private String tags; // JSON 문자열
    private LocalDate transactionDate;
}
