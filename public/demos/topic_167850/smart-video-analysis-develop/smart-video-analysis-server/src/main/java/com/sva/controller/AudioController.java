package com.sva.controller;

import com.sva.common.result.R;
import com.sva.entity.Audio;
import com.sva.service.AudioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 音频资源 REST API
 */
@Tag(name = "音频资源")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/audio")
@RequiredArgsConstructor
public class AudioController {

    private final AudioService audioService;

    @Operation(summary = "获取音频列表")
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public R<List<Audio>> listAudios(@RequestParam Long projectId,
                                      @RequestAttribute("userId") Long userId) {
        return R.ok(audioService.listByProject(projectId, userId));
    }

    @Operation(summary = "获取单个音频")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public R<Audio> getAudio(@PathVariable Long id,
                              @RequestAttribute("userId") Long userId) {
        return R.ok(audioService.getAudioById(id, userId));
    }

    @Operation(summary = "上传音频（简化版，实际应使用MinIO预签名上传）")
    @PostMapping("/upload")
    @PreAuthorize("hasRole('USER')")
    public R<Audio> uploadAudio(@RequestBody AudioUploadRequest request,
                                 @RequestAttribute("userId") Long userId) {
        Audio audio = audioService.createAudio(
                request.getProjectId(),
                userId,
                request.getVideoId(),
                request.getFilename(),
                request.getStoragePath(),
                request.getBucketName(),
                request.getFileSize(),
                request.getDuration(),
                request.getSampleRate(),
                request.getChannels(),
                request.getFormat(),
                "UPLOADED"
        );
        return R.ok(audio);
    }

    @Operation(summary = "删除音频")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public R<Void> deleteAudio(@PathVariable Long id,
                                @RequestAttribute("userId") Long userId) {
        audioService.deleteAudio(id, userId);
        return R.ok();
    }

    @Operation(summary = "下载音频（返回下载链接）")
    @GetMapping("/{id}/download")
    @PreAuthorize("hasRole('USER')")
    public R<String> downloadAudio(@PathVariable Long id,
                                    @RequestAttribute("userId") Long userId) {
        Audio audio = audioService.getAudioById(id, userId);
        // 实际应生成 MinIO 预签名下载 URL
        String downloadUrl = "/api/audio/file/" + audio.getStoragePath();
        return R.ok(downloadUrl);
    }
}

/**
 * 音频上传请求（内部 DTO）
 */
@lombok.Data
class AudioUploadRequest {
    private Long projectId;
    private Long videoId;
    private String filename;
    private String storagePath;
    private String bucketName;
    private Long fileSize;
    private Integer duration;
    private Integer sampleRate;
    private Integer channels;
    private String format;
}