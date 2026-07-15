package com.sva.service;

import com.sva.task.VideoAnalysisTask;

public interface TaskQueueService {

    void submitVideoAnalysisTask(Long videoId, Long analysisId, Long userId);

    void processVideoAnalysisTask(VideoAnalysisTask task);
}
