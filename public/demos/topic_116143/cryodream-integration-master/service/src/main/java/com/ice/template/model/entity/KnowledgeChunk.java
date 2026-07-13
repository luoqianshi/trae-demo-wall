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
 * 文本碎片（Chunk）表
 * 全息元数据背包：每个Chunk携带领域范围、本体路由、认识论标签
 */
@TableName(value = "knowledge_chunk", autoResultMap = true)
@Data
public class KnowledgeChunk implements Serializable {

    /**
     * id
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 所属文档ID
     */
    @TableField("doc_id")
    private String docId;

    /**
     * 所属知识库ID
     */
    @TableField("kb_id")
    private String kbId;

    /**
     * Chunk序号（0-based）
     */
    @TableField("chunk_index")
    private Integer chunkIndex;

    /**
     * 父块ID（父子块策略）：子块指向其所属父块；父块该字段为空
     */
    @TableField("parent_id")
    private String parentId;

    /**
     * 块层级：parent（父块，结构化摘要向量化）/ child（子块，原文向量化）
     */
    @TableField("chunk_level")
    private String chunkLevel;

    /**
     * 父块拥有的子块ID列表（RAPTOR：父摘要索引 → 指向子块）
     */
    @TableField(value = "child_ids", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String childIds;

    /**
     * Chunk内容（用于全文搜索等）
     */
    @TableField("content")
    private String content;

    /**
     * Chunk文本（可能已添加上下文标签）
     */
    @TableField("chunk_text")
    private String chunkText;

    /**
     * 原始文本快照（不可篡改）
     */
    @TableField("raw_text")
    private String rawText;

    @TableField(value = "metadata", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String metadata;

    @TableField(value = "events", typeHandler = com.ice.template.config.JsonbTypeHandler.class)
    private String events;

    /**
     * 向量嵌入（pgvector格式：[0.1, 0.2, ...]）
     */
    @TableField(value = "embedding", typeHandler = com.ice.template.config.VectorTypeHandler.class)
    private String embedding;

    /**
     * 创建时间
     */
    @TableField("create_time")
    private Date createTime;

    /**
     * 是否删除
     */
    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
