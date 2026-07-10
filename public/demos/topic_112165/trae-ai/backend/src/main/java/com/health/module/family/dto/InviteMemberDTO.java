package com.health.module.family.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 邀请家庭成员请求 DTO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class InviteMemberDTO {

    /** 家庭组ID */
    private Long groupId;

    /** 被邀请人手机号（通过手机号查询用户） */
    @NotBlank(message = "手机号不能为空")
    private String phone;
}
