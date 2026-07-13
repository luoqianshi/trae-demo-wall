package com.ice.template.model.vo;

import java.io.Serializable;
import java.util.Date;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 用户视图（脱敏）
 *
 *
 */
@Data
@ApiModel("用户视图（脱敏）")
public class UserVO implements Serializable {

    @ApiModelProperty("用户 id")
    private String id;

    @ApiModelProperty("用户昵称")
    private String userName;

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

    @ApiModelProperty("用户角色：user/admin/ban")
    private String userRole;

    @ApiModelProperty("创建时间")
    private Date createTime;

    private static final long serialVersionUID = 1L;
}