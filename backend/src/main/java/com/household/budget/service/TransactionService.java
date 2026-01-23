package com.household.budget.service;

import com.household.budget.dto.TransactionRequest;
import com.household.budget.dto.TransactionResponse;
import com.household.budget.dto.TransactionUpdateRequest;
import com.household.budget.entity.Currency;
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
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final PaymentMethodService paymentMethodService;

    @Transactional
    public TransactionResponse createTransaction(String email, TransactionRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        // 통화 코드를 Currency enum으로 변환
        Currency currency = Currency.fromString(request.getCurrency());

        Transaction transaction = Transaction.builder()
                .user(user)
                .type(request.getType())
                .amount(request.getAmount())
                .description(request.getDescription())
                .paymentMethodId(request.getPaymentMethodId())
                .currency(currency)
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
    public Page<TransactionResponse> getTransactions(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        return transactionRepository.findByUserIdOrderByTransactionDateDesc(user.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransaction(String email, Long id) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("거래 내역을 찾을 수 없습니다"));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("접근 권한이 없습니다");
        }

        return toResponse(transaction);
    }

    @Transactional
    public TransactionResponse updateTransaction(String email, Long id, TransactionUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("거래 내역을 찾을 수 없습니다"));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("접근 권한이 없습니다");
        }

        // null이 아닌 필드만 업데이트
        if (request.getType() != null) {
            transaction.setType(request.getType());
        }
        if (request.getAmount() != null) {
            transaction.setAmount(request.getAmount());
        }
        if (request.getDescription() != null) {
            transaction.setDescription(request.getDescription());
        }
        if (request.getPaymentMethodId() != null) {
            transaction.setPaymentMethodId(request.getPaymentMethodId());
        }
        if (request.getCurrency() != null) {
            Currency currency = Currency.fromString(request.getCurrency());
            transaction.setCurrency(currency);
        }
        if (request.getOriginalAmount() != null) {
            transaction.setOriginalAmount(request.getOriginalAmount());
        }
        if (request.getDiscountRate() != null) {
            transaction.setDiscountRate(request.getDiscountRate());
        }
        if (request.getExchangeRate() != null) {
            transaction.setExchangeRate(request.getExchangeRate());
        }
        if (request.getTags() != null) {
            transaction.setTags(request.getTags());
        }
        if (request.getTransactionDate() != null) {
            transaction.setTransactionDate(request.getTransactionDate());
        }

        transaction.setUpdatedAt(Instant.now());

        return toResponse(transaction);
    }

    @Transactional
    public void deleteTransaction(String email, Long id) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("거래 내역을 찾을 수 없습니다"));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("접근 권한이 없습니다");
        }

        transaction.setDeletedAt(Instant.now());
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getMonthlyTransactions(String email, int year, int month) {
        User user = userRepository.findByEmail(email)
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
                .paymentMethodId(transaction.getPaymentMethodId())
                .currency(transaction.getCurrency().name())
                .originalAmount(transaction.getOriginalAmount())
                .discountRate(transaction.getDiscountRate())
                .exchangeRate(transaction.getExchangeRate())
                .tags(transaction.getTags())
                .transactionDate(transaction.getTransactionDate())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
