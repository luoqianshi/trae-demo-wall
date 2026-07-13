package com.ice.template.model.dto.modelprovider;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 模型厂商更新请求
 */
@Data
public class ModelProviderUpdateRequest implements Serializable {

    /**
     * id
     */
    private String id;

    /**
     * 厂商编码（唯一标识）
     */
    private String code;

    /**
     * 厂商名称
     */
    private String name;

    /**
     * 默认接口地址
     */
    private String defaultBaseUrl;

    /**
     * 支持模型列表
     */
    private List<String> models;

    /**
     * API 文档地址
     */
    private String docUrl;

    /**
     * 图标
     */
    private String icon;

    /**
     * 排序
     */
    private Integer sortOrder;

    /**
     * 状态（0-禁用，1-启用）
     */
    private Integer status;
}
