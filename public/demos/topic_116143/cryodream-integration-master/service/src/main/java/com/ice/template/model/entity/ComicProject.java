package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 漫画项目：一个漫画作品，持久化画布数据、尺寸、缩略图等。
 */
@TableName(value = "comic_project")
@Data
public class ComicProject implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    @TableField("name")
    private String name;

    @TableField("description")
    private String description;

    @TableField("canvas_width")
    private Integer canvasWidth;

    @TableField("canvas_height")
    private Integer canvasHeight;

    /** 漫画画布序列化 JSON（pages + 角色 + 气泡等） */
    @TableField("comic_data")
    private String comicData;

    @TableField("thumbnail_url")
    private String thumbnailUrl;

    @TableField("source_comfyui_project_id")
    private String sourceComfyuiProjectId;

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
