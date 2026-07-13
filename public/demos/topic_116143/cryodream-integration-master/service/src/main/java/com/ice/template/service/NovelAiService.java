package com.ice.template.service;

import com.ice.template.model.dto.novel.NovelAiRequest;
import java.util.List;

public interface NovelAiService {

    /**
     * AI 续写：基于原文尾部与指令，返回续写的一段文本
     */
    String continueWriting(NovelAiRequest request);

    /**
     * AI 润色：返回 N 个候选替换文本
     */
    List<String> polish(NovelAiRequest request);

    /**
     * 人物一致性检查：返回结构化偏差报告的 Markdown 文本
     */
    String consistencyCheck(NovelAiRequest request);

    /**
     * 一句话概要：读章节正文，返回 1-2 句本节概要
     */
    String summarize(NovelAiRequest request);
}
