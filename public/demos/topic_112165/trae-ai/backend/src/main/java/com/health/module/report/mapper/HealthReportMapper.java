package com.health.module.report.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.report.entity.HealthReport;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 健康报告 Mapper 接口.
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface HealthReportMapper extends BaseMapper<HealthReport> {

    /**
     * 查询用户的健康报告列表，限制最多 100 条.
     *
     * @param userId 用户ID
     * @return 报告列表（按创建时间倒序）
     */
    @Select("SELECT * FROM health_report WHERE user_id = #{userId} ORDER BY created_at DESC LIMIT 100")
    List<HealthReport> findByUserId(@Param("userId") Long userId);
}
