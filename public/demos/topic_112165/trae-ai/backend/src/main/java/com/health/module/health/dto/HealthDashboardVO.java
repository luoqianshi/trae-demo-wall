package com.health.module.health.dto;

import lombok.Data;

import java.util.List;

/**
 * 健康看板响应 VO。
 * <p>
 * 包含状态概览与大类卡片列表。
 * </p>
 */
@Data
public class HealthDashboardVO {

    /** 状态概览 */
    private Summary summary;

    /** 大类卡片列表 */
    private List<CategoryVO> categories;

    /**
     * 状态概览内部类。
     */
    @Data
    public static class Summary {
        /** 正常指标数 */
        private int normal;
        /** 预警指标数 */
        private int warning;
        /** 危险指标数 */
        private int danger;
    }
}
