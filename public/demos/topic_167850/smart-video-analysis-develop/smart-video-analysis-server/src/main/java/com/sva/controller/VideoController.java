package com.sva.controller;

import com.sva.common.result.R;
import com.sva.dto.VideoCreateRequest;
import com.sva.entity.Video;
import com.sva.entity.VideoAnalysis;
import com.sva.entity.VideoFrame;
import com.sva.service.VideoService;
import com.sva.service.VideoAnalysisService;
import com.sva.service.VideoFrameService;
import com.sva.service.VideoAnalysisMainService;
import com.sva.config.MinioProperties;
import io.minio.MinioClient;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.http.Method;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Tag(name = "视频管理")
@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoController {

    private final VideoService videoService;
    private final VideoAnalysisService videoAnalysisService;
    private final VideoFrameService videoFrameService;
    private final VideoAnalysisMainService videoAnalysisMainService;
    private final MinioClient minioClient;
    private final MinioProperties minioProperties;

    @Operation(summary = "预签名上传")
    @GetMapping("/presign")
    public R<Map<String, String>> presign(@RequestParam String filename,
                                          @RequestParam(required = false) String contentType,
                                          @RequestParam Long projectId) {
        try {
            String bucketName = minioProperties.getBuckets().get("video-raw");
            String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf(".")) : "";
            String storagePath = UUID.randomUUID().toString().replace("-", "") + ext;

            GetPresignedObjectUrlArgs.Builder builder = GetPresignedObjectUrlArgs.builder()
                    .bucket(bucketName)
                    .object(storagePath)
                    .method(Method.PUT)
                    .expiry(1, TimeUnit.HOURS);

            if (contentType != null && !contentType.isEmpty()) {
                builder = builder.extraQueryParams(Map.of("Content-Type", contentType));
            }

            String uploadUrl = minioClient.getPresignedObjectUrl(builder.build());

            return R.ok(Map.of(
                    "uploadUrl", uploadUrl,
                    "storagePath", storagePath,
                    "bucketName", bucketName
            ));
        } catch (Exception e) {
            return R.fail("生成预签名URL失败: " + e.getMessage());
        }
    }

    @Operation(summary = "创建视频记录")
    @PostMapping
    public R<Video> create(@Valid @RequestBody VideoCreateRequest request,
                           @RequestAttribute("userId") Long userId) {
        Video video = videoService.createVideo(
                request.getProjectId(),
                userId,
                request.getFilename(),
                request.getStoragePath(),
                request.getBucketName(),
                request.getFileSize()
        );
        return R.ok(video);
    }

    @Operation(summary = "获取视频列表")
    @GetMapping
    public R<List<Video>> list(@RequestParam Long projectId,
                               @RequestAttribute("userId") Long userId) {
        return R.ok(videoService.getVideoList(projectId, userId));
    }

    @Operation(summary = "获取视频详情")
    @GetMapping("/{id}")
    public R<Video> getById(@PathVariable Long id,
                            @RequestAttribute("userId") Long userId) {
        Video video = videoService.getVideoById(id);
        if (video == null || !video.getUserId().equals(userId)) {
            return R.fail(404, "视频不存在");
        }
        return R.ok(video);
    }

    @Operation(summary = "触发解析")
    @PostMapping("/{id}/analyze")
    public R<VideoAnalysis> analyze(@PathVariable Long id,
                                    @RequestAttribute("userId") Long userId) {
        Video video = videoService.getVideoById(id);
        if (video == null || !video.getUserId().equals(userId)) {
            return R.fail(404, "视频不存在");
        }
        VideoAnalysis analysis = videoAnalysisService.startAnalysis(id);
        videoAnalysisMainService.startAnalysis(id, analysis.getId(), userId);
        return R.ok(analysis);
    }

    @Operation(summary = "获取解析进度")
    @GetMapping("/{id}/analysis")
    public R<VideoAnalysis> getAnalysis(@PathVariable Long id,
                                        @RequestAttribute("userId") Long userId) {
        Video video = videoService.getVideoById(id);
        if (video == null || !video.getUserId().equals(userId)) {
            return R.fail(404, "视频不存在");
        }
        VideoAnalysis analysis = videoAnalysisService.getAnalysisByVideoId(id);
        return R.ok(analysis);
    }

    @Operation(summary = "获取关键帧")
    @GetMapping("/{id}/frames")
    public R<List<VideoFrame>> getFrames(@PathVariable Long id,
                                         @RequestAttribute("userId") Long userId) {
        Video video = videoService.getVideoById(id);
        if (video == null || !video.getUserId().equals(userId)) {
            return R.fail(404, "视频不存在");
        }
        List<VideoFrame> frames = videoFrameService.getKeyFrames(id);
        return R.ok(frames);
    }

    @Operation(summary = "删除视频")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id, @RequestAttribute("userId") Long userId) {
        Video video = videoService.getVideoById(id);
        if (video == null || !video.getUserId().equals(userId)) {
            return R.fail(404, "视频不存在");
        }
        videoService.deleteVideo(id, userId);
        return R.ok();
    }
}
