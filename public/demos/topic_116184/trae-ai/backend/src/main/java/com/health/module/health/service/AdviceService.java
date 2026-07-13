package com.health.module.health.service;

import com.health.common.BusinessException;
import com.health.common.ResultCode;
import com.health.module.health.dto.AdviceVO;
import com.health.module.health.entity.AdviceTemplate;
import com.health.module.health.entity.AlertRecord;
import com.health.module.health.entity.HealthRecord;
import com.health.module.health.mapper.AdviceTemplateMapper;
import com.health.module.health.mapper.AlertRecordMapper;
import com.health.module.health.mapper.HealthRecordMapper;
import com.health.security.SecurityUtils;
import org.springframework.stereotype.Service;

/**
 * 健康建议服务。
 * <p>
 * 根据指标项与当前告警等级匹配建议模板，无匹配时返回通用建议。
 * </p>
 */
@Service
public class AdviceService {

    private final AdviceTemplateMapper adviceTemplateMapper;

    private final HealthRecordMapper healthRecordMapper;

    private final AlertRecordMapper alertRecordMapper;

    public AdviceService(final AdviceTemplateMapper adviceTemplateMapper,
                         final HealthRecordMapper healthRecordMapper,
                         final AlertRecordMapper alertRecordMapper) {
        this.adviceTemplateMapper = adviceTemplateMapper;
        this.healthRecordMapper = healthRecordMapper;
        this.alertRecordMapper = alertRecordMapper;
    }

    /**
     * 根据指标项 ID 获取健康建议。
     * <p>
     * 先查询该指标最新告警等级，再按等级匹配建议模板。
     * 无匹配时返回通用建议。
     * </p>
     *
     * @param metricId 指标项 ID
     * @return 健康建议 VO
     */
    public AdviceVO getAdvice(final Long metricId) {
        final Long userId = SecurityUtils.getCurrentUserId();

        // 查询该指标最新告警等级
        final String alertLevel = getLatestAlertLevel(userId, metricId);

        // 按指标与等级匹配建议
        final AdviceTemplate template = adviceTemplateMapper.findByMetricAndLevel(metricId, alertLevel);
        if (template != null) {
            return buildAdviceVO(template);
        }

        // 无匹配，返回通用建议
        final AdviceTemplate generalAdvice = adviceTemplateMapper.findGeneralAdvice(alertLevel);
        if (generalAdvice != null) {
            return buildAdviceVO(generalAdvice);
        }

        // 兜底：返回默认提示
        return buildDefaultAdvice();
    }

    /**
     * 获取用户某指标最新告警等级。
     *
     * @param userId   用户 ID
     * @param metricId 指标项 ID
     * @return 告警等级，无记录返回 NORMAL
     */
    private String getLatestAlertLevel(final Long userId, final Long metricId) {
        final HealthRecord latestRecord = healthRecordMapper.findLatestRecord(userId, metricId);
        if (latestRecord == null) {
            return AlertRecord.LEVEL_NORMAL;
        }

        // 查询最新告警记录
        final java.util.List<AlertRecord> latestAlerts = alertRecordMapper.findLatestAlerts(userId);
        for (final AlertRecord alert : latestAlerts) {
            if (metricId.equals(alert.getMetricId())) {
                return alert.getLevel();
            }
        }
        return AlertRecord.LEVEL_NORMAL;
    }

    /**
     * 构建建议 VO。
     */
    private AdviceVO buildAdviceVO(final AdviceTemplate template) {
        final AdviceVO vo = new AdviceVO();
        vo.setId(template.getId());
        vo.setTitle(template.getTitle());
        vo.setContent(template.getContent());
        vo.setLevel(template.getLevel());
        return vo;
    }

    /**
     * 构建兜底默认建议。
     */
    private AdviceVO buildDefaultAdvice() {
        final AdviceVO vo = new AdviceVO();
        vo.setTitle("健康改善建议");
        vo.setContent("<h3>📋 综合健康建议</h3>" +
                "<div class=\"tip\">基于您的检查结果，建议关注异常指标并保持健康生活方式。</div>" +
                "<h3>🌟 生活方式优化</h3>" +
                "<ul>" +
                "<li>保持规律的作息时间，确保充足睡眠</li>" +
                "<li>坚持适量运动，每周至少150分钟</li>" +
                "<li>保持健康的饮食习惯，营养均衡</li>" +
                "<li>学会管理压力，保持心理健康</li>" +
                "</ul>");
        vo.setLevel(AlertRecord.LEVEL_WARNING);
        return vo;
    }
}
