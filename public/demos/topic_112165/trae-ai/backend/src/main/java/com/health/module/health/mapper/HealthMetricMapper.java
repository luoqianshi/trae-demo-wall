package com.health.module.health.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.health.entity.HealthMetric;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 健康指标项 Mapper。
 */
@Mapper
public interface HealthMetricMapper extends BaseMapper<HealthMetric> {

    /**
     * 查询用户适用的指标项（按性别与年龄过滤，且启用状态）。
     * <p>
     * 使用 #{} 预编译占位符，禁止字符串拼接 SQL。
     * </p>
     *
     * @param gender 用户性别
     * @param age    用户年龄
     * @return 适用指标项列表
     */
    @Select("SELECT * FROM health_metric " +
            "WHERE enabled = 1 " +
            "AND (applicable_gender = 'ALL' OR applicable_gender = #{gender}) " +
            "AND (age_min IS NULL OR age_min <= #{age}) " +
            "AND (age_max IS NULL OR age_max >= #{age}) " +
            "ORDER BY category_id, sort_order")
    List<HealthMetric> findApplicableMetrics(@Param("gender") String gender, @Param("age") Integer age);
}
