package com.health.module.plan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.plan.entity.HealthPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 健康计划 Mapper.
 * <p>
 * 所有列表查询均带 LIMIT 限制，禁止无限制拉取。
 * 使用 #{} 预编译占位符，禁止字符串拼接 SQL。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface HealthPlanMapper extends BaseMapper<HealthPlan> {

    /**
     * 查询用户的计划列表（按创建时间倒序，限制 100 条）.
     *
     * @param userId 用户ID
     * @return 计划列表
     */
    @Select("SELECT * FROM health_plan WHERE user_id = #{userId} ORDER BY created_at DESC LIMIT 100")
    List<HealthPlan> findByUserId(@Param("userId") Long userId);
}
