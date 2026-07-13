package com.health.module.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.user.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 系统用户 Mapper 接口.
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {

    /**
     * 根据手机号查询未删除的用户.
     * <p>
     * 手机号唯一，业务上最多返回一条记录，加 LIMIT 1 确保单条返回。
     * </p>
     *
     * @param phone 手机号
     * @return 用户实体，不存在返回 null
     */
    @Select("SELECT * FROM sys_user WHERE phone = #{phone} AND deleted = 0 LIMIT 1")
    SysUser findByPhone(@Param("phone") String phone);
}
