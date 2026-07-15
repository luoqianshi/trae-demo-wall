package com.sva.controller;

import com.sva.common.result.R;
import com.sva.entity.Video;
import com.sva.entity.VideoAnalysis;
import com.sva.entity.VideoFrame;
import com.sva.service.VideoAnalysisService;
import com.sva.service.VideoFrameService;
import com.sva.service.VideoService;
import com.sva.vo.AnalysisResultVO;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.http.Method;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

@Tag(name = "导出管理")
@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class ExportController {

    private final VideoService videoService;
    private final VideoAnalysisService videoAnalysisService;
    private final VideoFrameService videoFrameService;
    private final MinioClient minioClient;
    private final ObjectMapper objectMapper;

    @Operation(summary = "获取解析结果详情")
    @GetMapping("/{id}/analysis-detail")
    public R<AnalysisResultVO> getAnalysisDetail(@PathVariable Long id,
                                                 @RequestAttribute("userId") Long userId) {
        Video video = videoService.getVideoById(id);
        if (video == null || !video.getUserId().equals(userId)) {
            return R.fail(404, "视频不存在");
        }

        AnalysisResultVO vo = new AnalysisResultVO();
        vo.setVideo(video);

        try {
            String videoUrl = minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .bucket(video.getBucketName())
                    .object(video.getStoragePath())
                    .method(Method.GET)
                    .expiry(24, TimeUnit.HOURS)
                    .build());
            vo.setVideoUrl(videoUrl);
        } catch (Exception e) {
            vo.setVideoUrl("");
        }

        VideoAnalysis analysis = videoAnalysisService.getAnalysisByVideoId(id);
        vo.setAnalysis(analysis);

        List<VideoFrame> frames = videoFrameService.getKeyFrames(id);
        if (frames != null) {
            for (VideoFrame frame : frames) {
                try {
                    String frameUrl = minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                            .bucket(frame.getBucketName())
                            .object(frame.getStoragePath())
                            .method(Method.GET)
                            .expiry(24, TimeUnit.HOURS)
                            .build());
                    frame.setStoragePath(frameUrl);
                } catch (Exception e) {
                    // ignore
                }
            }
        }
        vo.setFrames(frames);

        if (analysis != null && analysis.getTranscriptJson() != null) {
            try {
                List<Map<String, Object>> transcriptData = objectMapper.readValue(
                        analysis.getTranscriptJson(),
                        new TypeReference<List<Map<String, Object>>>() {}
                );
                List<AnalysisResultVO.TranscriptItem> transcriptList = new ArrayList<>();
                for (Map<String, Object> item : transcriptData) {
                    AnalysisResultVO.TranscriptItem transcriptItem = new AnalysisResultVO.TranscriptItem();
                    transcriptItem.setText((String) item.getOrDefault("text", ""));
                    Object startMs = item.get("start_ms");
                    Object endMs = item.get("end_ms");
                    if (startMs != null) {
                        transcriptItem.setTimestampMs(((Number) startMs).longValue());
                        transcriptItem.setStartTime(formatTime(((Number) startMs).longValue()));
                    }
                    if (endMs != null) {
                        transcriptItem.setEndTime(formatTime(((Number) endMs).longValue()));
                    }
                    if (transcriptItem.getStartTime() == null) {
                        transcriptItem.setStartTime("00:00");
                    }
                    transcriptList.add(transcriptItem);
                }
                vo.setTranscriptList(transcriptList);
            } catch (Exception e) {
                // ignore JSON parse error
            }
        }

        return R.ok(vo);
    }

    @Operation(summary = "导出转写文案")
    @GetMapping("/{id}/export/transcript")
    public ResponseEntity<byte[]> exportTranscript(@PathVariable Long id,
                                                    @RequestParam(defaultValue = "txt") String format,
                                                    @RequestAttribute("userId") Long userId) {
        Video video = videoService.getVideoById(id);
        if (video == null || !video.getUserId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }

        VideoAnalysis analysis = videoAnalysisService.getAnalysisByVideoId(id);
        if (analysis == null || analysis.getTranscriptJson() == null) {
            return ResponseEntity.notFound().build();
        }

        String content = "";
        String filename = video.getFilename().replaceAll("\\.[^.]+$", "");
        String contentType = MediaType.TEXT_PLAIN_VALUE;

        try {
            List<Map<String, Object>> transcriptData = objectMapper.readValue(
                    analysis.getTranscriptJson(),
                    new TypeReference<List<Map<String, Object>>>() {}
            );

            switch (format.toLowerCase()) {
                case "srt":
                    content = generateSrt(transcriptData);
                    filename += ".srt";
                    contentType = "application/x-subrip";
                    break;
                case "json":
                    content = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(transcriptData);
                    filename += ".json";
                    contentType = MediaType.APPLICATION_JSON_VALUE;
                    break;
                case "txt":
                default:
                    content = generateTxt(transcriptData);
                    filename += ".txt";
                    break;
            }
        } catch (Exception e) {
            content = "导出失败: " + e.getMessage();
            filename += ".txt";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
        headers.setContentDispositionFormData("attachment", encodedFilename);

        return ResponseEntity.ok()
                .headers(headers)
                .body(content.getBytes(StandardCharsets.UTF_8));
    }

    @Operation(summary = "导出画面提示词")
    @GetMapping("/{id}/export/prompts")
    public ResponseEntity<byte[]> exportPrompts(@PathVariable Long id,
                                                 @RequestAttribute("userId") Long userId) {
        Video video = videoService.getVideoById(id);
        if (video == null || !video.getUserId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }

        VideoAnalysis analysis = videoAnalysisService.getAnalysisByVideoId(id);
        List<VideoFrame> frames = videoFrameService.getKeyFrames(id);

        StringBuilder content = new StringBuilder();
        content.append("# 画面提示词导出\n\n");
        content.append("视频: ").append(video.getFilename()).append("\n\n");
        content.append("---\n\n");

        if (frames != null) {
            int index = 1;
            for (VideoFrame frame : frames) {
                content.append("## 帧 ").append(index++).append("\n\n");
                content.append("- **时间点**: ").append(formatTime(frame.getTimestampMs())).append("\n");
                if (frame.getSceneTags() != null && !frame.getSceneTags().isEmpty()) {
                    content.append("- **场景标签**: ").append(frame.getSceneTags()).append("\n");
                }
                if (frame.getPromptText() != null && !frame.getPromptText().isEmpty()) {
                    content.append("- **提示词**: ").append(frame.getPromptText()).append("\n");
                }
                content.append("\n");
            }
        }

        if (analysis != null && analysis.getPromptsJson() != null) {
            content.append("\n---\n\n");
            content.append("## 整体提示词\n\n");
            try {
                Object prompts = objectMapper.readValue(analysis.getPromptsJson(), Object.class);
                content.append(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(prompts));
            } catch (Exception e) {
                content.append(analysis.getPromptsJson());
            }
        }

        String filename = video.getFilename().replaceAll("\\.[^.]+$", "") + "_prompts.md";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_MARKDOWN);
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
        headers.setContentDispositionFormData("attachment", encodedFilename);

        return ResponseEntity.ok()
                .headers(headers)
                .body(content.toString().getBytes(StandardCharsets.UTF_8));
    }

    private String generateTxt(List<Map<String, Object>> transcript) {
        StringBuilder sb = new StringBuilder();
        for (Map<String, Object> item : transcript) {
            Object startMs = item.get("start_ms");
            String text = (String) item.getOrDefault("text", "");
            if (startMs != null) {
                sb.append("[").append(formatTime(((Number) startMs).longValue())).append("] ");
            }
            sb.append(text).append("\n");
        }
        return sb.toString();
    }

    private String generateSrt(List<Map<String, Object>> transcript) {
        StringBuilder sb = new StringBuilder();
        int index = 1;
        for (Map<String, Object> item : transcript) {
            Object startMs = item.get("start_ms");
            Object endMs = item.get("end_ms");
            String text = (String) item.getOrDefault("text", "");

            sb.append(index++).append("\n");
            sb.append(formatSrtTime(startMs != null ? ((Number) startMs).longValue() : 0L))
                    .append(" --> ")
                    .append(formatSrtTime(endMs != null ? ((Number) endMs).longValue() : 0L))
                    .append("\n");
            sb.append(text).append("\n\n");
        }
        return sb.toString();
    }

    private String formatTime(Long timestampMs) {
        if (timestampMs == null) {
            return "00:00";
        }
        long totalSeconds = timestampMs / 1000;
        long minutes = totalSeconds / 60;
        long seconds = totalSeconds % 60;
        return String.format("%02d:%02d", minutes, seconds);
    }

    private String formatSrtTime(Long timestampMs) {
        long totalMs = timestampMs;
        long hours = totalMs / 3600000;
        long minutes = (totalMs % 3600000) / 60000;
        long seconds = (totalMs % 60000) / 1000;
        long ms = totalMs % 1000;
        return String.format("%02d:%02d:%02d,%03d", hours, minutes, seconds, ms);
    }
}
