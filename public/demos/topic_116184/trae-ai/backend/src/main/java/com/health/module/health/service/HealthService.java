package com.health.module.health.service;

import com.health.common.BusinessException;
import com.health.common.ResultCode;
import com.health.module.health.dto.CategoryVO;
import com.health.module.health.dto.HealthDashboardVO;
import com.health.module.health.dto.MetricVO;
import com.health.module.health.dto.ReportMetricDTO;
import com.health.module.health.entity.AlertRecord;
import com.health.module.health.entity.HealthCategory;
import com.health.module.health.entity.HealthMetric;
import com.health.module.health.entity.HealthRecord;
import com.health.module.health.mapper.AlertRecordMapper;
import com.health.module.health.mapper.HealthCategoryMapper;
import com.health.module.health.mapper.HealthMetricMapper;
import com.health.module.health.mapper.HealthRecordMapper;
import com.health.module.user.entity.SysUser;
import com.health.module.user.mapper.SysUserMapper;
import com.health.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 健康指标服务。
 * <p>
 * 提供看板数据聚合、指标上报、趋势查询等功能。
 * 当前用户身份从 SecurityContext 获取，严禁前端传入。
 * </p>
 */
@Service
public class HealthService {

    /** 日志对象必须为 private static final */
    private static final Logger logger = LoggerFactory.getLogger(HealthService.class);

    private final HealthCategoryMapper healthCategoryMapper;

    private final HealthMetricMapper healthMetricMapper;

    private final HealthRecordMapper healthRecordMapper;

    private final AlertRecordMapper alertRecordMapper;

    private final AlertEngineService alertEngineService;

    private final SysUserMapper sysUserMapper;

    public HealthService(final HealthCategoryMapper healthCategoryMapper,
                         final HealthMetricMapper healthMetricMapper,
                         final HealthRecordMapper healthRecordMapper,
                         final AlertRecordMapper alertRecordMapper,
                         final AlertEngineService alertEngineService,
                         final SysUserMapper sysUserMapper) {
        this.healthCategoryMapper = healthCategoryMapper;
        this.healthMetricMapper = healthMetricMapper;
        this.healthRecordMapper = healthRecordMapper;
        this.alertRecordMapper = alertRecordMapper;
        this.alertEngineService = alertEngineService;
        this.sysUserMapper = sysUserMapper;
    }

    /**
     * 获取健康看板数据。
     * <p>
     * 根据当前用户性别/年龄过滤适用指标，聚合最新值与告警等级。
     * </p>
     *
     * @return 看板数据（含概览与大类卡片）
     */
    public HealthDashboardVO getDashboard() {
        final Long userId = SecurityUtils.getCurrentUserId();
        final SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 计算用户年龄（用于指标适用性过滤）
        final Integer age = calculateAge(user.getBirthDate());
        final String gender = user.getGender();

        // 查询启用的指标大类（按排序）
        final List<HealthCategory> categories = healthCategoryMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<HealthCategory>()
                        .eq(HealthCategory::getEnabled, 1)
                        .orderByAsc(HealthCategory::getSortOrder));

        // 查询用户适用的指标项
        final List<HealthMetric> metrics = healthMetricMapper.findApplicableMetrics(gender, age);

        // 按大类 ID 分组指标
        final Map<Long, List<HealthMetric>> metricsByCategory = metrics.stream()
                .collect(Collectors.groupingBy(HealthMetric::getCategoryId));

        // 查询用户最新告警记录（每个指标最新一条）
        final List<AlertRecord> latestAlerts = alertRecordMapper.findLatestAlerts(userId);
        final Map<Long, AlertRecord> alertMap = latestAlerts.stream()
                .collect(Collectors.toMap(AlertRecord::getMetricId, a -> a, (a, b) -> b));

        // 构建大类卡片 VO
        final List<CategoryVO> categoryVOs = new ArrayList<>();
        int normalCount = 0;
        int warningCount = 0;
        int dangerCount = 0;

        for (final HealthCategory category : categories) {
            final List<HealthMetric> categoryMetrics = metricsByCategory.get(category.getId());
            if (categoryMetrics == null || categoryMetrics.isEmpty()) {
                continue;
            }

            final CategoryVO categoryVO = buildCategoryVO(category, categoryMetrics, userId, alertMap);
            categoryVOs.add(categoryVO);

            // 统计告警等级计数
            for (final MetricVO metricVO : categoryVO.getMetrics()) {
                final String level = metricVO.getAlertLevel();
                if (AlertRecord.LEVEL_DANGER.equals(level)) {
                    dangerCount++;
                } else if (AlertRecord.LEVEL_WARNING.equals(level)) {
                    warningCount++;
                } else {
                    normalCount++;
                }
            }
        }

        // 构建概览
        final HealthDashboardVO.Summary summary = new HealthDashboardVO.Summary();
        summary.setNormal(normalCount);
        summary.setWarning(warningCount);
        summary.setDanger(dangerCount);

