package com.health.module.plan.controller;

import com.health.common.Result;
import com.health.module.plan.dto.ExchangeDTO;
import com.health.module.plan.dto.ExchangeItemVO;
import com.health.module.plan.dto.PointsVO;
import com.health.module.plan.dto.RankingVO;
import com.health.module.plan.service.PointsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 积分接口.
 * <p>
 * 提供积分余额查询、排行榜、兑换商品查询与兑换功能。
 * 当前用户身份从 SecurityContext 获取，前端无需也无法传入 userId。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@RestController
@RequestMapping("/api/points")
public class PointsController {

    private final PointsService pointsService;

    public PointsController(final PointsService pointsService) {
        this.pointsService = pointsService;
    }

    /**
     * 查询当前用户积分余额与最近记录.
     *
     * @return 积分信息
     */
    @GetMapping("/balance")
    public Result<PointsVO> getBalance() {
        return Result.success(pointsService.getBalance());
    }

    /**
     * 查询积分排行榜.
     *
     * @param period 周期 WEEK/MONTH，默认 WEEK
     * @return 排行榜列表
     */
    @GetMapping("/ranking")
    public Result<List<RankingVO>> getRanking(
            @RequestParam(defaultValue = "WEEK") final String period) {
        return Result.success(pointsService.getRanking(period));
    }

    /**
     * 查询可兑换商品列表.
     *
     * @return 兑换商品列表
     */
    @GetMapping("/exchange-items")
    public Result<List<ExchangeItemVO>> getExchangeItems() {
        return Result.success(pointsService.getExchangeItems());
    }

    /**
     * 兑换商品.
     *
     * @param itemId 兑换商品ID
     * @param dto    兑换请求（itemId 以路径参数为准）
     * @return 成功响应
     */
    @PostMapping("/exchange/{itemId}")
    public Result<Void> exchange(@PathVariable final Long itemId, @Valid @RequestBody final ExchangeDTO dto) {
        // 以路径参数 itemId 为准，覆盖 DTO 中的值，避免不一致
        dto.setItemId(itemId);
        pointsService.exchange(dto);
        return Result.success();
    }
}
