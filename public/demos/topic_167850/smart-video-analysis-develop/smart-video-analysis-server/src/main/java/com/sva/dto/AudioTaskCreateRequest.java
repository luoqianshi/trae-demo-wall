package com.sva.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

/**
 * 音频创作任务创建请求 DTO
 */
@Data
public class AudioTaskCreateRequest {

    @NotNull(message = "项目ID不能为空")
    private Long projectId;

    /**
     * 源音频ID（音色转换/人声克隆时需要）
     */
    private Long sourceAudioId;

    /**
     * 生成模式: VOICE_CLONE/TEXT_TO_SPEECH/VOICE_CONVERSION
     */
    @NotBlank(message = "生成模式不能为空")
    private String mode;

    /**
     * 音色ID
     */
    private String voiceId;

    /**
     * 音色名称（人声克隆时使用）
     */
    private String voiceName;

    /**
     * 文本内容（TTS 时使用）
     */
    private String textContent;

    /**
     * 生成参数（语速/语调/情感等）
     */
    private Map<String, Object> params;
}