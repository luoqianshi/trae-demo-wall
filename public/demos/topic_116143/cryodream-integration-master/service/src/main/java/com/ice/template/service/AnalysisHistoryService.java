package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.entity.AnalysisHistory;
import com.ice.template.rag.generation.AnalysisResponse;

import java.util.List;

public interface AnalysisHistoryService extends IService<AnalysisHistory> {

    /**
     * 保存一次研判结果到历史记录。
     */
    AnalysisHistory saveHistory(String kbId, AnalysisResponse response);

    /**
     * 按知识库查询历史记录（按时间倒序）。kbId 为空时查全部。
     */
    List<AnalysisHistory> listHistory(String kbId, int limit);
}
