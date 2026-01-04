package com.household.budget.service;

import com.household.budget.dto.TransactionRequest;
import com.household.budget.dto.TransactionResponse;
import com.household.budget.entity.Transaction;
import com.household.budget.entity.User;
import com.household.budget.repository.TransactionRepository;
import com.household.budget.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional
    public TransactionResponse createTransaction(String username, TransactionRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        Transaction transaction = Transaction.builder()
                .user(user)
                .type(request.getType())
                .amount(request.getAmount())
                .description(request.getDescription())
                .paymentMethod(request.getPaymentMethod())
                .currency(request.getCurrency())
                .originalAmount(request.getOriginalAmount())
                .discountRate(request.getDiscountRate())
                .exchangeRate(request.getExchangeRate())
                .tags(request.getTags())
                .transactionDate(request.getTransactionDate())
                .build();

        Transaction saved = transactionRepository.save(transaction);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getTransactions(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        return transactionRepository.findByUserIdOrderByTransactionDateDesc(user.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransaction(String username, Long id) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("거래 내역을 찾을 수 없습니다"));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("접근 권한이 없습니다");
        }

        return toResponse(transaction);
    }

    @Transactional
    public TransactionResponse updateTransaction(String username, Long id, TransactionRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("거래 내역을 찾을 수 없습니다"));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("접근 권한이 없습니다");
        }

        transaction.setType(request.getType());
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription());
        transaction.setPaymentMethod(request.getPaymentMethod());
        transaction.setCurrency(request.getCurrency());
        transaction.setOriginalAmount(request.getOriginalAmount());
        transaction.setDiscountRate(request.getDiscountRate());
        transaction.setExchangeRate(request.getExchangeRate());
        transaction.setTags(request.getTags());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setUpdatedAt(Instant.now());

        return toResponse(transaction);
    }

    @Transactional
    public void deleteTransaction(String username, Long id) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("거래 내역을 찾을 수 없습니다"));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("접근 권한이 없습니다");
        }

        transaction.setDeletedAt(Instant.now());
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getMonthlyTransactions(String username, int year, int month) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        return transactionRepository.findMonthlyTransactions(user.getId(), year, month)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private TransactionResponse toResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .description(transaction.getDescription())
                .paymentMethod(transaction.getPaymentMethod())
                .currency(transaction.getCurrency())
                .originalAmount(transaction.getOriginalAmount())
                .discountRate(transaction.getDiscountRate())
                .exchangeRate(transaction.getExchangeRate())
                .tags(transaction.getTags())
                .transactionDate(transaction.getTransactionDate())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
