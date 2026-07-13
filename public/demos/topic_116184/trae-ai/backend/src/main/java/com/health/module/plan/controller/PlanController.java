package com.health.module.plan.controller;

import com.health.common.Result;
import com.health.module.plan.dto.CheckinDTO;
import com.health.module.plan.dto.CreatePlanDTO;
import com.health.module.plan.dto.PlanVO;
import com.health.module.plan.service.PlanService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 健康计划接口.
 * <p>
 * 提供计划创建、推荐、打卡与查询功能。
 * 当前用户身份从 SecurityContext 获取，前端无需也无法传入 userId。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@RestController
@RequestMapping("/api/plans")
public class PlanController {

    private final PlanService planService;

    public PlanController(final PlanService planService) {
        this.planService = planService;
    }

    /**
     * 根据用户异常指标推荐健康计划.
     *
     * @return 推荐计划列表
     */
    @PostMapping("/recommend")
    public Result<List<PlanVO>> recommendPlan() {
        return Result.success(planService.recommendPlan());
    }

    /**
     * 创建健康计划.
     *
     * @param dto 创建计划请求
     * @return 创建的计划ID
     */
    @PostMapping
    public Result<Long> createPlan(@Valid @RequestBody final CreatePlanDTO dto) {
        return Result.success(planService.createPlan(dto));
    }

    /**
     * 计划打卡.
     *
     * @param id  计划ID
     * @param dto 打卡请求
     * @return 成功响应
     */
    @PostMapping("/{id}/checkin")
    public Result<Void> checkin(@PathVariable final Long id, @Valid @RequestBody final CheckinDTO dto) {
        // 以路径参数 id 为准，覆盖 DTO 中的 planId，避免不一致
        dto.setPlanId(id);
        planService.checkin(dto);
        return Result.success();
    }

    /**
     * 查询当前用户的计划列表.
     *
     * @return 计划列表
     */
    @GetMapping("/mine")
    public Result<List<PlanVO>> getMyPlans() {
        return Result.success(planService.getMyPlans());
    }
}
