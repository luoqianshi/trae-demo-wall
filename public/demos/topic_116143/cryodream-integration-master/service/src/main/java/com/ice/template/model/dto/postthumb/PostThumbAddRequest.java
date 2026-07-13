package com.ice.template.model.dto.postthumb;

import java.io.Serializable;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 帖子点赞请求
 *
 *
 */
@Data
@ApiModel("帖子点赞请求")
public class PostThumbAddRequest implements Serializable {

    @ApiModelProperty("帖子 id")
    private String postId;

    private static final long serialVersionUID = 1L;
}