package com.health.module.family.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 授权查看指标请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class AuthorizeDTO {

    /** 家庭组ID（实际取路径参数，此字段保留用于请求体透传） */
    private Long groupId;

    /** 家庭成员记录ID */
    @NotNull(message = "成员ID不能为空")
    private Long memberId;

    /** 是否授权查看指标 0否 1是 */
    @NotNull(message = "授权状态不能为空")
    private Integer authorizedView;
}
