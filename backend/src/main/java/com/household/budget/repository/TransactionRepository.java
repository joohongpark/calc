package com.household.budget.repository;

import com.household.budget.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // 사용자별 거래 내역 조회 (페이징)
    Page<Transaction> findByUserIdOrderByTransactionDateDesc(Long userId, Pageable pageable);

    // 월별 거래 내역 조회
    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId " +
           "AND YEAR(t.transactionDate) = :year " +
           "AND MONTH(t.transactionDate) = :month " +
           "AND t.deletedAt IS NULL " +
           "ORDER BY t.transactionDate DESC")
    List<Transaction> findMonthlyTransactions(
        @Param("userId") Long userId,
        @Param("year") int year,
        @Param("month") int month
    );

    // 기간별 거래 내역 조회
    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "AND t.deletedAt IS NULL " +
           "ORDER BY t.transactionDate DESC")
    List<Transaction> findByDateRange(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
