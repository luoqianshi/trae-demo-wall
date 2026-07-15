package com.sva.service;

import com.sva.dto.AudioTaskCreateRequest;
import com.sva.entity.AudioTask;
import com.sva.vo.AudioTaskVO;

import java.util.Map;

/**
 * 音频创作核心业务接口
 */
public interface AudioCreationService {

    /**
     * 创建人声克隆任务
     * @param projectId 项目ID
     * @param userId 用户ID
     * @param sourceAudioId 源音频ID
     * @param voiceName 新音色名称
     * @return 创建的任务
     */
    AudioTask createVoiceCloneTask(Long projectId, Long userId, Long sourceAudioId, String voiceName);

    /**
     * 创建文本转语音任务
     * @param projectId 项目ID
     * @param userId 用户ID
     * @param text 文本内容
     * @param voiceId 音色ID
     * @param params 参数（语速、语调、情感等）
     * @return 创建的任务
     */
    AudioTask createTtsTask(Long projectId, Long userId, String text, String voiceId, Map<String, Object> params);

    /**
     * 创建音色转换任务
     * @param projectId 项目ID
     * @param userId 用户ID
     * @param sourceAudioId 源音频ID
     * @param voiceId 目标音色ID
     * @param params 参数（音调偏移、混合比例等）
     * @return 创建的任务
     */
    AudioTask createVoiceConversionTask(Long projectId, Long userId, Long sourceAudioId, String voiceId, Map<String, Object> params);

    /**
     * 获取任务结果
     * @param taskId 任务ID
     * @param userId 用户ID
     * @return 任务结果 VO
     */
    AudioTaskVO getTaskResult(Long taskId, Long userId);

    /**
     * 异步执行音频任务
     * @param taskId 任务ID
     */
    void startAudioTask(Long taskId);

    /**
     * 重新生成任务
     * @param taskId 任务ID
     * @param userId 用户ID
     * @return 重新生成的任务
     */
    AudioTask regenerate(Long taskId, Long userId);
}