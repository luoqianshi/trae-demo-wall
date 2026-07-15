package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sva.entity.VoiceLibrary;
import com.sva.mapper.VoiceLibraryMapper;
import com.sva.service.VoiceLibraryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 音色库服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VoiceLibraryServiceImpl extends ServiceImpl<VoiceLibraryMapper, VoiceLibrary> implements VoiceLibraryService {

    @Override
    public List<VoiceLibrary> listAvailableVoices(Long userId) {
        List<VoiceLibrary> voices = new ArrayList<>();
        // 系统预设音色
        voices.addAll(listSystemVoices());
        // 用户克隆音色
        voices.addAll(listUserVoices(userId));
        return voices;
    }

    @Override
    public List<VoiceLibrary> listSystemVoices() {
        return list(new LambdaQueryWrapper<VoiceLibrary>()
                .eq(VoiceLibrary::getIsSystem, 1)
                .orderByAsc(VoiceLibrary::getCreateTime));
    }

    @Override
    public List<VoiceLibrary> listUserVoices(Long userId) {
        return list(new LambdaQueryWrapper<VoiceLibrary>()
                .eq(VoiceLibrary::getUserId, userId)
                .eq(VoiceLibrary::getIsSystem, 0)
                .orderByDesc(VoiceLibrary::getCreateTime));
    }

    @Override
    public VoiceLibrary getVoiceById(Long id) {
        return getById(id);
    }

    @Override
    @Transactional
    public VoiceLibrary createVoice(Long userId, String voiceName, String description,
                                     String gender, String language, String featurePath, Long sourceAudioId) {
        VoiceLibrary voice = new VoiceLibrary();
        voice.setUserId(userId);
        voice.setVoiceName(voiceName);
        voice.setDescription(description);
        voice.setGender(gender);
        voice.setLanguage(language);
        voice.setFeaturePath(featurePath);
        voice.setSourceAudioId(sourceAudioId);
        voice.setIsSystem(0);
        save(voice);
        return voice;
    }

    @Override
    @Transactional
    public boolean deleteVoice(Long id, Long userId) {
        VoiceLibrary voice = getById(id);
        if (voice == null || !voice.getUserId().equals(userId) || voice.getIsSystem() == 1) {
            return false;
        }
        return removeById(id);
    }
}