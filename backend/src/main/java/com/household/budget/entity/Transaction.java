package com.household.budget.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type; // INCOME, EXPENSE

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String description; // 사용처

    @Column(nullable = false)
    private String paymentMethod; // 결제수단

    @Column(nullable = false, length = 3)
    private String currency; // 통화 (KRW, USD 등)

    @Column(precision = 15, scale = 2)
    private BigDecimal originalAmount; // 원금 (옵션)

    @Column(precision = 5, scale = 2)
    private BigDecimal discountRate; // 할인율 (옵션, %)

    @Column(precision = 10, scale = 4)
    private BigDecimal exchangeRate; // 적용환율 (옵션)

    @Column(columnDefinition = "TEXT")
    private String tags; // 태그 (JSON 배열 문자열: ["식비", "외식"])

    @Column(nullable = false)
    private LocalDate transactionDate; // 거래 날짜

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime deletedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TransactionType {
        INCOME,  // 수입
        EXPENSE  // 지출
    }
}
