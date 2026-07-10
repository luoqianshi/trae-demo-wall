package com.health.module.consultation.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 问诊评价请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class EvaluateDTO {

    /** 问诊会话ID */
    @NotNull(message = "问诊会话ID不能为空")
    private Long consultationId;

    /** 评分 1-5 */
    @NotNull(message = "评分不能为空")
    @Min(value = 1, message = "评分最低1分")
    @Max(value = 5, message = "评分最高5分")
    private Integer rating;

    /** 评价内容 */
    private String ratingComment;
}
