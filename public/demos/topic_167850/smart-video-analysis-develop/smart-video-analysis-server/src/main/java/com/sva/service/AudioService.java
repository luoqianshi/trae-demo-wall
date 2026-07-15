package com.sva.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sva.entity.Audio;

import java.util.List;

/**
 * 音频资源服务接口
 */
public interface AudioService extends IService<Audio> {

    /**
     * 创建音频资源
     */
    Audio createAudio(Long projectId, Long userId, Long videoId, String filename,
                      String storagePath, String bucketName, Long fileSize,
                      Integer duration, Integer sampleRate, Integer channels,
                      String format, String sourceType);

    /**
     * 获取音频列表（按项目）
     */
    List<Audio> listByProject(Long projectId, Long userId);

    /**
     * 获取音频详情
     */
    Audio getAudioById(Long id, Long userId);

    /**
     * 更新音频元数据
     */
    boolean updateAudioMeta(Long id, Integer duration, Integer sampleRate, Integer channels, String format);

    /**
     * 删除音频
     */
    boolean deleteAudio(Long id, Long userId);
}