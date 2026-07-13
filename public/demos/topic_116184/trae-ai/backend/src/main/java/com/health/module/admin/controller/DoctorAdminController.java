package com.health.module.admin.controller;

import com.health.common.BusinessException;
import com.health.common.Result;
import com.health.common.ResultCode;
import com.health.module.admin.dto.DoctorAdminVO;
import com.health.module.admin.dto.DoctorAuditDTO;
import com.health.module.admin.mapper.AdminMapper;
import com.health.module.user.entity.DoctorInfo;
import com.health.module.user.mapper.DoctorInfoMapper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.Set;

/**
 * 医生管理接口（后台）.
 * <p>
 * 提供医生列表查询（含审核状态）与审核功能。
 * 权限由 SecurityConfig 中 /api/admin/** 需 ADMIN 角色控制。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@RestController
@RequestMapping("/api/admin/doctors")
public class DoctorAdminController {

    /** 允许的审核状态值. */
    private static final Set<String> ALLOWED_AUDIT_STATUS = Set.of(DoctorInfo.AUDIT_APPROVED, DoctorInfo.AUDIT_REJECTED);

    private final AdminMapper adminMapper;

    private final DoctorInfoMapper doctorInfoMapper;

    public DoctorAdminController(final AdminMapper adminMapper, final DoctorInfoMapper doctorInfoMapper) {
        this.adminMapper = adminMapper;
        this.doctorInfoMapper = doctorInfoMapper;
    }

    /**
     * 查询医生列表（含审核状态与用户信息）.
     *
     * @return 医生列表
     */
    @GetMapping
    public Result<List<DoctorAdminVO>> listDoctors() {
        final List<DoctorAdminVO> doctors = adminMapper.selectDoctorsWithUserInfo();
        if (doctors == null) {
            return Result.success(Collections.emptyList());
        }
        return Result.success(doctors);
    }

    /**
     * 审核医生（通过/拒绝）.
     *
     * @param id  医生用户ID
     * @param dto 审核请求
     * @return 成功响应
     */
    @PutMapping("/{id}/audit")
    public Result<Void> auditDoctor(@PathVariable final Long id, @RequestBody final DoctorAuditDTO dto) {
        if (StringUtils.isBlank(dto.getAuditStatus())
                || !ALLOWED_AUDIT_STATUS.contains(dto.getAuditStatus())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "审核状态仅支持 APPROVED 或 REJECTED");
        }

        final DoctorInfo doctor = doctorInfoMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<DoctorInfo>()
                        .eq(DoctorInfo::getUserId, id));
        if (doctor == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "医生信息不存在");
        }

        doctor.setAuditStatus(dto.getAuditStatus());
        doctorInfoMapper.updateById(doctor);
        return Result.success();
    }
}
