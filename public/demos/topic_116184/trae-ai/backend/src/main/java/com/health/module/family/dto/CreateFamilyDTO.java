package com.health.module.family.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建家庭组请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class CreateFamilyDTO {

    /** 家庭组名称 */
    @NotBlank(message = "家庭组名称不能为空")
    private String name;
}
