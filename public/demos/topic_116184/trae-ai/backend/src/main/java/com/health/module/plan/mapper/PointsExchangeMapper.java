package com.health.module.plan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.plan.entity.PointsExchange;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 积分兑换商品 Mapper.
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface PointsExchangeMapper extends BaseMapper<PointsExchange> {

    /**
     * 查询已上架的兑换商品列表（限制 50 条）.
     *
     * @return 可兑换商品列表
     */
    @Select("SELECT * FROM points_exchange WHERE enabled = 1 ORDER BY created_at DESC LIMIT 50")
    List<PointsExchange> findEnabled();
}
