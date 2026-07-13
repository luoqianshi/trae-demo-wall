package com.ice.template.model.dto.postfavour;

import com.ice.template.common.PageRequest;
import com.ice.template.model.dto.post.PostQueryRequest;
import java.io.Serializable;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 帖子收藏查询请求
 *
 *
 */
@Data
@EqualsAndHashCode(callSuper = true)
@ApiModel("帖子收藏查询请求")
public class PostFavourQueryRequest extends PageRequest implements Serializable {

    @ApiModelProperty("帖子查询请求")
    private PostQueryRequest postQueryRequest;

    @ApiModelProperty("用户 id")
    private String userId;

    private static final long serialVersionUID = 1L;
}