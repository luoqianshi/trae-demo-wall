package com.ice.template.model.dto.modelconfig;

import lombok.Data;

import java.io.Serializable;

/**
 * 模型配置测试请求
 */
@Data
public class ModelConfigTestRequest implements Serializable {

    /**
     * 厂商编码
     */
    private String providerCode;

    /**
     * 接口地址
     */
    private String baseUrl;

    /**
     * API 密钥
     */
    private String apiKey;

    /**
     * 模型名称
     */
    private String model;
}
