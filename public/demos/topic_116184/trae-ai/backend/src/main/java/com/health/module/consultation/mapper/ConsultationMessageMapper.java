package com.health.module.consultation.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.consultation.entity.ConsultationMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 问诊消息 Mapper.
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface ConsultationMessageMapper extends BaseMapper<ConsultationMessage> {

    /**
     * 按会话ID查询消息列表.
     * <p>
     * 按发送时间升序排列，限制最多 200 条，避免大消息集导致内存压力。
     * </p>
     *
     * @param consultationId 问诊会话ID
     * @return 消息列表（按时间升序）
     */
    @Select("SELECT * FROM consultation_message " +
            "WHERE consultation_id = #{consultationId} " +
            "ORDER BY sent_at ASC LIMIT 200")
    List<ConsultationMessage> findByConsultationId(@Param("consultationId") Long consultationId);
}
