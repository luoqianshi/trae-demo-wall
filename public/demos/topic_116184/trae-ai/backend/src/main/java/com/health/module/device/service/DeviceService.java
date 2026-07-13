package com.health.module.device.service;

import com.health.common.BusinessException;
import com.health.common.ResultCode;
import com.health.module.device.dto.BindDeviceDTO;
import com.health.module.device.dto.DeviceDataDTO;
import com.health.module.device.dto.DeviceVO;
import com.health.module.device.entity.Device;
import com.health.module.device.mapper.DeviceMapper;
import com.health.module.health.entity.HealthMetric;
import com.health.module.health.entity.HealthRecord;
import com.health.module.health.mapper.HealthMetricMapper;
import com.health.module.health.mapper.HealthRecordMapper;
import com.health.module.health.service.AlertEngineService;
import com.health.security.SecurityUtils;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 设备服务.
 * <p>
 * 提供设备绑定、查询、解绑与数据上报功能。设备数据上报采用独立 Token 鉴权，
 * 不依赖用户登录态（SecurityConfig 已放行设备数据上报路径）。
 * 当前用户身份统一从 SecurityContext 获取，严禁前端传入。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Service
public class DeviceService {

    /** 日志对象必须为 private static final */
    private static final Logger logger = LoggerFactory.getLogger(DeviceService.class);

    private final DeviceMapper deviceMapper;

    private final HealthRecordMapper healthRecordMapper;

    private final HealthMetricMapper healthMetricMapper;

    private final AlertEngineService alertEngineService;

    public DeviceService(final DeviceMapper deviceMapper,
                         final HealthRecordMapper healthRecordMapper,
                         final HealthMetricMapper healthMetricMapper,
                         final AlertEngineService alertEngineService) {
        this.deviceMapper = deviceMapper;
        this.healthRecordMapper = healthRecordMapper;
        this.healthMetricMapper = healthMetricMapper;
        this.alertEngineService = alertEngineService;
    }

    /**
     * 绑定设备.
     * <p>
     * 校验 Token 未被活跃设备占用，若存在同 Token 的非活跃设备则复用记录重新绑定。
     * </p>
     *
     * @param dto 绑定请求
     * @return 设备ID
     */
    public Long bindDevice(final BindDeviceDTO dto) {
        final Long userId = SecurityUtils.getCurrentUserId();

        // 校验 Token 是否已被活跃设备绑定
        final Device activeDevice = deviceMapper.findByToken(dto.getToken());
        if (activeDevice != null) {
            throw new BusinessException(ResultCode.DEVICE_ALREADY_BOUND);
        }

        // 检查是否存在同 Token 的非活跃设备（Token 唯一约束），有则复用更新
        final Device existing = deviceMapper.selectOne(
                new LambdaQueryWrapper<Device>().eq(Device::getToken, dto.getToken()));
        if (existing != null) {
            // 非活跃设备重新绑定给当前用户
            existing.setUserId(userId);
            existing.setDeviceType(dto.getDeviceType());
            existing.setModel(dto.getModel());
            existing.setStatus(Device.STATUS_ACTIVE);
            existing.setBoundAt(LocalDateTime.now());
            deviceMapper.updateById(existing);
            logger.info("设备重新绑定成功: userId={}, deviceId={}", userId, existing.getId());
            return existing.getId();
        }

        final Device device = new Device();
        device.setUserId(userId);
        device.setDeviceType(dto.getDeviceType());
        device.setModel(dto.getModel());
        device.setToken(dto.getToken());
        device.setStatus(Device.STATUS_ACTIVE);
        device.setBoundAt(LocalDateTime.now());
        deviceMapper.insert(device);

        logger.info("设备绑定成功: userId={}, deviceId={}", userId, device.getId());
        return device.getId();
    }

