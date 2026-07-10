package com.health.module.health.service;

import com.health.common.BusinessException;
import com.health.common.ResultCode;
import com.health.module.health.entity.AlertRecord;
import com.health.module.health.entity.HealthMetric;
import com.health.module.health.entity.HealthRecord;
import com.health.module.health.mapper.AlertRecordMapper;
import com.health.module.health.mapper.HealthMetricMapper;
import com.health.module.health.mapper.HealthRecordMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * 告警规则引擎。
 * <p>
 * 核心职责：接收指标数据，基于阈值配置计算告警等级，并持久化告警记录。
 * 支持单次阈值告警与连续异常升级（连续 3 次超标升级一级）。
 * </p>
 */
@Service
public class AlertEngineService {

    /** 日志对象必须为 private static final */
    private static final Logger logger = LoggerFactory.getLogger(AlertEngineService.class);

    /** 连续异常升级的阈值次数 */
    private static final int CONSECUTIVE_ANOMALY_THRESHOLD = 3;

    /** 用于连续异常检测的最近记录查询条数 */
    private static final int RECENT_RECORD_LIMIT = 5;

    private final HealthMetricMapper healthMetricMapper;

    private final HealthRecordMapper healthRecordMapper;

    private final AlertRecordMapper alertRecordMapper;

    public AlertEngineService(final HealthMetricMapper healthMetricMapper,
                              final HealthRecordMapper healthRecordMapper,
                              final AlertRecordMapper alertRecordMapper) {
        this.healthMetricMapper = healthMetricMapper;
        this.healthRecordMapper = healthRecordMapper;
        this.alertRecordMapper = alertRecordMapper;
    }

    /**
     * 计算并持久化告警等级。
     *
     * @param userId   用户 ID
     * @param metricId 指标项 ID
     * @param value    指标值
     * @return 告警等级（NORMAL / WARNING / DANGER）
     */
    public String evaluateAndSave(final Long userId, final Long metricId, final String value) {
        final HealthMetric metric = healthMetricMapper.selectById(metricId);
        if (metric == null) {
            throw new BusinessException(ResultCode.METRIC_NOT_FOUND);
        }

        // 计算告警等级
        String level = calculateLevel(metric, value);

        // 连续异常检测：若连续多次超标，升级告警等级
        level = applyConsecutiveAnomalyRule(userId, metricId, level);

        // 持久化告警记录
        saveAlertRecord(userId, metricId, value, level);

        logger.info("告警计算完成: userId={}, metricId={}, value={}, level={}", userId, metricId, value, level);
        return level;
    }

    /**
     * 基于阈值配置计算告警等级。
     * <p>
     * 优先判断危险，其次预警，最后正常。
     * 文本型指标（无阈值配置）默认正常。
     * </p>
     *
     * @param metric 指标配置
     * @param value  指标值
     * @return 告警等级
     */
    private String calculateLevel(final HealthMetric metric, final String value) {
        // 文本型指标无数值阈值，默认正常
        if (metric.getNormalMin() == null && metric.getNormalMax() == null) {
            return AlertRecord.LEVEL_NORMAL;
        }

        final BigDecimal numericValue = parseNumericValue(value);
        if (numericValue == null) {
            // 无法解析为数值，默认正常
            return AlertRecord.LEVEL_NORMAL;
        }

        // 优先判断危险：值在危险区间（低于危险下限或高于危险上限）
        if (isInDangerRange(metric, numericValue)) {
            return AlertRecord.LEVEL_DANGER;
        }

        // 其次判断预警：值在预警区间
        if (isInWarningRange(metric, numericValue)) {
            return AlertRecord.LEVEL_WARNING;
        }

        return AlertRecord.LEVEL_NORMAL;
    }

    /**
     * 判断值是否在危险区间。
     * <p>
     * 危险区间：低于 dangerMin 或高于 dangerMax。
     * </p>
     */
    private boolean isInDangerRange(final HealthMetric metric, final BigDecimal value) {
        if (metric.getDangerMin() != null && value.compareTo(metric.getDangerMin()) < 0) {
            return true;
        }
        return metric.getDangerMax() != null && value.compareTo(metric.getDangerMax()) > 0;
    }

