package com.sva.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sva.entity.AiServiceConfig;

import java.util.List;

public interface AiServiceConfigService extends IService<AiServiceConfig> {

    List<AiServiceConfig> listByUser(Long userId);

    AiServiceConfig getByUserAndType(Long userId, String serviceType);

    AiServiceConfig saveOrUpdateConfig(Long userId, AiServiceConfig config);

    boolean deleteConfig(Long id, Long userId);
}
