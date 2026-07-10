package com.health.module.plan.dto;

import com.health.module.plan.entity.PointsRecord;
import lombok.Data;

import java.util.List;

/**
 * 积分信息展示 VO.
 * <p>
 * 包含当前用户余额与最近积分记录。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class PointsVO {

    /** 积分余额. */
    private Integer balance;

    /** 最近积分记录列表. */
    private List<PointsRecord> records;
}
