package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sva.common.exception.BusinessException;
import com.sva.entity.Audio;
import com.sva.mapper.AudioMapper;
import com.sva.service.AudioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 音频资源服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AudioServiceImpl extends ServiceImpl<AudioMapper, Audio> implements AudioService {

    @Override
    @Transactional
    public Audio createAudio(Long projectId, Long userId, Long videoId, String filename,
                             String storagePath, String bucketName, Long fileSize,
                             Integer duration, Integer sampleRate, Integer channels,
                             String format, String sourceType) {
        Audio audio = new Audio();
        audio.setProjectId(projectId);
        audio.setUserId(userId);
        audio.setVideoId(videoId);
        audio.setFilename(filename);
        audio.setStoragePath(storagePath);
        audio.setBucketName(bucketName);
        audio.setFileSize(fileSize != null ? fileSize : 0L);
        audio.setDuration(duration != null ? duration : 0);
        audio.setSampleRate(sampleRate);
        audio.setChannels(channels);
        audio.setFormat(format);
        audio.setSourceType(sourceType);
        save(audio);
        return audio;
    }

    @Override
    public List<Audio> listByProject(Long projectId, Long userId) {
        return list(new LambdaQueryWrapper<Audio>()
                .eq(Audio::getProjectId, projectId)
                .eq(Audio::getUserId, userId)
                .orderByDesc(Audio::getCreateTime));
    }

    @Override
    public Audio getAudioById(Long id, Long userId) {
        Audio audio = getById(id);
        if (audio == null || !audio.getUserId().equals(userId)) {
            throw new BusinessException(404, "音频不存在");
        }
        return audio;
    }

    @Override
    @Transactional
    public boolean updateAudioMeta(Long id, Integer duration, Integer sampleRate, Integer channels, String format) {
        Audio audio = getById(id);
        if (audio == null) {
            return false;
        }
        if (duration != null) {
            audio.setDuration(duration);
        }
        if (sampleRate != null) {
            audio.setSampleRate(sampleRate);
        }
        if (channels != null) {
            audio.setChannels(channels);
        }
        if (format != null) {
            audio.setFormat(format);
        }
        return updateById(audio);
    }

    @Override
    @Transactional
    public boolean deleteAudio(Long id, Long userId) {
        Audio audio = getById(id);
        if (audio == null || !audio.getUserId().equals(userId)) {
            return false;
        }
        return removeById(id);
    }
}