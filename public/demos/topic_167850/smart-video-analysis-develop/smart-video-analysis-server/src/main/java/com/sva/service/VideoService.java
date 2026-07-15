package com.sva.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sva.entity.Video;

import java.math.BigDecimal;
import java.util.List;

public interface VideoService extends IService<Video> {

    Video createVideo(Long projectId, Long userId, String filename, String storagePath, String bucketName, Long fileSize);

    Video getVideoById(Long id);

    List<Video> getVideoList(Long projectId, Long userId);

    boolean updateVideoStatus(Long id, Integer status);

    boolean updateVideoMeta(Long id, Integer duration, Integer width, Integer height, BigDecimal fps, String format);

    boolean deleteVideo(Long id, Long userId);
}
