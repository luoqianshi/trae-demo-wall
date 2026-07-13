package com.ice.template.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.modelconfig.ModelConfigQueryRequest;
import com.ice.template.model.dto.modelconfig.ModelConfigTestRequest;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.model.vo.ModelConfigVO;
import java.util.List;

/**
 * 模型配置服务
 */
public interface ModelConfigService extends IService<ModelConfig> {

    /**
     * 校验模型配置
     */
    void validModelConfig(ModelConfig modelConfig, boolean add);

    /**
     * 获取查询条件
     */
    QueryWrapper<ModelConfig> getQueryWrapper(ModelConfigQueryRequest modelConfigQueryRequest);

    /**
     * 获取模型配置视图
     */
    ModelConfigVO getModelConfigVO(ModelConfig modelConfig);

    /**
     * 获取模型配置视图列表
     */
    List<ModelConfigVO> getModelConfigVOList(List<ModelConfig> modelConfigList);

    /**
     * 测试模型配置
     */
    String testModelConfig(ModelConfigTestRequest testRequest);

    /**
     * 根据模型类型获取启用的模型配置
     * @param modelType llm 或 embedding
     */
    List<ModelConfigVO> listEnabledByType(String modelType);

    /**
     * 从远程 API 拉取可用模型列表
     */
    List<String> fetchRemoteModels(String baseUrl, String apiKey);
}
