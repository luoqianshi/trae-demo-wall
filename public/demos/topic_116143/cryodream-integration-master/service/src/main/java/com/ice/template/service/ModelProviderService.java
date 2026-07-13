package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.entity.ModelProvider;
import com.ice.template.model.vo.ModelProviderVO;

import java.util.List;

/**
 * 模型厂商服务
 */
public interface ModelProviderService extends IService<ModelProvider> {

    /**
     * 获取所有启用的厂商
     */
    List<ModelProviderVO> listEnabledProviders();

    /**
     * 根据编码获取厂商
     */
    ModelProviderVO getProviderByCode(String code);
}
