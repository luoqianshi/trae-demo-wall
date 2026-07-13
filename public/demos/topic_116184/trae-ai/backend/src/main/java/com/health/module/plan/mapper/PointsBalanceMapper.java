package com.health.module.plan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.plan.entity.PointsBalance;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 积分余额 Mapper.
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface PointsBalanceMapper extends BaseMapper<PointsBalance> {

    /**
     * 查询用户积分余额.
     * <p>
     * user_id 唯一，业务上最多一条，加 LIMIT 1 确保单条返回。
     * </p>
     *
     * @param userId 用户ID
     * @return 余额实体，无则返回 null
     */
    @Select("SELECT * FROM points_balance WHERE user_id = #{userId} LIMIT 1")
    PointsBalance findByUserId(@Param("userId") Long userId);
}
