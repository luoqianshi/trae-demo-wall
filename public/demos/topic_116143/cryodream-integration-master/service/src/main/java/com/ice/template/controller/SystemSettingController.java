package com.ice.template.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.systemsetting.DouyinCookieUpdateRequest;
import com.ice.template.model.entity.SystemSetting;
import com.ice.template.model.vo.DouyinCookieSettingVO;
import com.ice.template.rag.douyin.DouyinCookieNormalizer;
import com.ice.template.service.SystemSettingService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/systemSetting")
@Api(tags = "系统设置接口")
public class SystemSettingController {

    @Resource
    private SystemSettingService systemSettingService;

    @Resource
    private DouyinCookieNormalizer douyinCookieNormalizer;

    @GetMapping("/douyin/cookie")
    @ApiOperation("获取抖音 Cookie 设置状态")
    public BaseResponse<DouyinCookieSettingVO> getDouyinCookieSetting() {
        SystemSetting setting = systemSettingService.getOne(new QueryWrapper<SystemSetting>()
                .eq("setting_key", SystemSettingService.DOUYIN_COOKIE_KEY)
                .eq("is_delete", 0)
                .last("LIMIT 1"));
        String value = setting == null ? null : setting.getSettingValue();
        DouyinCookieSettingVO vo = DouyinCookieSettingVO.builder()
                .configured(StringUtils.isNotBlank(value))
                .maskedCookie(douyinCookieNormalizer.mask(value))
                .cookieCount(douyinCookieNormalizer.countCookies(value))
                .updateTime(setting == null ? null : setting.getUpdateTime())
                .build();
        return ResultUtils.success(vo);
    }

    @PostMapping("/douyin/cookie")
    @ApiOperation("更新抖音 Cookie 设置")
    public BaseResponse<DouyinCookieSettingVO> updateDouyinCookieSetting(@RequestBody DouyinCookieUpdateRequest request) {
        ThrowUtils.throwIf(request == null || StringUtils.isBlank(request.getCookie()), ErrorCode.PARAMS_ERROR, "Cookie 不能为空");
        String normalized = douyinCookieNormalizer.normalize(request.getCookie());
        ThrowUtils.throwIf(StringUtils.isBlank(normalized), ErrorCode.PARAMS_ERROR, "未识别到有效 Cookie");
        systemSettingService.setValue(SystemSettingService.DOUYIN_COOKIE_KEY, normalized, "抖音网页端 Cookie，用于抖音链接解析");
        return getDouyinCookieSetting();
    }
}
