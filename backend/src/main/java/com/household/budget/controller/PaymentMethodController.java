package com.household.budget.controller;

import com.household.budget.dto.PaymentMethodRequest;
import com.household.budget.dto.PaymentMethodResponse;
import com.household.budget.entity.User;
import com.household.budget.service.AuthService;
import com.household.budget.service.PaymentMethodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payment-methods")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;
    private final AuthService authService;

    /**
     * 사용자의 결제수단 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<PaymentMethodResponse>> getPaymentMethods(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        List<PaymentMethodService.PaymentMethodDTO> paymentMethods = paymentMethodService.getUserPaymentMethods(userId);

        List<PaymentMethodResponse> response = paymentMethods.stream()
                .map(pm -> PaymentMethodResponse.builder()
                        .id(pm.id())
                        .name(pm.name())
                        .sortOrder(pm.sortOrder())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * 결제수단 추가
     */
    @PostMapping
    public ResponseEntity<PaymentMethodResponse> addPaymentMethod(
            Authentication authentication,
            @Valid @RequestBody PaymentMethodRequest request) {

        Long userId = getUserIdFromAuth(authentication);
        PaymentMethodService.PaymentMethodDTO created = paymentMethodService.addPaymentMethod(userId, request.getName());

        PaymentMethodResponse response = PaymentMethodResponse.builder()
                .id(created.id())
                .name(created.name())
                .sortOrder(created.sortOrder())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * 결제수단 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<PaymentMethodResponse> updatePaymentMethod(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody PaymentMethodRequest request) {

        Long userId = getUserIdFromAuth(authentication);
        PaymentMethodService.PaymentMethodDTO updated = paymentMethodService.updatePaymentMethod(userId, id, request.getName());

        PaymentMethodResponse response = PaymentMethodResponse.builder()
                .id(updated.id())
                .name(updated.name())
                .sortOrder(updated.sortOrder())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * 결제수단 삭제 (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePaymentMethod(
            Authentication authentication,
            @PathVariable Long id) {

        Long userId = getUserIdFromAuth(authentication);
        paymentMethodService.deletePaymentMethod(userId, id);

        return ResponseEntity.noContent().build();
    }

    // Helper method
    private Long getUserIdFromAuth(Authentication authentication) {
        String username = authentication.getName();
        User user = authService.getCurrentUser(username);
        return user.getId();
    }
}
