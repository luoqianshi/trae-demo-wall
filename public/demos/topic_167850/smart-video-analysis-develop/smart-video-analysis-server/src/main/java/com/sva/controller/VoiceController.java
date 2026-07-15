package com.sva.controller;

import com.sva.common.result.R;
import com.sva.entity.VoiceLibrary;
import com.sva.service.VoiceLibraryService;
import com.sva.vo.VoiceVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 音色库 REST API
 */
@Tag(name = "音色库")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/voice")
@RequiredArgsConstructor
public class VoiceController {

    private final VoiceLibraryService voiceLibraryService;

    @Operation(summary = "获取音色列表（系统预设 + 用户克隆）")
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public R<List<VoiceVO>> listVoices(@RequestAttribute("userId") Long userId) {
        List<VoiceLibrary> voices = voiceLibraryService.listAvailableVoices(userId);
        List<VoiceVO> vos = voices.stream().map(this::toVO).collect(Collectors.toList());
        return R.ok(vos);
    }

    @Operation(summary = "获取单个音色")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public R<VoiceVO> getVoice(@PathVariable Long id) {
        VoiceLibrary voice = voiceLibraryService.getVoiceById(id);
        if (voice == null) {
            return R.fail(404, "音色不存在");
        }
        return R.ok(toVO(voice));
    }

    @Operation(summary = "试听音色（返回示例音频链接）")
    @PostMapping("/{id}/preview")
    @PreAuthorize("hasRole('USER')")
    public R<String> previewVoice(@PathVariable Long id) {
        VoiceLibrary voice = voiceLibraryService.getVoiceById(id);
        if (voice == null) {
            return R.fail(404, "音色不存在");
        }
        // 实际应返回预览音频的下载链接或生成一个简短的 TTS 演示
        String previewUrl = "/api/voice/demo/" + id + ".wav";
        return R.ok(previewUrl);
    }

    @Operation(summary = "删除用户音色")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public R<Void> deleteVoice(@PathVariable Long id,
                                @RequestAttribute("userId") Long userId) {
        boolean deleted = voiceLibraryService.deleteVoice(id, userId);
        if (!deleted) {
            return R.fail(400, "无法删除系统预设音色或音色不存在");
        }
        return R.ok();
    }

    private VoiceVO toVO(VoiceLibrary voice) {
        VoiceVO vo = new VoiceVO();
        vo.setId(String.valueOf(voice.getId()));
        vo.setUserId(String.valueOf(voice.getUserId()));
        vo.setVoiceName(voice.getVoiceName());
        vo.setDescription(voice.getDescription());
        vo.setGender(voice.getGender());
        vo.setLanguage(voice.getLanguage());
        vo.setFeaturePath(voice.getFeaturePath());
        vo.setSourceAudioId(voice.getSourceAudioId() != null ? String.valueOf(voice.getSourceAudioId()) : null);
        vo.setIsSystem(voice.getIsSystem() == 1);
        vo.setCreateTime(voice.getCreateTime());
        vo.setUpdateTime(voice.getUpdateTime());
        return vo;
    }
}