package com.health.module.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.health.common.BusinessException;
import com.health.common.PageResult;
import com.health.common.Result;
import com.health.common.ResultCode;
import com.health.module.admin.dto.UserStatusDTO;
import com.health.module.user.entity.SysUser;
import com.health.module.user.mapper.SysUserMapper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户管理接口（后台）.
 * <p>
 * 提供用户列表查询（分页+搜索）与启用/禁用功能。
 * 权限由 SecurityConfig 中 /api/admin/** 需 ADMIN 角色控制。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@RestController
@RequestMapping("/api/admin/users")
public class UserAdminController {

    private final SysUserMapper sysUserMapper;

    public UserAdminController(final SysUserMapper sysUserMapper) {
        this.sysUserMapper = sysUserMapper;
    }

    /**
     * 分页查询用户列表（支持按姓名或手机号搜索）.
     *
     * @param page   页码（默认1）
     * @param size   每页条数（默认10）
     * @param keyword 搜索关键字（姓名或手机号，可选）
     * @return 分页结果
     */
    @GetMapping
    public Result<PageResult<SysUser>> listUsers(
            @RequestParam(defaultValue = "1") final int page,
            @RequestParam(defaultValue = "10") final int size,
            @RequestParam(required = false) final String keyword) {
        final Page<SysUser> pageParam = new Page<>(page, size);
        final LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.isNotBlank(keyword)) {
            wrapper.like(SysUser::getName, keyword)
                    .or()
                    .like(SysUser::getPhone, keyword);
        }
        wrapper.orderByDesc(SysUser::getCreatedAt);

        final Page<SysUser> result = sysUserMapper.selectPage(pageParam, wrapper);
        return Result.success(new PageResult<>(page, size, result.getTotal(), result.getRecords()));
    }

    /**
     * 启用/禁用用户.
     *
     * @param id  用户ID
     * @param dto 状态更新请求
     * @return 成功响应
     */
    @PutMapping("/{id}/status")
    public Result<Void> updateUserStatus(@PathVariable final Long id, @RequestBody final UserStatusDTO dto) {
        final SysUser user = sysUserMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        final SysUser update = new SysUser();
        update.setId(id);
        update.setStatus(dto.getStatus());
        sysUserMapper.updateById(update);
        return Result.success();
    }
}
