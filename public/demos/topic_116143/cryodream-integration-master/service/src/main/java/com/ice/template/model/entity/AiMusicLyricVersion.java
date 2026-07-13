package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "ai_music_lyric_version")
@Data
public class AiMusicLyricVersion implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("project_id")
    private String projectId;

    private String name;

    private String title;

    private String color;

    private String summary;

    private String content;

    @TableField("version_no")
    private String versionNo;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
