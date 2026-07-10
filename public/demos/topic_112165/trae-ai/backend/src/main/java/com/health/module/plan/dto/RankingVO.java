package com.health.module.plan.dto;

import lombok.Data;

/**
 * 积分排行展示 VO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class RankingVO {

    /** 用户ID. */
    private Long userId;

    /** 用户姓名. */
    private String name;

    /** 积分合计. */
    private Integer totalPoints;
}
