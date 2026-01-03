package com.household.budget.dto;

import com.household.budget.entity.Transaction.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private Long id;
    private TransactionType type;
    private BigDecimal amount;
    private String description;
    private String paymentMethod;
    private String currency;
    private BigDecimal originalAmount;
    private BigDecimal discountRate;
    private BigDecimal exchangeRate;
    private String tags;
    private LocalDate transactionDate;
    private LocalDateTime createdAt;
}
