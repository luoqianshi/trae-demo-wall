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
 * 大纲/章节节点，level: 1=卷, 2=章, 3=节
 * 只有 level=3 的节点承载正文 content
 */
@TableName(value = "novel_outline")
@Data
public class NovelOutline implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("novel_id")
    private String novelId;

    @TableField("parent_id")
    private String parentId;

    private Integer level;

    private String title;

    private String summary;

    private String content;

    @TableField("sort_order")
    private Integer sortOrder;

    @TableField("word_count")
    private Integer wordCount;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    private static final long serialVersionUID = 1L;
}
