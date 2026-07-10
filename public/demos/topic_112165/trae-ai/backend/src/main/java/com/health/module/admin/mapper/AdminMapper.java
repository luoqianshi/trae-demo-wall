package com.health.module.admin.mapper;

import com.health.module.admin.dto.AlertDistributionVO;
import com.health.module.admin.dto.DoctorAdminVO;
import com.health.module.admin.dto.StatsOverviewVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 后台管理统计 Mapper.
 * <p>
 * 封装跨表聚合查询与医生管理列表查询。
 * 所有查询均带 LIMIT 限制，禁止无限制拉取。
 * 使用 #{} 预编译占位符，禁止字符串拼接 SQL。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface AdminMapper {

    /**
     * 查询平台概览统计（用户数、问诊量、告警量、今日活跃）.
     * <p>
     * 单条聚合结果，加 LIMIT 1 确保单条返回。
     * </p>
     *
     * @param todayStart 今日开始时间
     * @return 概览统计
     */
    @Select("SELECT " +
            "(SELECT COUNT(*) FROM sys_user WHERE deleted = 0) AS userCount, " +
            "(SELECT COUNT(*) FROM consultation) AS consultationCount, " +
            "(SELECT COUNT(*) FROM alert_record) AS alertCount, " +
            "(SELECT COUNT(DISTINCT user_id) FROM health_record WHERE created_at >= #{todayStart}) AS todayActiveCount " +
            "LIMIT 1")
    StatsOverviewVO selectOverview(@Param("todayStart") LocalDateTime todayStart);

    /**
     * 按指标统计异常告警分布（不含 NORMAL），限制 50 条.
     *
     * @return 异常分布列表
     */
    @Select("SELECT a.metric_id AS metricId, m.name AS metricName, COUNT(*) AS alertCount " +
            "FROM alert_record a " +
            "LEFT JOIN health_metric m ON a.metric_id = m.id " +
            "WHERE a.level != 'NORMAL' " +
            "GROUP BY a.metric_id, m.name " +
            "ORDER BY alertCount DESC LIMIT 50")
    List<AlertDistributionVO> selectAlertDistribution();

    /**
     * 查询医生列表（含审核状态与用户信息），限制 100 条.
     *
     * @return 医生管理列表
     */
    @Select("SELECT d.user_id AS userId, u.name AS name, u.phone AS phone, " +
            "d.title AS title, d.department AS department, d.specialties AS specialties, " +
            "d.license_no AS licenseNo, d.audit_status AS auditStatus, d.rating AS rating, " +
            "d.created_at AS createdAt " +
            "FROM doctor_info d " +
            "JOIN sys_user u ON d.user_id = u.id " +
            "WHERE u.deleted = 0 " +
            "ORDER BY d.created_at DESC LIMIT 100")
    List<DoctorAdminVO> selectDoctorsWithUserInfo();
}
