package com.health.module.health.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.health.entity.AlertRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 告警记录 Mapper。
 */
@Mapper
public interface AlertRecordMapper extends BaseMapper<AlertRecord> {

    /**
     * 查询用户各告警等级的计数（用于看板概览）。
     *
     * @param userId 用户 ID
     * @return 告警等级与计数的映射列表，每项含 level 与 count 字段
     */
    @Select("SELECT level, COUNT(*) AS count FROM alert_record " +
            "WHERE user_id = #{userId} AND status = 'NEW' " +
            "GROUP BY level")
    List<Map<String, Object>> countByLevel(@Param("userId") Long userId);

    /**
     * 查询用户最新的告警记录（每个指标取最新一条）。
     * <p>
     * 通过子查询取每个 metric_id 的最大 id，再关联查询详情。
     * 使用 #{} 预编译占位符。
     * </p>
     *
     * @param userId 用户 ID
     * @return 最新告警记录列表
     */
    @Select("SELECT a.* FROM alert_record a " +
            "INNER JOIN (SELECT metric_id, MAX(id) AS max_id FROM alert_record " +
            "            WHERE user_id = #{userId} GROUP BY metric_id) b " +
            "ON a.id = b.max_id " +
            "WHERE a.user_id = #{userId}")
    List<AlertRecord> findLatestAlerts(@Param("userId") Long userId);

    /**
     * 查询用户在指定时间段内的异常告警记录（不含 NORMAL），限制最多 200 条.
     *
     * @param userId    用户ID
     * @param startTime 开始时间
     * @param endTime   结束时间
     * @param limit     查询条数上限
     * @return 异常告警记录列表（按创建时间倒序）
     */
    @Select("SELECT * FROM alert_record " +
            "WHERE user_id = #{userId} AND level != 'NORMAL' " +
            "AND created_at >= #{startTime} AND created_at <= #{endTime} " +
            "ORDER BY created_at DESC LIMIT #{limit}")
    List<AlertRecord> findAbnormalAlerts(@Param("userId") Long userId,
                                          @Param("startTime") java.time.LocalDateTime startTime,
                                          @Param("endTime") java.time.LocalDateTime endTime,
                                          @Param("limit") int limit);
}
