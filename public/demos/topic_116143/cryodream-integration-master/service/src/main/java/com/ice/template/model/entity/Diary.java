package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "diary")
@Data
public class Diary implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("user_id")
    private String userId;

    private String title;

    private String content;

    private String summary;

    @TableField("short_summary")
    private String shortSummary;

    private String category;

    private String mood;

    @TableField("mood_score")
    private Integer moodScore;

    @TableField("audio_url")
    private String audioUrl;

    @TableField("audio_duration_sec")
    private Integer audioDurationSec;

    @TableField("word_count")
    private Integer wordCount;

    @TableField("ai_analysis_status")
    private String aiAnalysisStatus;

    @TableField("ai_raw_response")
    private String aiRawResponse;

    @TableField("diary_date")
    private Date diaryDate;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    private static final long serialVersionUID = 1L;
}
