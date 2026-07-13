package com.ice.template.model.dto.novel;

import java.io.Serializable;
import java.util.List;
import lombok.Data;

/**
 * AI 辅助请求：续写 / 润色 / 一致性检查通用请求
 */
@Data
public class NovelAiRequest implements Serializable {

    /**
     * 操作类型：continue（续写）| polish（润色）| consistency（一致性检查）
     */
    private String action;

    /**
     * 模型配置 ID
     */
    private String modelConfigId;

    /**
     * 上下文原文
     */
    private String text;

    /**
     * 用户额外指令（续写风格 / 润色方向）
     */
    private String instruction;

    /**
     * 关联小说 ID（一致性检查时用于拉取人物卡）
     */
    private String novelId;

    /**
     * 一致性检查时的人物 ID 过滤（可选）
     */
    private List<String> characterIds;

    /**
     * 生成候选数量（润色时使用）
     */
    private Integer candidateCount;

    private static final long serialVersionUID = 1L;
}
