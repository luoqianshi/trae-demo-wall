package com.health.module.plan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.plan.entity.PlanCheckin;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;

/**
 * 计划打卡 Mapper.
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface PlanCheckinMapper extends BaseMapper<PlanCheckin> {

    /**
     * 查询某计划某天是否已打卡.
     * <p>
     * (plan_id, task_date) 唯一，业务上最多一条，加 LIMIT 1 确保单条返回。
     * </p>
     *
     * @param planId   计划ID
     * @param taskDate 打卡日期
     * @return 打卡记录，无则返回 null
     */
    @Select("SELECT * FROM plan_checkin WHERE plan_id = #{planId} AND task_date = #{taskDate} LIMIT 1")
    PlanCheckin findByPlanIdAndDate(@Param("planId") Long planId, @Param("taskDate") LocalDate taskDate);
}
