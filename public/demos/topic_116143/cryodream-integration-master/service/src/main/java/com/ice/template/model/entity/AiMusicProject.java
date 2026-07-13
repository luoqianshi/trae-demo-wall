package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "ai_music_project")
@Data
public class AiMusicProject implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String title;

    private String description;

    private String style;

    private String mood;

    private String language;

    private String status;

    @TableField("lyric_workflow_id")
    private String lyricWorkflowId;

    @TableField("music_workflow_id")
    private String musicWorkflowId;

    @TableField("current_lyric")
    private String currentLyric;

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
