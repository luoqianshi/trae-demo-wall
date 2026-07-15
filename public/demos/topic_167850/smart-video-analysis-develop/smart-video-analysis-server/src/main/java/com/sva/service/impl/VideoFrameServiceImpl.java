package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sva.entity.VideoFrame;
import com.sva.mapper.VideoFrameMapper;
import com.sva.service.VideoFrameService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VideoFrameServiceImpl extends ServiceImpl<VideoFrameMapper, VideoFrame> implements VideoFrameService {

    @Override
    public boolean saveFrames(Long videoId, Long analysisId, List<VideoFrame> frames) {
        if (frames == null || frames.isEmpty()) {
            return false;
        }
        for (VideoFrame frame : frames) {
            frame.setVideoId(videoId);
            frame.setAnalysisId(analysisId);
        }
        return saveBatch(frames);
    }

    @Override
    public List<VideoFrame> getFramesByVideoId(Long videoId) {
        return list(new LambdaQueryWrapper<VideoFrame>()
                .eq(VideoFrame::getVideoId, videoId)
                .orderByAsc(VideoFrame::getFrameIndex));
    }

    @Override
    public List<VideoFrame> getKeyFrames(Long videoId) {
        return list(new LambdaQueryWrapper<VideoFrame>()
                .eq(VideoFrame::getVideoId, videoId)
                .eq(VideoFrame::getIsKeyFrame, 1)
                .orderByAsc(VideoFrame::getTimestampMs));
    }
}
