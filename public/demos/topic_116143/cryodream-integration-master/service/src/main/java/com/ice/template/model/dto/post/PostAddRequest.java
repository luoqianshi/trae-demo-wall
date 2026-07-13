package com.ice.template.model.dto.post;

import java.io.Serializable;
import java.util.List;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 创建请求
 *
 *
 */
@Data
@ApiModel("帖子创建请求")
public class PostAddRequest implements Serializable {

    @ApiModelProperty("标题")
    private String title;

    @ApiModelProperty("内容")
    private String content;

    @ApiModelProperty("标签列表")
    private List<String> tags;

    private static final long serialVersionUID = 1L;
}