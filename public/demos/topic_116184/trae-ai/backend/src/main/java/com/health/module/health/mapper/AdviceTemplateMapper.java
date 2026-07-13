package com.health.module.health.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.health.entity.AdviceTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 健康建议模板 Mapper。
 */
@Mapper
public interface AdviceTemplateMapper extends BaseMapper<AdviceTemplate> {

    /**
     * 按指标 ID 与告警等级查询启用的建议模板。
     * <p>
     * 仅取一条（每个指标每个等级通常一条建议），使用 LIMIT 1 限制结果集。
     * </p>
     *
     * @param metricId 指标项 ID
     * @param level    告警等级
     * @return 建议模板，无则返回 null
     */
    @Select("SELECT * FROM advice_template " +
            "WHERE metric_id = #{metricId} AND level = #{level} AND enabled = 1 " +
            "ORDER BY version DESC LIMIT 1")
    AdviceTemplate findByMetricAndLevel(@Param("metricId") Long metricId, @Param("level") String level);

    /**
     * 查询通用建议模板（metric_id 为 NULL）。
     * <p>
     * 仅取一条，作为无匹配时的兜底建议。
     * </p>
     *
     * @param level 告警等级
     * @return 通用建议模板，无则返回 null
     */
    @Select("SELECT * FROM advice_template " +
            "WHERE metric_id IS NULL AND level = #{level} AND enabled = 1 " +
            "ORDER BY version DESC LIMIT 1")
    AdviceTemplate findGeneralAdvice(@Param("level") String level);
}
