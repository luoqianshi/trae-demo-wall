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
 * 时间线事件：记录剧情进度
 */
@TableName(value = "novel_timeline_event")
@Data
public class NovelTimelineEvent implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("novel_id")
    private String novelId;

    private String title;

    private String description;

    /**
     * 时间标签（自定义，如 "T1"、"三年后"、"2026-07-08"）
     */
    @TableField("time_label")
    private String timeLabel;

    @TableField("sort_order")
    private Integer sortOrder;

    /**
     * 关联章节节点 ID（大纲 level=3）
     */
    @TableField("chapter_id")
    private String chapterId;

    /**
     * 关联人物 ID 列表，逗号分隔
     */
    @TableField("character_ids")
    private String characterIds;

    /**
     * 事件重要程度 1-5
     */
    private Integer importance;

    /**
     * 事件颜色（可选，用于视觉分组）
     */
    private String color;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    private static final long serialVersionUID = 1L;
}
