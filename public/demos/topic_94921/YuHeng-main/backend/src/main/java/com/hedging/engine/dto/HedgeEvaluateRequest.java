package com.hedging.engine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class HedgeEvaluateRequest {

    @NotNull(message = "消费金额不能为空")
    @Positive(message = "消费金额必须为正数")
    private Double amount;

    @NotBlank(message = "原始意图不能为空")
    private String originalIntention;

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getOriginalIntention() {
        return originalIntention;
    }

    public void setOriginalIntention(String originalIntention) {
        this.originalIntention = originalIntention;
    }
}
