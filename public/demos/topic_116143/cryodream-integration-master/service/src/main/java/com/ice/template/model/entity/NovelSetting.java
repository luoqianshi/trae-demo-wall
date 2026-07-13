package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 世界观设定条目，category: location/organization/item/faction/custom
 */
@TableName(value = "novel_setting")
@Data
public class NovelSetting implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("novel_id")
    private String novelId;

    private String category;

    private String name;

    private String brief;

    private String content;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    private static final long serialVersionUID = 1L;
}
