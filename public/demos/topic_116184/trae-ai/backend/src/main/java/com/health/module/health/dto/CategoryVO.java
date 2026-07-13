package com.health.module.health.dto;

import lombok.Data;

import java.util.List;

/**
 * 指标大类卡片 VO。
 */
@Data
public class CategoryVO {

    private Long id;

    private String name;

    private String icon;

    private String color;

    private Integer sortOrder;

    /** 该大类下的指标列表 */
    private List<MetricVO> metrics;
}
