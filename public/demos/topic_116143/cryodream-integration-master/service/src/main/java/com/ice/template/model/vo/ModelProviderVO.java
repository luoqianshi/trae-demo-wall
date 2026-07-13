package com.ice.template.model.vo;

import lombok.Data;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

/**
 * 模型厂商视图
 */
@Data
public class ModelProviderVO implements Serializable {

    private String id;

    /**
     * 厂商编码
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
     * 状态
     */
    private Integer status;

    private Date createTime;

    private Date updateTime;
}
