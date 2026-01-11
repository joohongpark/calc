package com.household.budget.validation;

import com.household.budget.entity.Currency;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * ValidCurrency 어노테이션의 실제 검증 로직
 */
public class CurrencyValidator implements ConstraintValidator<ValidCurrency, String> {

    @Override
    public void initialize(ValidCurrency constraintAnnotation) {
        // 초기화 로직 (필요시)
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // null이거나 빈 문자열인 경우는 @NotBlank가 처리하도록 함
        if (value == null || value.trim().isEmpty()) {
            return true;
        }

        // Currency enum에 정의된 값인지 검증
        return Currency.isValid(value);
    }
}
