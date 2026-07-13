package com.ice.template.model.dto.modelprovider;

import com.ice.template.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

/**
 * 模型厂商查询请求
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class ModelProviderQueryRequest extends PageRequest implements Serializable {

    /**
     * 厂商名称
     */
    private String name;

    /**
     * 厂商编码
     */
    private String code;

    /**
     * 状态（0-禁用，1-启用）
     */
    private Integer status;
}
