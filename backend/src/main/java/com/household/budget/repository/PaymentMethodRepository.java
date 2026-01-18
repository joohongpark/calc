package com.household.budget.repository;

import com.household.budget.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
    List<PaymentMethod> findAllByOrderBySortOrderAsc();
    List<PaymentMethod> findByIsSystemTrueOrderBySortOrderAsc();
    Optional<PaymentMethod> findByName(String name);
}
