package com.ice.template.model.dto.post;

import com.ice.template.common.PageRequest;
import java.io.Serializable;
import java.util.List;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 查询请求
 *
 *
 */
@EqualsAndHashCode(callSuper = true)
@Data
@ApiModel("帖子查询请求")
public class PostQueryRequest extends PageRequest implements Serializable {

    @ApiModelProperty("帖子 id")
    private String id;

    @ApiModelProperty("排除的帖子 id")
    private String notId;

    @ApiModelProperty("搜索词")
    private String searchText;

    @ApiModelProperty("标题")
    private String title;

    @ApiModelProperty("内容")
    private String content;

    @ApiModelProperty("标签列表")
    private List<String> tags;

    @ApiModelProperty("至少有一个标签")
    private List<String> orTags;

    @ApiModelProperty("创建用户 id")
    private String userId;

    @ApiModelProperty("收藏用户 id")
    private String favourUserId;

    private static final long serialVersionUID = 1L;
}