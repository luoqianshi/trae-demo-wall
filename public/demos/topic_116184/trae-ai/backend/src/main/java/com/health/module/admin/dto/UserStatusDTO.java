package com.health.module.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 用户状态更新请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class UserStatusDTO {

    /** 状态 1启用 0禁用. */
    @NotNull(message = "状态不能为空")
    private Integer status;
}
