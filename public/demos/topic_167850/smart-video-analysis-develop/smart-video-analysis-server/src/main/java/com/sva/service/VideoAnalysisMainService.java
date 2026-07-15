package com.sva.service;

public interface VideoAnalysisMainService {

    void startAnalysis(Long videoId, Long analysisId, Long userId);

    void updateAnalysisProgress(Long analysisId, int progress, String status);

    void completeAnalysis(Long analysisId, String transcript, String framesJson, String prompts, String summary);

    void failAnalysis(Long analysisId, String errorMsg);
}
