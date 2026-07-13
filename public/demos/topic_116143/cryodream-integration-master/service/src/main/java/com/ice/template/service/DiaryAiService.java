package com.ice.template.service;

import com.ice.template.model.vo.DiaryVO;

public interface DiaryAiService {

    /**
     * 对日记做 AI 分析：分类 / 情绪 / 摘要 / 标签
     * @param diaryId 日记 ID
     * @param modelConfigId 模型配置 ID
     */
    void analyze(String diaryId, String modelConfigId);

    /** 获取 AI 分析结果 */
    DiaryVO getAnalysisResult(String diaryId);
}
