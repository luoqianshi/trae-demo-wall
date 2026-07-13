package com.health.module.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.health.common.BusinessException;
import com.health.common.PageResult;
import com.health.common.Result;
import com.health.common.ResultCode;
import com.health.module.health.entity.HealthCategory;
import com.health.module.health.entity.HealthMetric;
import com.health.module.health.mapper.HealthCategoryMapper;
import com.health.module.health.mapper.HealthMetricMapper;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 健康指标管理接口（后台）.
 * <p>
 * 提供指标大类与指标项的增删改查功能。
 * 权限由 SecurityConfig 中 /api/admin/** 需 ADMIN 角色控制。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@RestController
@RequestMapping("/api/admin/metrics")
public class MetricAdminController {

    private final HealthCategoryMapper healthCategoryMapper;

    private final HealthMetricMapper healthMetricMapper;

    public MetricAdminController(final HealthCategoryMapper healthCategoryMapper,
                                 final HealthMetricMapper healthMetricMapper) {
        this.healthCategoryMapper = healthCategoryMapper;
        this.healthMetricMapper = healthMetricMapper;
    }

    /**
     * 查询所有启用的指标大类.
     *
     * @return 大类列表
     */
    @GetMapping("/categories")
    public Result<List<HealthCategory>> listCategories() {
        final List<HealthCategory> categories = healthCategoryMapper.selectList(
                new LambdaQueryWrapper<HealthCategory>()
                        .orderByAsc(HealthCategory::getSortOrder));
        return Result.success(categories);
    }

    /**
     * 新增指标大类.
     *
     * @param category 大类信息
     * @return 成功响应
     */
    @PostMapping("/categories")
    public Result<Void> addCategory(@RequestBody final HealthCategory category) {
        if (category.getEnabled() == null) {
            category.setEnabled(1);
        }
        if (category.getSortOrder() == null) {
            category.setSortOrder(0);
        }
        healthCategoryMapper.insert(category);
        return Result.success();
    }

    /**
     * 修改指标大类.
     *
     * @param id       大类ID
     * @param category 大类信息
     * @return 成功响应
     */
    @PutMapping("/categories/{id}")
    public Result<Void> updateCategory(@PathVariable final Long id, @RequestBody final HealthCategory category) {
        category.setId(id);
        healthCategoryMapper.updateById(category);
        return Result.success();
    }

    /**
     * 删除指标大类（逻辑禁用）.
     * <p>
     * 大类下可能关联指标项，采用禁用而非物理删除。
     * </p>
     *
     * @param id 大类ID
     * @return 成功响应
     */
    @DeleteMapping("/categories/{id}")
    public Result<Void> deleteCategory(@PathVariable final Long id) {
        final HealthCategory update = new HealthCategory();
        update.setId(id);
        update.setEnabled(0);
        healthCategoryMapper.updateById(update);
        return Result.success();
    }

    /**
     * 分页查询指标项.
     *
     * @param page       页码（默认1）
     * @param size       每页条数（默认10）
     * @param categoryId 大类ID（可选筛选）
     * @return 分页结果
     */
    @GetMapping
    public Result<PageResult<HealthMetric>> listMetrics(
            @RequestParam(defaultValue = "1") final int page,
            @RequestParam(defaultValue = "10") final int size,
            @RequestParam(required = false) final Long categoryId) {
        final Page<HealthMetric> pageParam = new Page<>(page, size);
        final LambdaQueryWrapper<HealthMetric> wrapper = new LambdaQueryWrapper<>();
        if (categoryId != null) {
            wrapper.eq(HealthMetric::getCategoryId, categoryId);
        }
        wrapper.orderByAsc(HealthMetric::getCategoryId).orderByAsc(HealthMetric::getSortOrder);

        final Page<HealthMetric> result = healthMetricMapper.selectPage(pageParam, wrapper);
        return Result.success(new PageResult<>(page, size, result.getTotal(), result.getRecords()));
    }

    /**
     * 新增指标项（含阈值配置）.
     *
     * @param metric 指标项信息
     * @return 成功响应
     */
    @PostMapping
    public Result<Void> addMetric(@RequestBody final HealthMetric metric) {
        if (metric.getEnabled() == null) {
            metric.setEnabled(1);
        }
        if (metric.getSortOrder() == null) {
            metric.setSortOrder(0);
        }
        healthMetricMapper.insert(metric);
        return Result.success();
    }

    /**
     * 修改指标项（含阈值配置）.
     *
     * @param id     指标项ID
     * @param metric 指标项信息
     * @return 成功响应
     */
    @PutMapping("/{id}")
    public Result<Void> updateMetric(@PathVariable final Long id, @RequestBody final HealthMetric metric) {
        metric.setId(id);
        healthMetricMapper.updateById(metric);
        return Result.success();
    }

    /**
     * 启用/停用指标项.
     *
     * @param id 指标项ID
     * @return 成功响应
     */
    @PutMapping("/{id}/toggle")
    public Result<Void> toggleMetric(@PathVariable final Long id) {
        final HealthMetric metric = healthMetricMapper.selectById(id);
        if (metric == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "指标项不存在");
        }
        final int newStatus = (metric.getEnabled() != null && metric.getEnabled() == 1) ? 0 : 1;
        final HealthMetric update = new HealthMetric();
        update.setId(id);
        update.setEnabled(newStatus);
        healthMetricMapper.updateById(update);
        return Result.success();
    }

    /**
     * 删除指标项.
     *
     * @param id 指标项ID
     * @return 成功响应
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteMetric(@PathVariable final Long id) {
        healthMetricMapper.deleteById(id);
        return Result.success();
    }
}
