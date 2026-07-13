package com.health.module.consultation.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.consultation.dto.ConsultationVO;
import com.health.module.consultation.dto.DoctorVO;
import com.health.module.consultation.entity.Consultation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 问诊会话 Mapper.
 * <p>
 * 提供会话的基础 CRUD（继承 BaseMapper）及关联查询。
 * 所有列表查询均带 LIMIT 限制，禁止无限制拉取。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface ConsultationMapper extends BaseMapper<Consultation> {

    /**
     * 查询已审核通过且启用的医生列表.
     * <p>
     * JOIN doctor_info 与 sys_user，过滤审核通过且账号启用的医生。
     * 返回 DoctorVO（online 字段由服务层从 Redis 填充）。
     * </p>
     *
     * @return 医生列表
     */
    @Select("SELECT d.user_id AS id, u.name AS name, d.title AS title, " +
            "d.department AS department, d.specialties AS specialties, d.rating AS rating " +
            "FROM doctor_info d " +
            "JOIN sys_user u ON d.user_id = u.id " +
            "WHERE d.audit_status = 'APPROVED' AND u.status = 1 AND u.deleted = 0 " +
            "ORDER BY d.rating DESC LIMIT 100")
    List<DoctorVO> findOnlineDoctors();

    /**
     * 查询用户的问诊列表（分页）.
     * <p>
     * JOIN sys_user 与 doctor_info 填充患者和医生信息。
     * images 映射到 imagesJson 字段，由服务层解析为 List。
     * </p>
     *
     * @param userId 用户ID
     * @param limit  每页条数
     * @param offset 偏移量
     * @return 问诊列表
     */
    @Select("SELECT c.id, c.user_id, c.doctor_id, c.type, c.status, " +
            "c.chief_complaint, c.symptom_desc, c.duration, c.accompanying, " +
            "c.images AS images_json, c.reply_count, c.rating, c.rating_comment, " +
            "c.created_at, c.closed_at, " +
            "u.name AS user_name, du.name AS doctor_name, " +
            "d.title AS doctor_title, d.department AS doctor_department " +
            "FROM consultation c " +
            "LEFT JOIN sys_user u ON c.user_id = u.id " +
            "LEFT JOIN doctor_info d ON c.doctor_id = d.user_id " +
            "LEFT JOIN sys_user du ON c.doctor_id = du.id " +
            "WHERE c.user_id = #{userId} " +
            "ORDER BY c.created_at DESC " +
            "LIMIT #{limit} OFFSET #{offset}")
    List<ConsultationVO> findUserConsultations(@Param("userId") Long userId,
                                                @Param("limit") int limit,
                                                @Param("offset") int offset);

    /**
     * 查询医生的接诊列表（分页）.
     * <p>
     * JOIN sys_user 与 doctor_info 填充患者和医生信息。
     * images 映射到 imagesJson 字段，由服务层解析为 List。
     * </p>
     *
     * @param doctorId 医生用户ID
     * @param limit    每页条数
     * @param offset   偏移量
     * @return 接诊列表
     */
    @Select("SELECT c.id, c.user_id, c.doctor_id, c.type, c.status, " +
            "c.chief_complaint, c.symptom_desc, c.duration, c.accompanying, " +
            "c.images AS images_json, c.reply_count, c.rating, c.rating_comment, " +
            "c.created_at, c.closed_at, " +
            "u.name AS user_name, du.name AS doctor_name, " +
            "d.title AS doctor_title, d.department AS doctor_department " +
            "FROM consultation c " +
            "LEFT JOIN sys_user u ON c.user_id = u.id " +
            "LEFT JOIN doctor_info d ON c.doctor_id = d.user_id " +
            "LEFT JOIN sys_user du ON c.doctor_id = du.id " +
            "WHERE c.doctor_id = #{doctorId} " +
            "ORDER BY c.created_at DESC " +
            "LIMIT #{limit} OFFSET #{offset}")
    List<ConsultationVO> findDoctorConsultations(@Param("doctorId") Long doctorId,
                                                  @Param("limit") int limit,
                                                  @Param("offset") int offset);
}
