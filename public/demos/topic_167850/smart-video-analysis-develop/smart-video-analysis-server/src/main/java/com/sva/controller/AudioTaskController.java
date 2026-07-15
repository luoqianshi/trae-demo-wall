package com.sva.controller;

import com.sva.common.result.R;
import com.sva.entity.AudioTask;
import com.sva.service.AudioCreationService;
import com.sva.service.AudioTaskService;
import com.sva.vo.AudioTaskVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 音频创作任务 REST API
 */
@Tag(name = "音频创作任务")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/audio-task")
@RequiredArgsConstructor
public class AudioTaskController {

    private final AudioTaskService audioTaskService;
    private final AudioCreationService audioCreationService;

    @Operation(summary = "创建人声克隆任务")
    @PostMapping("/voice-clone")
    @PreAuthorize("hasRole('USER')")
    public R<AudioTask> createVoiceCloneTask(@Valid @RequestBody VoiceCloneRequest request,
                                              @RequestAttribute("userId") Long userId) {
        AudioTask task = audioCreationService.createVoiceCloneTask(
                request.getProjectId(),
                userId,
                request.getSourceAudioId(),
                request.getVoiceName()
        );
        return R.ok(task);
    }

    @Operation(summary = "创建 TTS 任务")
    @PostMapping("/tts")
    @PreAuthorize("hasRole('USER')")
    public R<AudioTask> createTtsTask(@Valid @RequestBody TtsRequest request,
                                       @RequestAttribute("userId") Long userId) {
        AudioTask task = audioCreationService.createTtsTask(
                request.getProjectId(),
                userId,
                request.getText(),
                request.getVoiceId(),
                request.getParams()
        );
        return R.ok(task);
    }

    @Operation(summary = "创建音色转换任务")
    @PostMapping("/voice-conversion")
    @PreAuthorize("hasRole('USER')")
    public R<AudioTask> createVoiceConversionTask(@Valid @RequestBody VoiceConversionRequest request,
                                                   @RequestAttribute("userId") Long userId) {
        AudioTask task = audioCreationService.createVoiceConversionTask(
                request.getProjectId(),
                userId,
                request.getSourceAudioId(),
                request.getVoiceId(),
                request.getParams()
        );
        return R.ok(task);
    }

    @Operation(summary = "获取任务结果")
    @GetMapping("/{id}/result")
    @PreAuthorize("hasRole('USER')")
    public R<AudioTaskVO> getTaskResult(@PathVariable Long id,
                                         @RequestAttribute("userId") Long userId) {
        return R.ok(audioCreationService.getTaskResult(id, userId));
    }

    @Operation(summary = "获取任务列表")
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public R<List<AudioTask>> listTasks(@RequestParam Long projectId,
                                         @RequestAttribute("userId") Long userId) {
        return R.ok(audioTaskService.listByProject(projectId, userId));
    }

    @Operation(summary = "重新生成")
    @PostMapping("/{id}/regenerate")
    @PreAuthorize("hasRole('USER')")
    public R<AudioTask> regenerate(@PathVariable Long id,
                                    @RequestAttribute("userId") Long userId) {
        return R.ok(audioCreationService.regenerate(id, userId));
    }
}

/**
 * 人声克隆请求（内部 DTO）
 */
@lombok.Data
class VoiceCloneRequest {
    @jakarta.validation.constraints.NotNull(message = "项目ID不能为空")
    private Long projectId;

    @jakarta.validation.constraints.NotNull(message = "源音频ID不能为空")
    private Long sourceAudioId;

    @jakarta.validation.constraints.NotBlank(message = "音色名称不能为空")
    private String voiceName;
}

/**
 * TTS 请求（内部 DTO）
 */
@lombok.Data
class TtsRequest {
    @jakarta.validation.constraints.NotNull(message = "项目ID不能为空")
    private Long projectId;

    @jakarta.validation.constraints.NotBlank(message = "文本内容不能为空")
    private String text;

    private String voiceId;

    private Map<String, Object> params;
}

/**
 * 音色转换请求（内部 DTO）
 */
@lombok.Data
class VoiceConversionRequest {
    @jakarta.validation.constraints.NotNull(message = "项目ID不能为空")
    private Long projectId;

    @jakarta.validation.constraints.NotNull(message = "源音频ID不能为空")
    private Long sourceAudioId;

    @jakarta.validation.constraints.NotBlank(message = "音色ID不能为空")
    private String voiceId;

    private Map<String, Object> params;
}