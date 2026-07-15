package com.sva.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sva.entity.VoiceLibrary;

import java.util.List;

/**
 * 音色库服务接口
 */
public interface VoiceLibraryService extends IService<VoiceLibrary> {

    /**
     * 获取所有可用音色（系统预设 + 用户克隆）
     */
    List<VoiceLibrary> listAvailableVoices(Long userId);

    /**
     * 获取系统预设音色
     */
    List<VoiceLibrary> listSystemVoices();

    /**
     * 获取用户克隆音色
     */
    List<VoiceLibrary> listUserVoices(Long userId);

    /**
     * 获取音色详情
     */
    VoiceLibrary getVoiceById(Long id);

    /**
     * 创建用户音色（克隆后保存）
     */
    VoiceLibrary createVoice(Long userId, String voiceName, String description,
                             String gender, String language, String featurePath, Long sourceAudioId);

    /**
     * 删除用户音色
     */
    boolean deleteVoice(Long id, Long userId);
}