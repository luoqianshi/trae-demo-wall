package com.ice.template.model.dto.user;

import java.io.Serializable;
import java.util.Date;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 用户创建请求
 *
 *
 */
@Data
@ApiModel("用户创建请求")
public class UserAddRequest implements Serializable {

    @ApiModelProperty("用户昵称")
    private String userName;

    @ApiModelProperty("用户账号")
    private String userAccount;

    @ApiModelProperty("用户头像")
    private String userAvatar;

    @ApiModelProperty("用户简介")
    private String userProfile;

    @ApiModelProperty("手机号")
    private String userPhone;

    @ApiModelProperty("邮箱")
    private String userEmail;

    @ApiModelProperty("出生日期")
    private Date userBirthday;

    @ApiModelProperty("用户角色：user/admin")
    private String userRole;

    private static final long serialVersionUID = 1L;
}