package com.ice.template.model.vo;

import com.ice.template.model.entity.ModelConfig;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

/**
 * 模型配置视图
 */
@Data
public class ModelConfigVO implements Serializable {

    private String id;

    private String name;

    private String modelType;

    private String provider;

    private String providerName;

    private String modelName;

    private String baseUrl;

    private String apiKey;

    private Double temperature;

    private Integer maxTokens;

    private Boolean enabled;

    private String description;

    private Date createTime;

    private Date updateTime;

    public static ModelConfigVO objToVo(ModelConfig modelConfig) {
        if (modelConfig == null) {
            return null;
        }
        ModelConfigVO modelConfigVO = new ModelConfigVO();
        BeanUtils.copyProperties(modelConfig, modelConfigVO);
        modelConfigVO.setEnabled(modelConfig.getEnabled() != null && modelConfig.getEnabled() == 1);
        return modelConfigVO;
    }

    private static final long serialVersionUID = 1L;
}
