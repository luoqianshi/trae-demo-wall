package com.fridgemagic.service;

import com.fridgemagic.entity.WeeklyPlan;
import com.fridgemagic.mapper.WeeklyPlanMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WeeklyPlanService {

    private final WeeklyPlanMapper weeklyPlanMapper;

    public WeeklyPlanService(WeeklyPlanMapper weeklyPlanMapper) {
        this.weeklyPlanMapper = weeklyPlanMapper;
    }

    public List<WeeklyPlan> findByUserIdAndWeek(Long userId, String weekStart) {
        return weeklyPlanMapper.findByUserIdAndWeek(userId, weekStart);
    }

    @Transactional
    public void savePlan(Long userId, String weekStart, List<WeeklyPlan> plans) {
        weeklyPlanMapper.deleteByWeek(userId, weekStart);
        for (WeeklyPlan plan : plans) {
            plan.setUserId(userId);
            plan.setWeekStart(java.time.LocalDate.parse(weekStart));
            weeklyPlanMapper.insert(plan);
        }
    }
}