package com.health.module.plan.dto;

import lombok.Data;

/**
 * 兑换商品展示 VO.
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class ExchangeItemVO {

    /** 商品ID. */
    private Long id;

    /** 商品名称. */
    private String itemName;

    /** 商品描述. */
    private String description;

    /** 兑换所需积分. */
    private Integer pointsCost;

    /** 库存. */
    private Integer stock;

    /** 商品图片URL. */
    private String imageUrl;
}
