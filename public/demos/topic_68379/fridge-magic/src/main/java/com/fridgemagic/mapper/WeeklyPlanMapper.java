package com.fridgemagic.mapper;

import com.fridgemagic.entity.WeeklyPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface WeeklyPlanMapper {
    int insert(WeeklyPlan plan);
    List<WeeklyPlan> findByUserIdAndWeek(@Param("userId") Long userId, @Param("weekStart") String weekStart);
    int deleteByWeek(@Param("userId") Long userId, @Param("weekStart") String weekStart);
}