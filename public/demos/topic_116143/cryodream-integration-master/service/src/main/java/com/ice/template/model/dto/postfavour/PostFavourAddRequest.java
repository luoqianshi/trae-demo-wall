package com.ice.template.model.dto.postfavour;

import java.io.Serializable;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 帖子收藏 / 取消收藏请求
 *
 *
 */
@Data
@ApiModel("帖子收藏/取消收藏请求")
public class PostFavourAddRequest implements Serializable {

    @ApiModelProperty("帖子 id")
    private String postId;

    private static final long serialVersionUID = 1L;
}