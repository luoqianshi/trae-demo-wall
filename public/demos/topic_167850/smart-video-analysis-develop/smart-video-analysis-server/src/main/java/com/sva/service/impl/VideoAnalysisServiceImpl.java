package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sva.common.exception.BusinessException;
import com.sva.entity.VideoAnalysis;
import com.sva.mapper.VideoAnalysisMapper;
import com.sva.service.VideoAnalysisService;
import org.springframework.stereotype.Service;

@Service
public class VideoAnalysisServiceImpl extends ServiceImpl<VideoAnalysisMapper, VideoAnalysis> implements VideoAnalysisService {

    @Override
    public VideoAnalysis startAnalysis(Long videoId) {
        VideoAnalysis analysis = new VideoAnalysis();
        analysis.setVideoId(videoId);
        analysis.setStatus(1);
        analysis.setProgress(0);
        save(analysis);
        return analysis;
    }

    @Override
    public VideoAnalysis getAnalysisByVideoId(Long videoId) {
        return getOne(new LambdaQueryWrapper<VideoAnalysis>()
                .eq(VideoAnalysis::getVideoId, videoId)
                .orderByDesc(VideoAnalysis::getCreateTime)
                .last("LIMIT 1"));
    }

    @Override
    public boolean updateProgress(Long analysisId, Integer progress, String status) {
        VideoAnalysis analysis = getById(analysisId);
        if (analysis == null) {
            throw new BusinessException(404, "解析记录不存在");
        }
        analysis.setProgress(progress);
        if (status != null) {
            try {
                analysis.setStatus(Integer.parseInt(status));
            } catch (NumberFormatException e) {
                // ignore
            }
        }
        return updateById(analysis);
    }

    @Override
    public boolean completeAnalysis(Long analysisId, String transcriptJson, String framesJson, String promptsJson, String summary) {
        VideoAnalysis analysis = getById(analysisId);
        if (analysis == null) {
            throw new BusinessException(404, "解析记录不存在");
        }
        analysis.setTranscriptJson(transcriptJson);
        analysis.setFramesJson(framesJson);
        analysis.setPromptsJson(promptsJson);
        analysis.setSummary(summary);
        analysis.setStatus(2);
        analysis.setProgress(100);
        return updateById(analysis);
    }

    @Override
    public boolean failAnalysis(Long analysisId, String errorMsg) {
        VideoAnalysis analysis = getById(analysisId);
        if (analysis == null) {
            throw new BusinessException(404, "解析记录不存在");
        }
        analysis.setErrorMsg(errorMsg);
        analysis.setStatus(3);
        return updateById(analysis);
    }
}
