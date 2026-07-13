package com.health.module.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.user.entity.DoctorInfo;
import org.apache.ibatis.annotations.Mapper;

/**
 * 医生信息 Mapper 接口.
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface DoctorInfoMapper extends BaseMapper<DoctorInfo> {
}
