package com.health.module.plan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.plan.dto.RankingVO;
import com.health.module.plan.entity.PointsRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 积分记录 Mapper.
 * <p>
 * 所有列表查询均带 LIMIT 限制。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface PointsRecordMapper extends BaseMapper<PointsRecord> {

    /**
     * 查询用户积分记录（按创建时间倒序，限制 100 条）.
     *
     * @param userId 用户ID
     * @return 积分记录列表
     */
    @Select("SELECT * FROM points_record WHERE user_id = #{userId} ORDER BY created_at DESC LIMIT 100")
    List<PointsRecord> findByUserId(@Param("userId") Long userId);

    /**
     * 查询指定时间段内积分排行（按获得积分合计倒序，限制 50 名）.
     * <p>
     * 仅统计 EARN 类型（正积分），GROUP BY user_id 聚合后 JOIN sys_user 取姓名。
     * </p>
     *
     * @param startTime 开始时间
     * @param endTime   结束时间
     * @return 排行榜列表
     */
    @Select("SELECT r.user_id AS userId, u.name AS name, SUM(r.points) AS totalPoints " +
            "FROM points_record r " +
            "LEFT JOIN sys_user u ON r.user_id = u.id " +
            "WHERE r.type = 'EARN' " +
            "AND r.created_at >= #{startTime} AND r.created_at <= #{endTime} " +
            "GROUP BY r.user_id, u.name " +
            "ORDER BY SUM(r.points) DESC LIMIT 50")
    List<RankingVO> ranking(@Param("startTime") LocalDateTime startTime,
                            @Param("endTime") LocalDateTime endTime);
}
