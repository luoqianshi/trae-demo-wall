package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "novel_character")
@Data
public class NovelCharacter implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("novel_id")
    private String novelId;

    private String name;

    private String alias;

    @TableField("avatar_url")
    private String avatarUrl;

    private String identity;

    private String personality;

    private String background;

    private String appearance;

    private String catchphrase;

    private String remark;

    /**
     * 出场章节 ID 列表，逗号分隔
     */
    @TableField("chapter_ids")
    private String chapterIds;

    /**
     * 关系图上的位置，格式 "x,y"
     */
    @TableField("canvas_pos")
    private String canvasPos;

    /**
     * 自定义属性 JSON，格式：[{"key":"HP","value":"100","type":"number"}, ...]
     */
    private String attributes;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    private static final long serialVersionUID = 1L;
}
