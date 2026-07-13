package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "novel")
@Data
public class Novel implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String title;

    private String summary;

    @TableField("cover_url")
    private String coverUrl;

    private String genre;

    private String tags;

    @TableField("word_count")
    private Integer wordCount;

    private String status;

    @TableField("create_time")
    private Date createTime;

    @TableField("update_time")
    private Date updateTime;

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    private static final long serialVersionUID = 1L;
}