    /**
     * 判断值是否在预警区间。
     * <p>
     * 预警区间：低于 warningMin（且不低于 dangerMin）或高于 warningMax（且不高于 dangerMax），
     * 或在 normal 范围之外但未达危险。
     * 简化逻辑：不在正常范围内即为预警。
     * </p>
     */
    private boolean isInWarningRange(final HealthMetric metric, final BigDecimal value) {
        // 低于正常下限
        if (metric.getNormalMin() != null && value.compareTo(metric.getNormalMin()) < 0) {
            return true;
        }
        // 高于正常上限
        return metric.getNormalMax() != null && value.compareTo(metric.getNormalMax()) > 0;
    }

    /**
     * 连续异常升级规则。
     * <p>
     * 若最近连续 N 条记录均为异常（预警或危险），则将当前等级提升一级
     * （NORMAL→不变，WARNING→DANGER，DANGER→不变）。
     * </p>
     *
     * @param userId      用户 ID
     * @param metricId    指标项 ID
     * @param currentLevel 当前计算出的告警等级
     * @return 升级后的告警等级
     */
    private String applyConsecutiveAnomalyRule(final Long userId, final Long metricId, final String currentLevel) {
        // 正常等级不升级
        if (AlertRecord.LEVEL_NORMAL.equals(currentLevel)) {
            return currentLevel;
        }

        // 查询最近几条记录的值，重新计算等级判断是否连续异常
        final List<HealthRecord> recentRecords = healthRecordMapper.findRecentRecords(userId, metricId, RECENT_RECORD_LIMIT);
        if (recentRecords.size() < CONSECUTIVE_ANOMALY_THRESHOLD) {
            return currentLevel;
        }

        final HealthMetric metric = healthMetricMapper.selectById(metricId);
        if (metric == null) {
            return currentLevel;
        }

        // 检查最近（不含当前）的记录是否连续异常
        int consecutiveAnomalyCount = 0;
        // 从最新（索引0）开始遍历，跳过当前刚入库的第一条
        for (int i = 1; i < recentRecords.size(); i++) {
            final HealthRecord record = recentRecords.get(i);
            final String level = calculateLevel(metric, record.getValue());
            if (AlertRecord.LEVEL_NORMAL.equals(level)) {
                // 遇到正常记录，中断连续计数
                break;
            }
            consecutiveAnomalyCount++;
        }

        // 连续异常次数达到阈值，且当前为预警，升级为危险
        if (consecutiveAnomalyCount >= CONSECUTIVE_ANOMALY_THRESHOLD - 1
                && AlertRecord.LEVEL_WARNING.equals(currentLevel)) {
            logger.info("连续异常升级: userId={}, metricId={}, 连续{}次异常，预警升级为危险",
                    userId, metricId, consecutiveAnomalyCount + 1);
            return AlertRecord.LEVEL_DANGER;
        }

        return currentLevel;
    }

    /**
     * 持久化告警记录。
     */
    private void saveAlertRecord(final Long userId, final Long metricId, final String value, final String level) {
        final AlertRecord alertRecord = new AlertRecord();
        alertRecord.setUserId(userId);
        alertRecord.setMetricId(metricId);
        alertRecord.setLevel(level);
        alertRecord.setValue(value);
        alertRecord.setStatus(AlertRecord.STATUS_NEW);
        alertRecordMapper.insert(alertRecord);
    }

    /**
     * 将字符串值解析为 BigDecimal。
     * <p>
     * 使用 BigDecimal.valueOf 配合 Double.parseDouble 解析，
     * 解析失败返回 null（视为非数值型指标）。此处 parseDouble 可能抛 NumberFormatException，
     * 属预期内异常（文本型指标值如"正常"无法解析为数值），捕获后返回 null。
     * </p>
     *
     * @param value 字符串值
     * @return BigDecimal 值，无法解析返回 null
     */
    private BigDecimal parseNumericValue(final String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            // 预期内异常：文本型指标值无法解析为数值，返回 null 表示非数值型
            return BigDecimal.valueOf(Double.parseDouble(value.trim()));
        } catch (final NumberFormatException e) {
            logger.debug("指标值无法解析为数值（预期内，文本型指标）: value={}", value);
            return null;
        }
    }
}
