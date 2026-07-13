package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.entity.SystemSetting;

public interface SystemSettingService extends IService<SystemSetting> {

    String DOUYIN_COOKIE_KEY = "douyin.cookie";

    String getValue(String key);

    void setValue(String key, String value, String description);
}
