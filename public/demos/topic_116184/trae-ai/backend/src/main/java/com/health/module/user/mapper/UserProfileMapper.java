package com.health.module.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.user.entity.UserProfile;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户健康档案 Mapper 接口.
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface UserProfileMapper extends BaseMapper<UserProfile> {
}
