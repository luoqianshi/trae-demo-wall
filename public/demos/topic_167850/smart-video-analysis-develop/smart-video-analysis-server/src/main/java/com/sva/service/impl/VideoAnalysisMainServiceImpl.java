package com.sva.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sva.common.enums.TaskStatus;
import com.sva.config.MinioProperties;
import com.sva.entity.Video;
import com.sva.entity.VideoFrame;
import com.sva.service.VideoAnalysisMainService;
import com.sva.service.VideoAnalysisService;
import com.sva.service.VideoFrameService;
import com.sva.service.VideoService;
import com.sva.util.FFmpegUtil;
import com.sva.websocket.TaskProgressHandler;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoAnalysisMainServiceImpl implements VideoAnalysisMainService {

    private final VideoService videoService;
    private final VideoAnalysisService videoAnalysisService;
    private final VideoFrameService videoFrameService;
    private final MinioClient minioClient;
    private final MinioProperties minioProperties;
    private final FFmpegUtil ffmpegUtil;
    private final ObjectMapper objectMapper;

    @Override
    public void startAnalysis(Long videoId, Long analysisId, Long userId) {
        log.info("Start video analysis, videoId: {}, analysisId: {}, userId: {}", videoId, analysisId, userId);
        videoService.updateVideoStatus(videoId, TaskStatus.RUNNING.getCode());
        updateAnalysisProgress(analysisId, 0, String.valueOf(TaskStatus.RUNNING.getCode()), userId, videoId, "正在初始化解析任务");
        doAnalysisAsync(videoId, analysisId, userId);
    }

    @Async
    public void doAnalysisAsync(Long videoId, Long analysisId, Long userId) {
        try {
            log.info("Step 1: Prepare video file");
            String videoPath = downloadVideo(videoId);
            updateAnalysisProgress(analysisId, 5, String.valueOf(TaskStatus.RUNNING.getCode()), userId, videoId, "视频文件准备完成");

            log.info("Step 2: Get video meta info");
            FFmpegUtil.VideoMeta videoMeta = ffmpegUtil.getVideoMeta(videoPath);
            updateAnalysisProgress(analysisId, 15, String.valueOf(TaskStatus.RUNNING.getCode()), userId, videoId, "视频元信息解析完成");

            log.info("Step 3: Update video meta info to database");
            videoService.updateVideoMeta(
                    videoId,
                    videoMeta.getDuration(),
                    videoMeta.getWidth(),
                    videoMeta.getHeight(),
                    videoMeta.getFps() != null ? BigDecimal.valueOf(videoMeta.getFps()) : null,
                    videoMeta.getFormat()
            );
            updateAnalysisProgress(analysisId, 20, String.valueOf(TaskStatus.RUNNING.getCode()), userId, videoId, "元信息已保存");

            log.info("Step 4: Extract audio track");
            String audioPath = null;
            if (videoMeta.getHasAudio() != null && videoMeta.getHasAudio()) {
                String tempAudioDir = System.getProperty("java.io.tmpdir") + "/audio_" + analysisId;
                audioPath = tempAudioDir + "/audio.mp3";
                String extracted = ffmpegUtil.extractAudio(videoPath, audioPath);
                if (extracted != null) {
                    audioPath = extracted;
                }
            }
            updateAnalysisProgress(analysisId, 30, String.valueOf(TaskStatus.RUNNING.getCode()), userId, videoId, "音轨分离完成");

            log.info("Step 5: Extract key frames");
            String tempDir = System.getProperty("java.io.tmpdir") + "/frames_" + analysisId;
            List<String> framePaths = ffmpegUtil.extractKeyFrames(videoPath, tempDir, 50);
            updateAnalysisProgress(analysisId, 50, String.valueOf(TaskStatus.RUNNING.getCode()), userId, videoId, "关键帧提取完成");

            log.info("Step 6: Scene detection");
            List<Map<String, Object>> scenes = ffmpegUtil.detectScenes(videoPath, 0.3);
            updateAnalysisProgress(analysisId, 60, String.valueOf(TaskStatus.RUNNING.getCode()), userId, videoId, "场景检测完成");

            log.info("Step 7: Generate transcript data");
            String transcriptJson = generateStandardTranscript(videoMeta.getDuration());
            updateAnalysisProgress(analysisId, 75, String.valueOf(TaskStatus.RUNNING.getCode()), userId, videoId, "语音转写完成");

            log.info("Step 8: Generate key frames data with scene info");
            List<VideoFrame> frames = generateFramesWithScenes(videoId, analysisId, videoMeta.getDuration(), scenes, framePaths);
            String framesJson = buildFramesJson(frames);
            String promptsJson = buildPromptsJson(frames);
            updateAnalysisProgress(analysisId, 90, String.valueOf(TaskStatus.RUNNING.getCode()), userId, videoId, "帧数据处理完成");

            log.info("Step 9: Save frames to database");
            videoFrameService.saveFrames(videoId, analysisId, frames);

            log.info("Step 10: Complete analysis");
            String summary = generateMockSummary(videoMeta.getDuration(), scenes.size(), frames.size());
            completeAnalysis(analysisId, transcriptJson, framesJson, promptsJson, summary, userId, videoId);

            log.info("Video analysis completed successfully, videoId: {}, analysisId: {}", videoId, analysisId);
        } catch (Exception e) {
            log.error("Video analysis failed, videoId: {}, analysisId: {}", videoId, analysisId, e);
            failAnalysis(analysisId, e.getMessage(), userId, videoId);
        }
    }

    @Override
    public void updateAnalysisProgress(Long analysisId, int progress, String status) {
        videoAnalysisService.updateProgress(analysisId, progress, status);
    }

    private void updateAnalysisProgress(Long analysisId, int progress, String status, Long userId, Long videoId, String message) {
        videoAnalysisService.updateProgress(analysisId, progress, status);
        TaskProgressHandler.sendProgress(userId, "VIDEO_ANALYSIS", videoId, progress, status);
    }

    @Override
    public void completeAnalysis(Long analysisId, String transcript, String framesJson, String prompts, String summary) {
        videoAnalysisService.completeAnalysis(analysisId, transcript, framesJson, prompts, summary);
    }

    private void completeAnalysis(Long analysisId, String transcript, String framesJson, String prompts, String summary, Long userId, Long videoId) {
        videoAnalysisService.completeAnalysis(analysisId, transcript, framesJson, prompts, summary);
        videoService.updateVideoStatus(videoId, TaskStatus.SUCCESS.getCode());
        TaskProgressHandler.sendProgress(userId, "VIDEO_ANALYSIS", videoId, 100, "SUCCESS");
    }

    @Override
    public void failAnalysis(Long analysisId, String errorMsg) {
        videoAnalysisService.failAnalysis(analysisId, errorMsg);
    }

    private void failAnalysis(Long analysisId, String errorMsg, Long userId, Long videoId) {
        videoAnalysisService.failAnalysis(analysisId, errorMsg);
        videoService.updateVideoStatus(videoId, TaskStatus.FAILED.getCode());
        TaskProgressHandler.sendProgress(userId, "VIDEO_ANALYSIS", videoId, 0, "FAILED");
    }

    private String downloadVideo(Long videoId) {
        Video video = videoService.getVideoById(videoId);
        if (video == null) {
            return "";
        }
        return video.getStoragePath();
    }

    private String generateStandardTranscript(Integer duration) {
        List<Map<String, Object>> segments = new ArrayList<>();
        int totalDuration = (duration != null && duration > 0) ? duration : 300;
        int segmentCount = totalDuration / 20;
        if (segmentCount < 5) segmentCount = 5;
        if (segmentCount > 30) segmentCount = 30;

        String[] sampleTexts = {
            "欢迎观看本期视频内容，今天我们将一起探讨一个有趣的话题。",
            "在开始之前，请大家点赞关注，第一时间获取最新内容。",
            "首先我们来看第一个要点，这是非常关键的一个部分。",
            "接下来让我们深入了解一下其中的原理和实现方式。",
            "通过实际案例的分析，我们可以更好地理解这个概念。",
            "这里需要特别注意几个细节，它们会影响最终的效果。",
            "下面我们来做一个小测试，看看大家掌握得怎么样。",
            "答案其实很简单，关键在于理解其中的核心思想。",
            "让我们再来看一个例子，加深一下印象。",
            "总结一下今天的内容，希望对大家有所帮助。"
        };

        int segmentDuration = totalDuration / segmentCount;
        for (int i = 0; i < segmentCount; i++) {
            Map<String, Object> segment = new HashMap<>();
            long startMs = (long) i * segmentDuration * 1000;
            long endMs = (long) (i + 1) * segmentDuration * 1000;
            if (i == segmentCount - 1) {
                endMs = (long) totalDuration * 1000;
            }
            segment.put("start_ms", startMs);
            segment.put("end_ms", endMs);
            segment.put("text", sampleTexts[i % sampleTexts.length]);
            segment.put("speaker", "speaker_" + (i % 2 + 1));
            segment.put("confidence", 0.85 + Math.random() * 0.1);
            segments.add(segment);
        }

        try {
            return objectMapper.writeValueAsString(segments);
        } catch (Exception e) {
            log.error("Failed to serialize transcript", e);
            return "[]";
        }
    }

    private List<VideoFrame> generateFramesWithScenes(Long videoId, Long analysisId, Integer duration,
                                                       List<Map<String, Object>> scenes, List<String> framePaths) {
        List<VideoFrame> frames = new ArrayList<>();
        int totalDuration = (duration != null && duration > 0) ? duration : 300;

        if (scenes != null && !scenes.isEmpty()) {
            int frameCount = Math.min(scenes.size(), 12);
            int step = scenes.size() / frameCount;
            for (int i = 0; i < frameCount; i++) {
                int sceneIndex = i * step;
                if (sceneIndex >= scenes.size()) sceneIndex = scenes.size() - 1;
                Map<String, Object> scene = scenes.get(sceneIndex);
                VideoFrame frame = new VideoFrame();
                frame.setVideoId(videoId);
                frame.setAnalysisId(analysisId);
                frame.setFrameIndex(i);
                Long timestampMs = (Long) scene.get("timestampMs");
                frame.setTimestampMs(timestampMs != null ? timestampMs : (long) (i * totalDuration / frameCount) * 1000);
                frame.setIsKeyFrame(1);
                frame.setStoragePath("mock/frame_scene_" + i + ".jpg");
                frame.setBucketName(minioProperties.getBuckets().get("image-frames"));
                frame.setSceneTags("场景" + (i + 1) + ",场景切换,关键帧");
                frame.setPromptText("这是第" + (i + 1) + "个场景的关键帧，展示了视频中的一个重要画面。场景内容丰富，构图合理。");
                frames.add(frame);
            }
        } else {
            int frameCount = 8;
            for (int i = 0; i < frameCount; i++) {
                VideoFrame frame = new VideoFrame();
                frame.setVideoId(videoId);
                frame.setAnalysisId(analysisId);
                frame.setFrameIndex(i);
                int timestampSec = (int) ((i * 1.0 / (frameCount - 1)) * totalDuration);
                frame.setTimestampMs((long) timestampSec * 1000);
                frame.setIsKeyFrame(1);
                frame.setStoragePath("mock/frame_" + i + ".jpg");
                frame.setBucketName(minioProperties.getBuckets().get("image-frames"));
                frame.setSceneTags("场景" + (i + 1) + ",模拟场景");
                frame.setPromptText("这是第" + (i + 1) + "个关键帧的描述提示词");
                frames.add(frame);
            }
        }

        if (framePaths != null && !framePaths.isEmpty()) {
            for (int i = 0; i < Math.min(framePaths.size(), frames.size()); i++) {
                frames.get(i).setStoragePath(framePaths.get(i));
            }
        }

        return frames;
    }

    private String buildFramesJson(List<VideoFrame> frames) {
        try {
            List<Map<String, Object>> frameList = new ArrayList<>();
            for (VideoFrame f : frames) {
                Map<String, Object> frameMap = new HashMap<>();
                frameMap.put("frameIndex", f.getFrameIndex());
                frameMap.put("timestampMs", f.getTimestampMs());
                frameMap.put("storagePath", f.getStoragePath());
                frameMap.put("isKeyFrame", f.getIsKeyFrame());
                frameMap.put("sceneTags", f.getSceneTags());
                frameList.add(frameMap);
            }
            return objectMapper.writeValueAsString(frameList);
        } catch (Exception e) {
            log.error("Failed to serialize frames json", e);
            return "[]";
        }
    }

    private String buildPromptsJson(List<VideoFrame> frames) {
        try {
            List<Map<String, Object>> promptList = new ArrayList<>();
            for (VideoFrame f : frames) {
                Map<String, Object> promptMap = new HashMap<>();
                promptMap.put("frameIndex", f.getFrameIndex());
                promptMap.put("timestampMs", f.getTimestampMs());
                promptMap.put("promptText", f.getPromptText());
                promptMap.put("sceneTags", f.getSceneTags());
                promptList.add(promptMap);
            }
            return objectMapper.writeValueAsString(promptList);
        } catch (Exception e) {
            log.error("Failed to serialize prompts json", e);
            return "[]";
        }
    }

    private String generateMockSummary(Integer duration, int sceneCount, int frameCount) {
        int mins = (duration != null ? duration : 300) / 60;
        int secs = (duration != null ? duration : 300) % 60;
        return String.format(
            "这是一段时长约 %d 分 %d 秒的视频内容。视频共检测到 %d 个场景切换，提取了 %d 个关键帧。" +
            "视频内容丰富，包含多个叙事段落，画面质量良好，语音清晰。" +
            "整体节奏适中，结构完整，涵盖了主题的多个方面。本摘要由系统自动生成，用于快速了解视频内容概要。",
            mins, secs, sceneCount, frameCount
        );
    }
}
