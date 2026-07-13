package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 模型配置
 */
@TableName(value = "model_config")
@Data
public class ModelConfig implements Serializable {

    /**
     * id
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 配置名称
     */
    private String name;

    /**
     * 模型类型: llm=大语言模型, embedding=嵌入模型
     */
    @TableField("model_type")
    private String modelType;

    /**
     * 厂商标识
     */
    private String provider;

    /**
     * 厂商显示名
     */
    @TableField("provider_name")
    private String providerName;

    /**
     * 模型名称
     */
    @TableField("model_name")
    private String modelName;

    /**
     * 接口地址
     */
    @TableField("base_url")
    private String baseUrl;

    /**
     * API 密钥
     */
    @TableField("api_key")
    private String apiKey;

    /**
     * 温度
     */
    private Double temperature;

    /**
     * 最大令牌数
     */
    @TableField("max_tokens")
    private Integer maxTokens;

    /**
     * 是否启用
     */
    private Integer enabled;

    /**
     * 描述
     */
    private String description;

    /**
     * 创建时间
     */
    @TableField("create_time")
    private Date createTime;

    /**
     * 更新时间
     */
    @TableField("update_time")
    private Date updateTime;

    /**
     * 是否删除
     */
    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
