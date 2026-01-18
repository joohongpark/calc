package com.household.budget.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.household.budget.entity.Transaction.TransactionType;
import com.household.budget.validation.ValidCurrency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TransactionRequest {

    @NotNull(message = "거래 유형은 필수입니다")
    private TransactionType type;

    @NotNull(message = "금액은 필수입니다")
    private BigDecimal amount;

    @NotBlank(message = "사용처는 필수입니다")
    private String description;

    @NotNull(message = "결제수단은 필수입니다")
    private Long paymentMethodId;
    @NotBlank(message = "통화는 필수입니다")
    @ValidCurrency
    private String currency = "KRW";

    private BigDecimal originalAmount;
    private BigDecimal discountRate;
    private BigDecimal exchangeRate;
    private String tags; // JSON 문자열

    @NotNull(message = "거래 날짜는 필수입니다")
    private LocalDate transactionDate;
}
