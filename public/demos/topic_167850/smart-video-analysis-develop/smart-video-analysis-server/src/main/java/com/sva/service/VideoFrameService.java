package com.sva.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sva.entity.VideoFrame;

import java.util.List;

public interface VideoFrameService extends IService<VideoFrame> {

    boolean saveFrames(Long videoId, Long analysisId, List<VideoFrame> frames);

    List<VideoFrame> getFramesByVideoId(Long videoId);

    List<VideoFrame> getKeyFrames(Long videoId);
}
