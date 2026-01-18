package com.household.budget.repository;

import com.household.budget.entity.UserPaymentMethodMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPaymentMethodMappingRepository extends JpaRepository<UserPaymentMethodMapping, Long> {

    List<UserPaymentMethodMapping> findByUserIdAndIsActiveTrueOrderBySortOrderAsc(Long userId);

    List<UserPaymentMethodMapping> findByUserIdOrderBySortOrderAsc(Long userId);

    Optional<UserPaymentMethodMapping> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndPaymentMethodId(Long userId, Long paymentMethodId);

    Optional<UserPaymentMethodMapping> findByUserIdAndPaymentMethodId(Long userId, Long paymentMethodId);

    @Query("SELECT m FROM UserPaymentMethodMapping m WHERE m.userId = :userId AND m.paymentMethodId IN :paymentMethodIds")
    List<UserPaymentMethodMapping> findByUserIdAndPaymentMethodIdIn(@Param("userId") Long userId, @Param("paymentMethodIds") List<Long> paymentMethodIds);
}
