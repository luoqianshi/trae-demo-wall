package com.sva.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sva.entity.VideoAnalysis;

public interface VideoAnalysisService extends IService<VideoAnalysis> {

    VideoAnalysis startAnalysis(Long videoId);

    VideoAnalysis getAnalysisByVideoId(Long videoId);

    boolean updateProgress(Long analysisId, Integer progress, String status);

    boolean completeAnalysis(Long analysisId, String transcriptJson, String framesJson, String promptsJson, String summary);

    boolean failAnalysis(Long analysisId, String errorMsg);
}
