package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "ai_music_audio")
@Data
public class AiMusicAudio implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("project_id")
    private String projectId;

    @TableField("audio_url")
    private String audioUrl;

    private String title;

    @TableField("duration_seconds")
    private Integer durationSeconds;

    @TableField("style_tags")
    private String styleTags;

    @TableField("lyrics_summary")
    private String lyricsSummary;

    @TableField("param_snapshot")
    private String paramSnapshot;

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
