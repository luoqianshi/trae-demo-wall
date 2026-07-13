package com.ice.template.model.dto.modelconfig;

import com.ice.template.common.PageRequest;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 模型配置查询请求
 */
@EqualsAndHashCode(callSuper = true)
@Data
@ApiModel("模型配置查询请求")
public class ModelConfigQueryRequest extends PageRequest implements Serializable {

    @ApiModelProperty("配置 id")
    private String id;

    @ApiModelProperty("搜索词")
    private String searchText;

    @ApiModelProperty("配置名称")
    private String name;

    @ApiModelProperty("模型类型: llm=大语言模型, embedding=嵌入模型")
    private String modelType;

    @ApiModelProperty("厂商标识")
    private String provider;

    @ApiModelProperty("模型名称")
    private String modelName;

    @ApiModelProperty("是否启用")
    private Boolean enabled;

    private static final long serialVersionUID = 1L;
}
