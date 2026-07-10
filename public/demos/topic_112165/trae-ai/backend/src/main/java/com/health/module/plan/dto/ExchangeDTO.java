package com.health.module.plan.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 积分兑换请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class ExchangeDTO {

    /** 兑换商品ID. */
    @NotNull(message = "兑换商品ID不能为空")
    private Long itemId;
}
