package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sva.common.exception.BusinessException;
import com.sva.entity.Video;
import com.sva.mapper.VideoMapper;
import com.sva.service.VideoService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class VideoServiceImpl extends ServiceImpl<VideoMapper, Video> implements VideoService {

    @Override
    public Video createVideo(Long projectId, Long userId, String filename, String storagePath, String bucketName, Long fileSize) {
        Video video = new Video();
        video.setProjectId(projectId);
        video.setUserId(userId);
        video.setFilename(filename);
        video.setStoragePath(storagePath);
        video.setBucketName(bucketName);
        video.setFileSize(fileSize);
        video.setStatus(0);
        save(video);
        return video;
    }

    @Override
    public Video getVideoById(Long id) {
        return getById(id);
    }

    @Override
    public List<Video> getVideoList(Long projectId, Long userId) {
        return list(new LambdaQueryWrapper<Video>()
                .eq(Video::getProjectId, projectId)
                .eq(Video::getUserId, userId)
                .orderByDesc(Video::getCreateTime));
    }

    @Override
    public boolean updateVideoStatus(Long id, Integer status) {
        Video video = getById(id);
        if (video == null) {
            throw new BusinessException(404, "视频不存在");
        }
        video.setStatus(status);
        return updateById(video);
    }

    @Override
    public boolean updateVideoMeta(Long id, Integer duration, Integer width, Integer height, BigDecimal fps, String format) {
        Video video = getById(id);
        if (video == null) {
            throw new BusinessException(404, "视频不存在");
        }
        video.setDuration(duration != null ? duration.doubleValue() : null);
        video.setWidth(width);
        video.setHeight(height);
        video.setFps(fps != null ? fps.doubleValue() : null);
        video.setFormat(format);
        return updateById(video);
    }

    @Override
    public boolean deleteVideo(Long id, Long userId) {
        Video video = getById(id);
        if (video == null || !video.getUserId().equals(userId)) {
            throw new BusinessException(404, "视频不存在");
        }
        return removeById(id);
    }
}
