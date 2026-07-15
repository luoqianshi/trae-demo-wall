package com.sva.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_ai_service_config")
public class AiServiceConfig {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long userId;

    private String serviceType;

    private String endpoint;

    private String apiKey;

    private Integer enabled;

    private Integer isDefault;

    @TableLogic
    private Integer isDeleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
