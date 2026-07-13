package com.health.module.family.controller;

import com.health.common.Result;
import com.health.module.family.dto.AuthorizeDTO;
import com.health.module.family.dto.CreateFamilyDTO;
import com.health.module.family.dto.FamilyMemberVO;
import com.health.module.family.dto.InviteMemberDTO;
import com.health.module.family.service.FamilyService;
import com.health.module.health.dto.MetricVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 家庭账号接口.
 * <p>
 * 提供家庭组创建、成员邀请、成员查询、指标查看授权与成员健康指标查看。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@RestController
@RequestMapping("/api/family")
public class FamilyController {

    private final FamilyService familyService;

    public FamilyController(final FamilyService familyService) {
        this.familyService = familyService;
    }

    /**
     * 创建家庭组.
     *
     * @param dto 创建请求
     * @return 家庭组ID
     */
    @PostMapping("/groups")
    public Result<Long> createGroup(@Valid @RequestBody final CreateFamilyDTO dto) {
        return Result.success(familyService.createGroup(dto));
    }

    /**
     * 邀请家庭成员.
     *
     * @param id  家庭组ID
     * @param dto 邀请请求
     * @return 操作结果
     */
    @PostMapping("/groups/{id}/invite")
    public Result<Void> invite(@PathVariable final Long id,
                               @Valid @RequestBody final InviteMemberDTO dto) {
        // 家庭组ID以路径参数为准（更安全，不可被请求体篡改）
        dto.setGroupId(id);
        familyService.inviteMember(dto);
        return Result.success();
    }

    /**
     * 查询家庭组成员列表.
     *
     * @param id 家庭组ID
     * @return 成员信息列表
     */
    @GetMapping("/groups/{id}/members")
    public Result<List<FamilyMemberVO>> members(@PathVariable final Long id) {
        return Result.success(familyService.getGroupMembers(id));
    }

    /**
     * 授权或取消授权成员查看指标.
     *
     * @param id  家庭组ID
     * @param dto 授权请求
     * @return 操作结果
     */
    @PostMapping("/groups/{id}/authorize")
    public Result<Void> authorize(@PathVariable final Long id,
                                  @Valid @RequestBody final AuthorizeDTO dto) {
        // 家庭组ID以路径参数为准（更安全，不可被请求体篡改）
        dto.setGroupId(id);
        familyService.authorizeView(dto);
        return Result.success();
    }

    /**
     * 查看家庭成员的健康指标.
     *
     * @param id       家庭组ID
     * @param memberId 成员记录ID
     * @return 成员健康指标列表
     */
    @GetMapping("/groups/{id}/members/{memberId}/health")
    public Result<List<MetricVO>> memberHealth(@PathVariable final Long id,
                                                @PathVariable final Long memberId) {
        return Result.success(familyService.getMemberHealth(id, memberId));
    }
}
