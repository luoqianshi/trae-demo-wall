package com.ice.template.model.dto.user;

import com.ice.template.common.PageRequest;
import java.io.Serializable;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 用户查询请求
 *
 *
 */
@EqualsAndHashCode(callSuper = true)
@Data
@ApiModel("用户查询请求")
public class UserQueryRequest extends PageRequest implements Serializable {
    @ApiModelProperty("用户 id")
    private String id;

    @ApiModelProperty("开放平台 id")
    private String unionId;

    @ApiModelProperty("公众号 openId")
    private String mpOpenId;

    @ApiModelProperty("用户昵称")
    private String userName;

    @ApiModelProperty("用户简介")
    private String userProfile;

    @ApiModelProperty("用户角色：user/admin/ban")
    private String userRole;

    private static final long serialVersionUID = 1L;
}