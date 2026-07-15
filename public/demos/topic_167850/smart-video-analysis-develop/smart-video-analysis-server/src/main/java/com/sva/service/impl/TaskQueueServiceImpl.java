package com.sva.service.impl;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import com.sva.entity.VideoFrame;
import com.sva.service.TaskQueueService;
import com.sva.service.VideoAnalysisService;
import com.sva.service.VideoFrameService;
import com.sva.service.VideoService;
import com.sva.task.VideoAnalysisTask;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskQueueServiceImpl implements TaskQueueService {

    private final VideoService videoService;
    private final VideoAnalysisService videoAnalysisService;
    private final VideoFrameService videoFrameService;

    @Override
    @Async("taskExecutor")
    public void submitVideoAnalysisTask(Long videoId, Long analysisId, Long userId) {
        VideoAnalysisTask task = VideoAnalysisTask.builder()
                .videoId(videoId)
                .analysisId(analysisId)
                .userId(userId)
                .build();
        processVideoAnalysisTask(task);
    }

    @Override
    public void processVideoAnalysisTask(VideoAnalysisTask task) {
        Long analysisId = task.getAnalysisId();
        Long videoId = task.getVideoId();

        try {
            log.info("开始处理视频解析任务, videoId: {}, analysisId: {}", videoId, analysisId);

            videoAnalysisService.updateProgress(analysisId, 0, "1");

            for (int progress = 10; progress <= 100; progress += 10) {
                Thread.sleep(500);
                videoAnalysisService.updateProgress(analysisId, progress, "1");
                log.info("视频解析进度: videoId={}, progress={}%", videoId, progress);
            }

            String transcriptJson = generateMockTranscript();
            String framesJson = generateMockFrames();
            String promptsJson = generateMockPrompts();
            String summary = generateMockSummary();

            List<VideoFrame> videoFrames = generateMockVideoFrames(videoId, analysisId);
            videoFrameService.saveFrames(videoId, analysisId, videoFrames);

            videoAnalysisService.completeAnalysis(analysisId, transcriptJson, framesJson, promptsJson, summary);

            log.info("视频解析任务完成, videoId: {}, analysisId: {}", videoId, analysisId);

        } catch (Exception e) {
            log.error("视频解析任务失败, videoId: {}, analysisId: {}", videoId, analysisId, e);
            videoAnalysisService.failAnalysis(analysisId, e.getMessage());
        }
    }

    private String generateMockTranscript() {
        JSONArray segments = new JSONArray();
        for (int i = 0; i < 5; i++) {
            JSONObject segment = new JSONObject();
            segment.set("index", i);
            segment.set("start", i * 10.0);
            segment.set("end", (i + 1) * 10.0);
            segment.set("text", "这是第 " + (i + 1) + " 段转写文本内容");
            segments.add(segment);
        }
        return segments.toString();
    }

    private String generateMockFrames() {
        JSONArray frames = new JSONArray();
        for (int i = 0; i < 10; i++) {
            JSONObject frame = new JSONObject();
            frame.set("frameIndex", i);
            frame.set("timestampMs", i * 5000L);
            frame.set("isKeyFrame", i % 2 == 0);
            frames.add(frame);
        }
        return frames.toString();
    }

    private String generateMockPrompts() {
        JSONArray prompts = new JSONArray();
        for (int i = 0; i < 3; i++) {
            JSONObject prompt = new JSONObject();
            prompt.set("index", i);
            prompt.set("text", "这是第 " + (i + 1) + " 个提示词");
            prompt.set("type", "scene");
            prompts.add(prompt);
        }
        return prompts.toString();
    }

    private String generateMockSummary() {
        return "这是视频内容的摘要，包含了视频的主要内容和关键信息。";
    }

    private List<VideoFrame> generateMockVideoFrames(Long videoId, Long analysisId) {
        List<VideoFrame> frames = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            VideoFrame frame = new VideoFrame();
            frame.setVideoId(videoId);
            frame.setAnalysisId(analysisId);
            frame.setFrameIndex(i);
            frame.setTimestampMs(i * 5000L);
            frame.setIsKeyFrame(i % 2 == 0 ? 1 : 0);
            frame.setSceneTags("[\"场景" + (i + 1) + "\",\"标签" + (i + 1) + "\"]");
            frames.add(frame);
        }
        return frames;
    }
}
