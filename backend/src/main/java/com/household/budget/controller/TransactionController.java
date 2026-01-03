package com.household.budget.controller;

import com.household.budget.dto.TransactionRequest;
import com.household.budget.dto.TransactionResponse;
import com.household.budget.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    /**
     * 가계부 내역 생성
     */
    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
            Authentication authentication,
            @Valid @RequestBody TransactionRequest request
    ) {
        TransactionResponse response = transactionService.createTransaction(
                authentication.getName(),
                request
        );
        return ResponseEntity.ok(response);
    }

    /**
     * 가계부 내역 목록 조회
     */
    @GetMapping
    public ResponseEntity<Page<TransactionResponse>> getTransactions(
            Authentication authentication,
            @PageableDefault(size = 20, sort = "transactionDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<TransactionResponse> transactions = transactionService.getTransactions(
                authentication.getName(),
                pageable
        );
        return ResponseEntity.ok(transactions);
    }

    /**
     * 가계부 내역 단건 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponse> getTransaction(
            Authentication authentication,
            @PathVariable Long id
    ) {
        TransactionResponse response = transactionService.getTransaction(
                authentication.getName(),
                id
        );
        return ResponseEntity.ok(response);
    }

    /**
     * 가계부 내역 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> updateTransaction(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request
    ) {
        TransactionResponse response = transactionService.updateTransaction(
                authentication.getName(),
                id,
                request
        );
        return ResponseEntity.ok(response);
    }

    /**
     * 가계부 내역 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            Authentication authentication,
            @PathVariable Long id
    ) {
        transactionService.deleteTransaction(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 월별 가계부 내역 조회
     */
    @GetMapping("/monthly/{year}/{month}")
    public ResponseEntity<List<TransactionResponse>> getMonthlyTransactions(
            Authentication authentication,
            @PathVariable int year,
            @PathVariable int month
    ) {
        List<TransactionResponse> transactions = transactionService.getMonthlyTransactions(
                authentication.getName(),
                year,
                month
        );
        return ResponseEntity.ok(transactions);
    }
}
