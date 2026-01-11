package com.household.budget.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * 유효한 통화 코드인지 검증하는 어노테이션
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = CurrencyValidator.class)
@Documented
public @interface ValidCurrency {
    String message() default "유효하지 않은 통화 코드입니다. 지원되는 통화: KRW, USD, EUR, JPY, GBP, CNY, AUD, CAD, CHF, HKD, SGD, THB, VND, TWD";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
