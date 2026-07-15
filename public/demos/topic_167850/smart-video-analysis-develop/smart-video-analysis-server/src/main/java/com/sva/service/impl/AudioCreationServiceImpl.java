package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sva.client.RvcClient;
import com.sva.client.TtsClient;
import com.sva.common.exception.BusinessException;
import com.sva.config.RvcProperties;
import com.sva.config.TtsProperties;
import com.sva.entity.Audio;
import com.sva.entity.AudioTask;
import com.sva.entity.VoiceLibrary;
import com.sva.mapper.AudioMapper;
import com.sva.service.AudioCreationService;
import com.sva.service.AudioTaskService;
import com.sva.service.VoiceLibraryService;
import com.sva.vo.AudioTaskVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AudioCreationServiceImpl implements AudioCreationService {

    private final AudioTaskService audioTaskService;
    private final VoiceLibraryService voiceLibraryService;
    private final AudioMapper audioMapper;
    private final TtsClient ttsClient;
    private final RvcClient rvcClient;
    private final TtsProperties ttsProperties;
    private final RvcProperties rvcProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public AudioTask createVoiceCloneTask(Long projectId, Long userId, Long sourceAudioId, String voiceName) {
        Audio sourceAudio = audioMapper.selectById(sourceAudioId);
        if (sourceAudio == null || !sourceAudio.getUserId().equals(userId)) {
            throw new BusinessException(404, "源音频不存在");
        }

        AudioTask task = new AudioTask();
        task.setProjectId(projectId);
        task.setUserId(userId);
        task.setSourceAudioId(sourceAudioId);
        task.setMode("voice_clone");
        task.setVoiceName(voiceName);
        task.setStatus(0);
        task.setProgress(0);
        audioTaskService.save(task);

        startAudioTask(task.getId());
        return task;
    }

    @Override
    @Transactional
    public AudioTask createTtsTask(Long projectId, Long userId, String text, String voiceId, Map<String, Object> params) {
        AudioTask task = new AudioTask();
        task.setProjectId(projectId);
        task.setUserId(userId);
        task.setMode("tts");
        task.setVoiceId(voiceId);
        task.setTextContent(text);
        try {
            task.setParamsJson(params != null ? objectMapper.writeValueAsString(params) : null);
        } catch (JsonProcessingException e) {
            throw new BusinessException(500, "参数序列化失败");
        }
        task.setStatus(0);
        task.setProgress(0);
        audioTaskService.save(task);

        startAudioTask(task.getId());
        return task;
    }

    @Override
    @Transactional
    public AudioTask createVoiceConversionTask(Long projectId, Long userId, Long sourceAudioId, String voiceId, Map<String, Object> params) {
        Audio sourceAudio = audioMapper.selectById(sourceAudioId);
        if (sourceAudio == null || !sourceAudio.getUserId().equals(userId)) {
            throw new BusinessException(404, "源音频不存在");
        }

        AudioTask task = new AudioTask();
        task.setProjectId(projectId);
        task.setUserId(userId);
        task.setSourceAudioId(sourceAudioId);
        task.setMode("voice_conversion");
        task.setVoiceId(voiceId);
        try {
            task.setParamsJson(params != null ? objectMapper.writeValueAsString(params) : null);
        } catch (JsonProcessingException e) {
            throw new BusinessException(500, "参数序列化失败");
        }
        task.setStatus(0);
        task.setProgress(0);
        audioTaskService.save(task);

        startAudioTask(task.getId());
        return task;
    }

    @Override
    public AudioTaskVO getTaskResult(Long taskId, Long userId) {
        AudioTask task = audioTaskService.getTaskById(taskId, userId);
        return convertToVO(task);
    }

    @Override
    @Async
    public void startAudioTask(Long taskId) {
        AudioTask task = audioTaskService.getById(taskId);
        if (task == null) {
            return;
        }

        try {
            audioTaskService.updateTaskStatus(taskId, 1, 10);

            String resultPath;
            String resultBucket = "audio-output";

            switch (task.getMode()) {
                case "tts":
                    resultPath = executeTts(task);
                    break;
                case "voice_clone":
                    resultPath = executeVoiceClone(task);
                    break;
                case "voice_conversion":
                    resultPath = executeVoiceConversion(task);
                    break;
                default:
                    throw new BusinessException(400, "不支持的任务类型");
            }

            audioTaskService.updateTaskResult(taskId, resultPath, resultBucket);
            log.info("音频任务完成: taskId={}, resultPath={}", taskId, resultPath);

        } catch (Exception e) {
            log.error("音频任务失败: taskId={}", taskId, e);
            AudioTask errorTask = audioTaskService.getById(taskId);
            if (errorTask != null) {
                errorTask.setStatus(3);
                errorTask.setErrorMsg(e.getMessage());
                audioTaskService.updateById(errorTask);
            }
        }
    }

    @Override
    @Transactional
    public AudioTask regenerate(Long taskId, Long userId) {
        AudioTask original = audioTaskService.getTaskById(taskId, userId);
        if (original == null) {
            throw new BusinessException(404, "任务不存在");
        }

        AudioTask newTask = new AudioTask();
        newTask.setProjectId(original.getProjectId());
        newTask.setUserId(userId);
        newTask.setSourceAudioId(original.getSourceAudioId());
        newTask.setMode(original.getMode());
        newTask.setVoiceId(original.getVoiceId());
        newTask.setVoiceName(original.getVoiceName());
        newTask.setTextContent(original.getTextContent());
        newTask.setParamsJson(original.getParamsJson());
        newTask.setStatus(0);
        newTask.setProgress(0);
        audioTaskService.save(newTask);

        startAudioTask(newTask.getId());
        return newTask;
    }

    private String executeTts(AudioTask task) throws Exception {
        if (!ttsProperties.isEnabled()) {
            throw new BusinessException(503, "TTS 服务未启用");
        }
        Map<String, Object> params = parseParams(task.getParamsJson());
        return ttsClient.synthesize(
                ttsProperties.getEndpoint(),
                task.getTextContent(),
                task.getVoiceId() != null ? task.getVoiceId() : ttsProperties.getDefaultVoiceId(),
                params
        );
    }

    private String executeVoiceClone(AudioTask task) throws Exception {
        if (!rvcProperties.isEnabled()) {
            throw new BusinessException(503, "RVC 服务未启用");
        }
        Audio sourceAudio = audioMapper.selectById(task.getSourceAudioId());
        if (sourceAudio == null) {
            throw new BusinessException(404, "源音频不存在");
        }

        String voiceId = rvcClient.cloneVoice(
                rvcProperties.getEndpoint(),
                sourceAudio.getStoragePath(),
                task.getVoiceName()
        );

        voiceLibraryService.createVoice(
                task.getUserId(),
                task.getVoiceName(),
                "用户克隆音色",
                "female",
                "zh",
                voiceId,
                task.getSourceAudioId()
        );

        return voiceId;
    }

    private String executeVoiceConversion(AudioTask task) throws Exception {
        if (!rvcProperties.isEnabled()) {
            throw new BusinessException(503, "RVC 服务未启用");
        }
        Audio sourceAudio = audioMapper.selectById(task.getSourceAudioId());
        if (sourceAudio == null) {
            throw new BusinessException(404, "源音频不存在");
        }

        Map<String, Object> params = parseParams(task.getParamsJson());
        return rvcClient.convertVoice(
                rvcProperties.getEndpoint(),
                sourceAudio.getStoragePath(),
                task.getVoiceId(),
                params
        );
    }

    private AudioTaskVO convertToVO(AudioTask task) {
        AudioTaskVO vo = new AudioTaskVO();
        vo.setId(String.valueOf(task.getId()));
        vo.setProjectId(String.valueOf(task.getProjectId()));
        vo.setSourceAudioId(task.getSourceAudioId() != null ? String.valueOf(task.getSourceAudioId()) : null);
        vo.setMode(task.getMode());
        vo.setModeName(getModeName(task.getMode()));
        vo.setVoiceId(task.getVoiceId());
        vo.setVoiceName(task.getVoiceName());
        vo.setTextContent(task.getTextContent());
        vo.setParams(parseParams(task.getParamsJson()));
        vo.setResultPath(task.getResultPath());
        vo.setResultBucket(task.getResultBucket());
        vo.setStatus(task.getStatus());
        vo.setProgress(task.getProgress());
        vo.setErrorMsg(task.getErrorMsg());
        vo.setCreateTime(task.getCreateTime());
        vo.setUpdateTime(task.getUpdateTime());
        return vo;
    }

    private String getModeName(String mode) {
        if (mode == null) return "";
        return switch (mode) {
            case "tts" -> "文本转语音";
            case "voice_clone" -> "人声克隆";
            case "voice_conversion" -> "音色转换";
            default -> mode;
        };
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseParams(String paramsJson) {
        if (paramsJson == null || paramsJson.isEmpty()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(paramsJson, Map.class);
        } catch (JsonProcessingException e) {
            return new HashMap<>();
        }
    }
}
