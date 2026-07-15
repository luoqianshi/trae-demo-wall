package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sva.common.exception.BusinessException;
import com.sva.entity.AiServiceConfig;
import com.sva.mapper.AiServiceConfigMapper;
import com.sva.service.AiServiceConfigService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiServiceConfigServiceImpl extends ServiceImpl<AiServiceConfigMapper, AiServiceConfig> implements AiServiceConfigService {

    @Override
    public List<AiServiceConfig> listByUser(Long userId) {
        return list(new LambdaQueryWrapper<AiServiceConfig>()
                .eq(AiServiceConfig::getUserId, userId)
                .orderByDesc(AiServiceConfig::getCreateTime));
    }

    @Override
    public AiServiceConfig getByUserAndType(Long userId, String serviceType) {
        return getOne(new LambdaQueryWrapper<AiServiceConfig>()
                .eq(AiServiceConfig::getUserId, userId)
                .eq(AiServiceConfig::getServiceType, serviceType)
                .last("LIMIT 1"));
    }

    @Override
    public AiServiceConfig saveOrUpdateConfig(Long userId, AiServiceConfig config) {
        config.setUserId(userId);
        if (config.getServiceType() == null || config.getEndpoint() == null) {
            throw new BusinessException(400, "服务类型和端点不能为空");
        }
        AiServiceConfig existing = getByUserAndType(userId, config.getServiceType());
        if (existing != null) {
            existing.setEndpoint(config.getEndpoint());
            existing.setApiKey(config.getApiKey());
            if (config.getEnabled() != null) existing.setEnabled(config.getEnabled());
            if (config.getIsDefault() != null) existing.setIsDefault(config.getIsDefault());
            updateById(existing);
            return existing;
        }
        if (config.getEnabled() == null) config.setEnabled(1);
        if (config.getIsDefault() == null) config.setIsDefault(0);
        save(config);
        return config;
    }

    @Override
    public boolean deleteConfig(Long id, Long userId) {
        AiServiceConfig config = getById(id);
        if (config == null || !config.getUserId().equals(userId)) {
            throw new BusinessException(404, "配置不存在");
        }
        return removeById(id);
    }
}
