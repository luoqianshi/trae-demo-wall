package com.health.module.device.controller;

import com.health.common.Result;
import com.health.module.device.dto.BindDeviceDTO;
import com.health.module.device.dto.DeviceDataDTO;
import com.health.module.device.dto.DeviceVO;
import com.health.module.device.service.DeviceService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 设备对接接口.
 * <p>
 * 提供设备绑定、查询、解绑与数据上报。数据上报接口由 SecurityConfig 放行，
 * 在 Service 内通过 X-Device-Token 进行独立鉴权。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(final DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    /**
     * 绑定设备.
     *
     * @param dto 绑定请求
     * @return 设备ID
     */
    @PostMapping("/bind")
    public Result<Long> bind(@Valid @RequestBody final BindDeviceDTO dto) {
        return Result.success(deviceService.bindDevice(dto));
    }

    /**
     * 查询当前用户的设备列表.
     *
     * @return 设备信息列表
     */
    @GetMapping("/mine")
    public Result<List<DeviceVO>> mine() {
        return Result.success(deviceService.getMyDevices());
    }

    /**
     * 解绑设备.
     *
     * @param id 设备ID
     * @return 操作结果
     */
    @PostMapping("/{id}/unbind")
    public Result<Void> unbind(@PathVariable final Long id) {
        deviceService.unbindDevice(id);
        return Result.success();
    }

    /**
     * 设备数据上报（独立 Token 鉴权，无需用户登录态）.
     *
     * @param id           设备ID
     * @param deviceToken  设备Token（请求头 X-Device-Token）
     * @param dto          数据上报请求
     * @return 告警等级
     */
    @PostMapping("/{id}/data")
    public Result<Map<String, String>> reportData(
            @PathVariable final Long id,
            @RequestHeader("X-Device-Token") final String deviceToken,
            @Valid @RequestBody final DeviceDataDTO dto) {
        final String alertLevel = deviceService.reportDeviceData(id, deviceToken, dto);
        return Result.success(Map.of("alertLevel", alertLevel));
    }
}