        final HealthDashboardVO dashboard = new HealthDashboardVO();
        dashboard.setSummary(summary);
        dashboard.setCategories(categoryVOs);
        return dashboard;
    }

    /**
     * 上报指标数据，触发告警引擎。
     *
     * @param dto 上报请求
     * @return 告警等级
     */
    public String reportMetric(final ReportMetricDTO dto) {
        final Long userId = SecurityUtils.getCurrentUserId();
        final HealthMetric metric = healthMetricMapper.selectById(dto.getMetricId());
        if (metric == null) {
            throw new BusinessException(ResultCode.METRIC_NOT_FOUND);
        }

        // 构建记录
        final HealthRecord record = new HealthRecord();
        record.setUserId(userId);
        record.setMetricId(dto.getMetricId());
        record.setValue(dto.getValue());
        record.setUnit(metric.getUnit());
        record.setSource(dto.getSource() == null ? HealthRecord.SOURCE_MANUAL : dto.getSource());
        record.setRecordedAt(dto.getRecordedAt() == null ? LocalDateTime.now() : dto.getRecordedAt());
        healthRecordMapper.insert(record);

        // 触发告警引擎计算
        return alertEngineService.evaluateAndSave(userId, dto.getMetricId(), dto.getValue());
    }

    /**
     * 获取指标趋势数据。
     *
     * @param metricId 指标项 ID
     * @param days     天数（7 或 30）
     * @return 记录列表（按时间升序）
     */
    public List<HealthRecord> getTrend(final Long metricId, final int days) {
        final Long userId = SecurityUtils.getCurrentUserId();
        final LocalDateTime startTime = LocalDateTime.now().minusDays(days);
        return healthRecordMapper.findTrendRecords(userId, metricId, startTime);
    }

    /**
     * 构建大类卡片 VO。
     */
    private CategoryVO buildCategoryVO(final HealthCategory category,
                                       final List<HealthMetric> metrics,
                                       final Long userId,
                                       final Map<Long, AlertRecord> alertMap) {
        final CategoryVO vo = new CategoryVO();
        vo.setId(category.getId());
        vo.setName(category.getName());
        vo.setIcon(category.getIcon());
        vo.setColor(category.getColor());
        vo.setSortOrder(category.getSortOrder());

        final List<MetricVO> metricVOs = new ArrayList<>();
        for (final HealthMetric metric : metrics) {
            final MetricVO metricVO = buildMetricVO(metric, userId, alertMap);
            metricVOs.add(metricVO);
        }
        vo.setMetrics(metricVOs);
        return vo;
    }

    /**
     * 构建指标项 VO（含最新值与告警等级）。
     */
    private MetricVO buildMetricVO(final HealthMetric metric, final Long userId,
                                   final Map<Long, AlertRecord> alertMap) {
        final MetricVO vo = new MetricVO();
        vo.setId(metric.getId());
        vo.setCategoryId(metric.getCategoryId());
        vo.setName(metric.getName());
        vo.setUnit(metric.getUnit());
        vo.setNormalRange(buildNormalRangeText(metric));

        // 查询最新记录
        final HealthRecord latestRecord = healthRecordMapper.findLatestRecord(userId, metric.getId());
        if (latestRecord != null) {
            vo.setValue(latestRecord.getValue());
            vo.setRecordedAt(latestRecord.getRecordedAt());
        } else {
            vo.setValue("暂无");
            vo.setAlertLevel(AlertRecord.LEVEL_NORMAL);
        }

        // 从告警记录获取最新告警等级
        final AlertRecord alert = alertMap.get(metric.getId());
        if (alert != null && latestRecord != null) {
            vo.setAlertLevel(alert.getLevel());
        } else {
            vo.setAlertLevel(AlertRecord.LEVEL_NORMAL);
        }

        return vo;
    }

    /**
     * 构建正常范围描述文本。
     */
    private String buildNormalRangeText(final HealthMetric metric) {
        if (metric.getNormalMin() == null && metric.getNormalMax() == null) {
            return "正常";
        }
        if (metric.getNormalMin() != null && metric.getNormalMax() != null) {
            return formatDecimal(metric.getNormalMin()) + "-" + formatDecimal(metric.getNormalMax());
        }
        if (metric.getNormalMin() != null) {
            return ">=" + formatDecimal(metric.getNormalMin());
        }
        return "<=" + formatDecimal(metric.getNormalMax());
    }

    /**
     * 格式化 BigDecimal（去除多余小数位）。
     */
    private String formatDecimal(final BigDecimal value) {
        return value.setScale(1, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }

    /**
     * 根据出生日期计算年龄。
     *
     * @param birthDate 出生日期
     * @return 年龄，出生日期为空返回 0
     */
    private Integer calculateAge(final LocalDate birthDate) {
        if (birthDate == null) {
            return 0;
        }
        return Period.between(birthDate, LocalDate.now()).getYears();
    }
}
