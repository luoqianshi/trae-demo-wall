package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.mapper.SystemSettingMapper;
import com.ice.template.model.entity.SystemSetting;
import com.ice.template.service.SystemSettingService;
import java.util.Date;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class SystemSettingServiceImpl extends ServiceImpl<SystemSettingMapper, SystemSetting> implements SystemSettingService {

    @Override
    public String getValue(String key) {
        if (StringUtils.isBlank(key)) {
            return null;
        }
        SystemSetting setting = getOne(new QueryWrapper<SystemSetting>()
                .eq("setting_key", key)
                .eq("is_delete", 0)
                .last("LIMIT 1"));
        return setting == null ? null : setting.getSettingValue();
    }

    @Override
    public void setValue(String key, String value, String description) {
        if (StringUtils.isBlank(key)) {
            return;
        }
        SystemSetting setting = getOne(new QueryWrapper<SystemSetting>()
                .eq("setting_key", key)
                .last("LIMIT 1"));
        if (setting == null) {
            setting = new SystemSetting();
            setting.setSettingKey(key);
            setting.setSettingValue(value);
            setting.setDescription(description);
            setting.setIsDelete(0);
            setting.setCreateTime(new Date());
            setting.setUpdateTime(new Date());
            save(setting);
            return;
        }
        setting.setSettingValue(value);
        setting.setDescription(description);
        setting.setIsDelete(0);
        setting.setUpdateTime(new Date());
        updateById(setting);
    }
}
