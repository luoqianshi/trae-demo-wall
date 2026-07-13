package com.ice.template.model.vo;

import cn.hutool.json.JSONUtil;
import com.ice.template.model.entity.Post;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.io.Serializable;
import java.util.Date;
import java.util.List;
import lombok.Data;
import org.springframework.beans.BeanUtils;

/**
 * 帖子视图
 *
 *
 */
@Data
@ApiModel("帖子视图")
public class PostVO implements Serializable {

    @ApiModelProperty("帖子 id")
    private String id;

    @ApiModelProperty("标题")
    private String title;

    @ApiModelProperty("内容")
    private String content;

    @ApiModelProperty("点赞数")
    private Integer thumbNum;

    @ApiModelProperty("收藏数")
    private Integer favourNum;

    @ApiModelProperty("创建用户 id")
    private String userId;

    @ApiModelProperty("创建时间")
    private Date createTime;

    @ApiModelProperty("更新时间")
    private Date updateTime;

    @ApiModelProperty("标签列表")
    private List<String> tagList;

    @ApiModelProperty("创建人信息")
    private UserVO user;

    @ApiModelProperty("是否已点赞")
    private Boolean hasThumb;

    @ApiModelProperty("是否已收藏")
    private Boolean hasFavour;

    /**
     * 包装类转对象
     *
     * @param postVO
     * @return
     */
    public static Post voToObj(PostVO postVO) {
        if (postVO == null) {
            return null;
        }
        Post post = new Post();
        BeanUtils.copyProperties(postVO, post);
        List<String> tagList = postVO.getTagList();
        post.setTags(JSONUtil.toJsonStr(tagList));
        return post;
    }

    /**
     * 对象转包装类
     *
     * @param post
     * @return
     */
    public static PostVO objToVo(Post post) {
        if (post == null) {
            return null;
        }
        PostVO postVO = new PostVO();
        BeanUtils.copyProperties(post, postVO);
        postVO.setTagList(JSONUtil.toList(post.getTags(), String.class));
        return postVO;
    }
}
