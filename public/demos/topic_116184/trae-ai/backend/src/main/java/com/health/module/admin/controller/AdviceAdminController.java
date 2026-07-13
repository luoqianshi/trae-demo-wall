package com.health.module.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.health.common.PageResult;
import com.health.common.Result;
import com.health.module.health.entity.AdviceTemplate;
import com.health.module.health.mapper.AdviceTemplateMapper;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 健康建议模板管理接口（后台）.
 * <p>
 * 提供建议模板的增删改查功能。
 * 权限由 SecurityConfig 中 /api/admin/** 需 ADMIN 角色控制。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@RestController
@RequestMapping("/api/admin/advice")
public class AdviceAdminController {

    private final AdviceTemplateMapper adviceTemplateMapper;

    public AdviceAdminController(final AdviceTemplateMapper adviceTemplateMapper) {
        this.adviceTemplateMapper = adviceTemplateMapper;
    }

    /**
     * 分页查询建议模板列表.
     *
     * @param page 页码（默认1）
     * @param size 每页条数（默认10）
     * @return 分页结果
     */
    @GetMapping
    public Result<PageResult<AdviceTemplate>> listAdvice(
            @RequestParam(defaultValue = "1") final int page,
            @RequestParam(defaultValue = "10") final int size) {
        final Page<AdviceTemplate> pageParam = new Page<>(page, size);
        final LambdaQueryWrapper<AdviceTemplate> wrapper = new LambdaQueryWrapper<AdviceTemplate>()
                .orderByDesc(AdviceTemplate::getVersion);

        final Page<AdviceTemplate> result = adviceTemplateMapper.selectPage(pageParam, wrapper);
        return Result.success(new PageResult<>(page, size, result.getTotal(), result.getRecords()));
    }

    /**
     * 新增建议模板.
     *
     * @param advice 建议模板信息
     * @return 成功响应
     */
    @PostMapping
    public Result<Void> addAdvice(@RequestBody final AdviceTemplate advice) {
        if (advice.getEnabled() == null) {
            advice.setEnabled(1);
        }
        if (advice.getVersion() == null) {
            advice.setVersion(1);
        }
        adviceTemplateMapper.insert(advice);
        return Result.success();
    }

    /**
     * 修改建议模板.
     *
     * @param id     建议模板ID
     * @param advice 建议模板信息
     * @return 成功响应
     */
    @PutMapping("/{id}")
    public Result<Void> updateAdvice(@PathVariable final Long id, @RequestBody final AdviceTemplate advice) {
        advice.setId(id);
        adviceTemplateMapper.updateById(advice);
        return Result.success();
    }

    /**
     * 删除建议模板.
     *
     * @param id 建议模板ID
     * @return 成功响应
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteAdvice(@PathVariable final Long id) {
        adviceTemplateMapper.deleteById(id);
        return Result.success();
    }
}
