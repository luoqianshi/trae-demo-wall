package com.health.module.health.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.health.entity.HealthCategory;
import org.apache.ibatis.annotations.Mapper;

/**
 * 健康指标大类 Mapper。
 */
@Mapper
public interface HealthCategoryMapper extends BaseMapper<HealthCategory> {
}
