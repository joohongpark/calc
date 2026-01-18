package com.household.budget.service;

import com.household.budget.entity.PaymentMethod;
import com.household.budget.entity.UserPaymentMethodMapping;
import com.household.budget.repository.PaymentMethodRepository;
import com.household.budget.repository.UserPaymentMethodMappingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentMethodService {

    private final UserPaymentMethodMappingRepository mappingRepository;
    private final PaymentMethodRepository paymentMethodRepository;

    /**
     * 사용자의 활성화된 결제수단 목록 조회 (정렬됨)
     * N:M 조인을 사용하여 결제수단 정보와 함께 반환
     */
    public List<PaymentMethodDTO> getUserPaymentMethods(Long userId) {
        List<UserPaymentMethodMapping> mappings = mappingRepository
                .findByUserIdAndIsActiveTrueOrderBySortOrderAsc(userId);

        if (mappings.isEmpty()) {
            return List.of();
        }

        // 결제수단 ID 목록 추출
        List<Long> paymentMethodIds = mappings.stream()
                .map(UserPaymentMethodMapping::getPaymentMethodId)
                .toList();

        // 결제수단 정보 일괄 조회
        Map<Long, PaymentMethod> paymentMethodMap = paymentMethodRepository.findAllById(paymentMethodIds)
                .stream()
                .collect(Collectors.toMap(PaymentMethod::getId, pm -> pm));

        // DTO 변환 (매핑 순서대로)
        return mappings.stream()
                .map(mapping -> {
                    PaymentMethod pm = paymentMethodMap.get(mapping.getPaymentMethodId());
                    return new PaymentMethodDTO(
                            mapping.getId(),
                            pm.getName(),
                            mapping.getSortOrder()
                    );
                })
                .toList();
    }

    /**
     * 사용자의 결제수단 매핑 ID -> 이름 맵 조회 (캐싱)
     * Transaction 조회 시 결제수단명 매핑에 사용
     *
     * 주의: 이제 transactions.payment_method_id는 payment_methods.id를 가리킴
     * 따라서 payment_methods.id -> name 맵을 반환해야 함
     */
    @Cacheable(value = "paymentMethodMap", key = "#userId")
    public Map<Long, String> getPaymentMethodMap(Long userId) {
        List<UserPaymentMethodMapping> mappings = mappingRepository
                .findByUserIdAndIsActiveTrueOrderBySortOrderAsc(userId);

        if (mappings.isEmpty()) {
            return Map.of();
        }

        // 결제수단 ID 목록 추출
        List<Long> paymentMethodIds = mappings.stream()
                .map(UserPaymentMethodMapping::getPaymentMethodId)
                .toList();

        // payment_methods.id -> name 맵 생성
        return paymentMethodRepository.findAllById(paymentMethodIds)
                .stream()
                .collect(Collectors.toMap(
                        PaymentMethod::getId,
                        PaymentMethod::getName
                ));
    }

    /**
     * 결제수단 추가
     * - 기존 결제수단이 있으면 매핑만 추가
     * - 없으면 새로운 결제수단 생성 후 매핑 추가
     */
    @Transactional
    @CacheEvict(value = "paymentMethodMap", key = "#userId")
    public PaymentMethodDTO addPaymentMethod(Long userId, String name) {
        // 이미 매핑이 존재하는지 확인
        PaymentMethod paymentMethod = paymentMethodRepository.findByName(name)
                .orElseGet(() -> {
                    // 새로운 결제수단 생성 (사용자 커스텀)
                    PaymentMethod newPm = PaymentMethod.builder()
                            .name(name)
                            .isSystem(false)
                            .sortOrder(0)
                            .build();
                    return paymentMethodRepository.save(newPm);
                });

        // 이미 이 사용자에게 매핑이 있는지 확인
        if (mappingRepository.existsByUserIdAndPaymentMethodId(userId, paymentMethod.getId())) {
            throw new IllegalArgumentException("이미 존재하는 결제수단입니다: " + name);
        }

        // 현재 사용자의 매핑 개수 확인 (정렬 순서 결정)
        List<UserPaymentMethodMapping> existing = mappingRepository.findByUserIdOrderBySortOrderAsc(userId);
        int nextSortOrder = existing.isEmpty() ? 1 : existing.get(existing.size() - 1).getSortOrder() + 1;

        UserPaymentMethodMapping mapping = UserPaymentMethodMapping.builder()
                .userId(userId)
                .paymentMethodId(paymentMethod.getId())
                .isActive(true)
                .sortOrder(nextSortOrder)
                .build();

        UserPaymentMethodMapping saved = mappingRepository.save(mapping);
        return new PaymentMethodDTO(saved.getId(), paymentMethod.getName(), saved.getSortOrder());
    }

    /**
     * 결제수단 수정
     * 참고: N:M 구조에서는 결제수단 이름 수정이 까다로움
     * - 시스템 기본 결제수단은 수정 불가
     * - 사용자 커스텀 결제수단만 수정 가능하며, 다른 사용자에게 영향 없어야 함
     */
    @Transactional
    @CacheEvict(value = "paymentMethodMap", key = "#userId")
    public PaymentMethodDTO updatePaymentMethod(Long userId, Long mappingId, String newName) {
        UserPaymentMethodMapping mapping = mappingRepository.findByIdAndUserId(mappingId, userId)
                .orElseThrow(() -> new IllegalArgumentException("결제수단을 찾을 수 없습니다"));

        PaymentMethod paymentMethod = paymentMethodRepository.findById(mapping.getPaymentMethodId())
                .orElseThrow(() -> new IllegalArgumentException("결제수단 정보를 찾을 수 없습니다"));

        // 시스템 기본 결제수단은 수정 불가
        if (paymentMethod.getIsSystem()) {
            throw new IllegalArgumentException("시스템 기본 결제수단은 수정할 수 없습니다");
        }

        // 이름이 같으면 변경 없음
        if (paymentMethod.getName().equals(newName)) {
            return new PaymentMethodDTO(mapping.getId(), paymentMethod.getName(), mapping.getSortOrder());
        }

        // 새 이름의 결제수단이 이미 존재하는지 확인
        PaymentMethod newPaymentMethod = paymentMethodRepository.findByName(newName)
                .orElseGet(() -> {
                    // 새로운 결제수단 생성
                    PaymentMethod newPm = PaymentMethod.builder()
                            .name(newName)
                            .isSystem(false)
                            .sortOrder(0)
                            .build();
                    return paymentMethodRepository.save(newPm);
                });

        // 매핑을 새 결제수단으로 변경
        mapping.setPaymentMethodId(newPaymentMethod.getId());
        UserPaymentMethodMapping saved = mappingRepository.save(mapping);

        return new PaymentMethodDTO(saved.getId(), newPaymentMethod.getName(), saved.getSortOrder());
    }

    /**
     * 결제수단 삭제 (soft delete)
     * 매핑만 비활성화, 실제 결제수단은 삭제하지 않음
     */
    @Transactional
    @CacheEvict(value = "paymentMethodMap", key = "#userId")
    public void deletePaymentMethod(Long userId, Long mappingId) {
        UserPaymentMethodMapping mapping = mappingRepository.findByIdAndUserId(mappingId, userId)
                .orElseThrow(() -> new IllegalArgumentException("결제수단을 찾을 수 없습니다"));

        mapping.setIsActive(false);
        mappingRepository.save(mapping);
    }

    /**
     * 신규 사용자를 위한 기본 결제수단 매핑 생성
     * 회원가입 시 호출
     */
    @Transactional
    public void createDefaultPaymentMethodsForUser(Long userId) {
        List<PaymentMethod> systemPaymentMethods = paymentMethodRepository.findByIsSystemTrueOrderBySortOrderAsc();

        List<UserPaymentMethodMapping> mappings = systemPaymentMethods.stream()
                .map(pm -> UserPaymentMethodMapping.builder()
                        .userId(userId)
                        .paymentMethodId(pm.getId())
                        .isActive(true)
                        .sortOrder(pm.getSortOrder())
                        .build())
                .toList();

        mappingRepository.saveAll(mappings);
    }

    /**
     * 결제수단 정렬 순서 변경
     */
    @Transactional
    @CacheEvict(value = "paymentMethodMap", key = "#userId")
    public void reorderPaymentMethods(Long userId, List<Long> mappingIds) {
        List<UserPaymentMethodMapping> mappings = mappingRepository.findByUserIdOrderBySortOrderAsc(userId);

        for (int i = 0; i < mappingIds.size(); i++) {
            final int sortOrder = i + 1;
            Long id = mappingIds.get(i);
            mappings.stream()
                    .filter(mapping -> mapping.getId().equals(id))
                    .findFirst()
                    .ifPresent(mapping -> mapping.setSortOrder(sortOrder));
        }

        mappingRepository.saveAll(mappings);
    }

    /**
     * DTO for payment method response
     */
    public record PaymentMethodDTO(Long id, String name, Integer sortOrder) {}
}
