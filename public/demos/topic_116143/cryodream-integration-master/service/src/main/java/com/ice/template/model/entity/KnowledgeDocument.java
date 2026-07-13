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
 * 文档表
 */
@TableName(value = "knowledge_document")
@Data
public class KnowledgeDocument implements Serializable {

    /**
     * id
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 所属知识库ID
     */
    @TableField("kb_id")
    private String kbId;

    /**
     * 文档标题
     */
    private String title;

    /**
     * 文件类型（txt/md/pdf）
     */
    @TableField("file_type")
    private String fileType;

    /**
     * 文件存储路径
     */
    @TableField("file_path")
    private String filePath;

    /**
     * 文件大小（字节）
     */
    @TableField("file_size")
    private Long fileSize;

    /**
     * 解析后的原始文本
     */
    @TableField("raw_text")
    private String rawText;

    /**
     * 全局元数据（Domain/Theme/Entities/Concepts）
     */
    @TableField(value = "global_metadata", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String globalMetadata;

    /**
     * 处理状态（pending/parsed/processing/completed/failed）
     */
    private String status;

    /**
     * 入库模式（auto/standard/deep）
     */
    @TableField("ingestion_mode")
    private String ingestionMode;

    /**
     * 实际入库模式（standard/deep）
     */
    @TableField("resolved_ingestion_mode")
    private String resolvedIngestionMode;

    /**
     * 生成的Chunk数量
     */
    @TableField("chunk_count")
    private Integer chunkCount;

    /**
     * 错误信息
     */
    @TableField("error_message")
    private String errorMessage;

    /**
     * 创建时间
     */
    @TableField("create_time")
    private Date createTime;

    /**
     * 更新时间
     */
    @TableField("update_time")
    private Date updateTime;

    /**
     * 是否删除
     */
    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
