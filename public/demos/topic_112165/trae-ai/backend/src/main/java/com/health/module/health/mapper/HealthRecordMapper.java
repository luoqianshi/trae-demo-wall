package com.health.module.health.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.health.entity.HealthRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 健康指标记录 Mapper。
 */
@Mapper
public interface HealthRecordMapper extends BaseMapper<HealthRecord> {

    /**
     * 查询用户某指标最新一条记录。
     * <p>
     * 仅取一条（最新记录），使用 LIMIT 1 限制结果集。
     * </p>
     *
     * @param userId   用户 ID
     * @param metricId 指标项 ID
     * @return 最新记录，无则返回 null
     */
    @Select("SELECT * FROM health_record " +
            "WHERE user_id = #{userId} AND metric_id = #{metricId} " +
            "ORDER BY recorded_at DESC LIMIT 1")
    HealthRecord findLatestRecord(@Param("userId") Long userId, @Param("metricId") Long metricId);

    /**
     * 查询用户某指标近 N 天的记录（趋势数据），限制最多 500 条。
     *
     * @param userId   用户 ID
     * @param metricId 指标项 ID
     * @param startTime 开始时间
     * @return 记录列表（按时间升序）
     */
    @Select("SELECT * FROM health_record " +
            "WHERE user_id = #{userId} AND metric_id = #{metricId} " +
            "AND recorded_at >= #{startTime} " +
            "ORDER BY recorded_at ASC LIMIT 500")
    List<HealthRecord> findTrendRecords(@Param("userId") Long userId,
                                        @Param("metricId") Long metricId,
                                        @Param("startTime") LocalDateTime startTime);

    /**
     * 查询用户某指标最近 N 条记录（用于连续异常检测）。
     *
     * @param userId   用户 ID
     * @param metricId 指标项 ID
     * @param limit    查询条数上限
     * @return 记录列表（按时间倒序）
     */
    @Select("SELECT * FROM health_record " +
            "WHERE user_id = #{userId} AND metric_id = #{metricId} " +
            "ORDER BY recorded_at DESC LIMIT #{limit}")
    List<HealthRecord> findRecentRecords(@Param("userId") Long userId,
                                         @Param("metricId") Long metricId,
                                         @Param("limit") int limit);

    /**
     * 查询用户在指定时间段内的健康记录（用于报告生成），限制最多 500 条.
     *
     * @param userId    用户ID
     * @param startTime 开始时间
     * @param endTime   结束时间
     * @param limit     查询条数上限
     * @return 记录列表（按采集时间倒序）
     */
    @Select("SELECT * FROM health_record " +
            "WHERE user_id = #{userId} " +
            "AND recorded_at >= #{startTime} AND recorded_at <= #{endTime} " +
            "ORDER BY recorded_at DESC LIMIT #{limit}")
    List<HealthRecord> findRecordsByPeriod(@Param("userId") Long userId,
                                            @Param("startTime") LocalDateTime startTime,
                                            @Param("endTime") LocalDateTime endTime,
                                            @Param("limit") int limit);

    /**
     * 查询用户最近的健康记录（不限指标，用于家庭成员指标查看），限制最多 100 条.
     *
     * @param userId 用户ID
     * @param limit  查询条数上限
     * @return 记录列表（按采集时间倒序）
     */
    @Select("SELECT * FROM health_record " +
            "WHERE user_id = #{userId} " +
            "ORDER BY recorded_at DESC LIMIT #{limit}")
    List<HealthRecord> findRecentRecordsByUser(@Param("userId") Long userId,
                                                @Param("limit") int limit);
}
