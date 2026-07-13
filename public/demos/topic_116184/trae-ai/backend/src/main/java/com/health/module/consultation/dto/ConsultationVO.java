package com.health.module.consultation.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 问诊会话展示 VO.
 * <p>
 * 包含会话基本信息以及关联的患者、医生信息。
 * imagesJson 为数据库原始 JSON 字符串，仅用于内部转换，不序列化输出。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Data
public class ConsultationVO {

    /** 会话ID */
    private Long id;

    /** 用户（患者）ID */
    private Long userId;

    /** 医生ID */
    private Long doctorId;

    /** 问诊类型 REALTIME/ASYNC */
    private String type;

    /** 状态 WAITING/IN_PROGRESS/CLOSED */
    private String status;

    /** 主诉 */
    private String chiefComplaint;

    /** 症状描述 */
    private String symptomDesc;

    /** 持续时间 */
    private String duration;

    /** 伴随症状 */
    private String accompanying;

    /** 相关图片URL列表 */
    private List<String> images;

    /** 数据库原始图片JSON字符串，仅用于内部转换，不对前端暴露 */
    @JsonIgnore
    private String imagesJson;

    /** 追问次数 */
    private Integer replyCount;

    /** 评分 1-5，null 表示未评价 */
    private Integer rating;

    /** 评价内容 */
    private String ratingComment;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 关闭时间 */
    private LocalDateTime closedAt;

    /** 患者姓名 */
    private String userName;

    /** 医生姓名 */
    private String doctorName;

    /** 医生职称 */
    private String doctorTitle;

    /** 医生科室 */
    private String doctorDepartment;
}
