package com.ice.template.model.dto.modelconfig;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.io.Serializable;
import lombok.Data;

/**
 * 模型配置创建请求
 */
@Data
@ApiModel("模型配置创建请求")
public class ModelConfigAddRequest implements Serializable {

    @ApiModelProperty("配置名称")
    private String name;

    @ApiModelProperty("模型类型: llm=大语言模型, embedding=嵌入模型")
    private String modelType;

    @ApiModelProperty("厂商标识")
    private String provider;

    @ApiModelProperty("厂商显示名")
    private String providerName;

    @ApiModelProperty("模型名称")
    private String modelName;

    @ApiModelProperty("接口地址")
    private String baseUrl;

    @ApiModelProperty("API 密钥")
    private String apiKey;

    @ApiModelProperty("温度")
    private Double temperature;

    @ApiModelProperty("最大令牌数")
    private Integer maxTokens;

    @ApiModelProperty("是否启用")
    private Boolean enabled;

    @ApiModelProperty("描述")
    private String description;

    private static final long serialVersionUID = 1L;
}
