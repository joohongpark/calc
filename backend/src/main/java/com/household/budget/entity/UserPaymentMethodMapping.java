package com.household.budget.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * 사용자-결제수단 N:M 매핑 테이블
 * 각 사용자가 어떤 결제수단을 사용할 수 있는지 관리
 */
@Entity
@Table(name = "user_payment_method_mapping",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "payment_method_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPaymentMethodMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "payment_method_id", nullable = false)
    private Long paymentMethodId;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
