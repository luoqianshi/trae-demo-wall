package com.health.module.device.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.device.entity.Device;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 设备 Mapper 接口.
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface DeviceMapper extends BaseMapper<Device> {

    /**
     * 根据 Token 查询启用的设备.
     * <p>
     * Token 全局唯一，业务上最多返回一条记录，加 LIMIT 1 确保单条返回。
     * 仅查询 ACTIVE 状态设备，用于绑定校验与数据上报鉴权。
     * </p>
     *
     * @param token 设备鉴权Token
     * @return 启用状态的设备，不存在返回 null
     */
    @Select("SELECT * FROM device WHERE token = #{token} AND status = 'ACTIVE' LIMIT 1")
    Device findByToken(@Param("token") String token);

    /**
     * 查询用户绑定的所有启用设备，限制最多 100 条.
     *
     * @param userId 用户ID
     * @return 设备列表（按绑定时间倒序）
     */
    @Select("SELECT * FROM device WHERE user_id = #{userId} AND status = 'ACTIVE' "
            + "ORDER BY bound_at DESC LIMIT 100")
    List<Device> findByUserId(@Param("userId") Long userId);
}
