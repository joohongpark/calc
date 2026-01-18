package com.household.budget.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentMethodRequest {

    @NotBlank(message = "결제수단 이름은 필수입니다")
    private String name;
}
