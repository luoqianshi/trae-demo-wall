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
 * 人物属性快照：记录人物在某个时间点的属性状态
 */
@TableName(value = "novel_character_snapshot")
@Data
public class NovelCharacterSnapshot implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("novel_id")
    private String novelId;

    @TableField("character_id")
    private String characterId;

    /**
     * 关联的时间线事件（可空 = 初始状态）
     */
    @TableField("event_id")
    private String eventId;

    private String label;

    /**
     * 快照属性 JSON，与 NovelCharacter.attributes 同结构
     */
    private String attributes;

    private String note;

    @TableField("sort_order")
    private Integer sortOrder;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    private static final long serialVersionUID = 1L;
}