    /**
     * 查询当前用户的设备列表.
     *
     * @return 设备信息列表（不含 Token）
     */
    public List<DeviceVO> getMyDevices() {
        final Long userId = SecurityUtils.getCurrentUserId();
        final List<Device> devices = deviceMapper.findByUserId(userId);

        final List<DeviceVO> voList = new ArrayList<>();
        for (final Device device : devices) {
            // 显式赋值，禁止反射拷贝
            final DeviceVO vo = new DeviceVO();
            vo.setId(device.getId());
            vo.setDeviceType(device.getDeviceType());
            vo.setModel(device.getModel());
            vo.setStatus(device.getStatus());
            vo.setBoundAt(device.getBoundAt());
            vo.setLastSyncAt(device.getLastSyncAt());
            voList.add(vo);
        }
        return voList;
    }

    /**
     * 解绑设备.
     * <p>
     * 校验设备归属后将状态置为 INACTIVE，不删除记录。
     * </p>
     *
     * @param deviceId 设备ID
     */
    public void unbindDevice(final Long deviceId) {
        final Long userId = SecurityUtils.getCurrentUserId();

        final Device device = deviceMapper.selectById(deviceId);
        if (device == null) {
            throw new BusinessException(ResultCode.DEVICE_NOT_FOUND);
        }
        // 校验归属：仅设备所有者可解绑
        if (!userId.equals(device.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN, "无权解绑他人设备");
        }

        device.setStatus(Device.STATUS_INACTIVE);
        deviceMapper.updateById(device);

        logger.info("设备解绑成功: userId={}, deviceId={}", userId, deviceId);
    }

    /**
     * 设备数据上报.
     * <p>
     * 独立设备 Token 鉴权：不依赖用户登录态，通过请求头 X-Device-Token 与设备记录的 Token 比对。
     * 校验通过后写入 health_record（来源 DEVICE），触发告警引擎，更新最近同步时间。
     * </p>
     *
     * @param deviceId     设备ID（路径参数）
     * @param deviceToken  设备Token（请求头 X-Device-Token）
     * @param dto          数据上报请求
     * @return 告警等级
     */
    public String reportDeviceData(final Long deviceId, final String deviceToken, final DeviceDataDTO dto) {
        final Device device = deviceMapper.selectById(deviceId);
        if (device == null || !Device.STATUS_ACTIVE.equals(device.getStatus())) {
            throw new BusinessException(ResultCode.DEVICE_NOT_FOUND);
        }

        // 独立设备 Token 鉴权：校验请求头 Token 与设备记录 Token 一致
        if (device.getToken() == null || !device.getToken().equals(deviceToken)) {
            throw new BusinessException(ResultCode.DEVICE_TOKEN_ERROR);
        }

        // 校验指标项存在
        final HealthMetric metric = healthMetricMapper.selectById(dto.getMetricId());
        if (metric == null) {
            throw new BusinessException(ResultCode.METRIC_NOT_FOUND);
        }

        // 写入健康记录，来源标记为 DEVICE
        final HealthRecord record = new HealthRecord();
        record.setUserId(device.getUserId());
        record.setMetricId(dto.getMetricId());
        record.setValue(dto.getValue());
        record.setUnit(metric.getUnit());
        record.setSource(HealthRecord.SOURCE_DEVICE);
        record.setDeviceId(device.getId());
        record.setRecordedAt(dto.getRecordedAt() == null ? LocalDateTime.now() : dto.getRecordedAt());
        healthRecordMapper.insert(record);

        // 触发告警引擎计算等级
        final String alertLevel = alertEngineService.evaluateAndSave(
                device.getUserId(), dto.getMetricId(), dto.getValue());

        // 更新设备最近同步时间
        device.setLastSyncAt(LocalDateTime.now());
        deviceMapper.updateById(device);

        logger.info("设备数据上报成功: deviceId={}, userId={}, metricId={}, alertLevel={}",
                deviceId, device.getUserId(), dto.getMetricId(), alertLevel);
        return alertLevel;
    }
}
