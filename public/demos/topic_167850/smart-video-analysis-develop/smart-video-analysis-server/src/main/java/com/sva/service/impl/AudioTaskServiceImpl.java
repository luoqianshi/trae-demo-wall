package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sva.common.exception.BusinessException;
import com.sva.entity.AudioTask;
import com.sva.mapper.AudioTaskMapper;
import com.sva.service.AudioTaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 音频创作任务服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AudioTaskServiceImpl extends ServiceImpl<AudioTaskMapper, AudioTask> implements AudioTaskService {

    @Override
    public List<AudioTask> listByProject(Long projectId, Long userId) {
        return list(new LambdaQueryWrapper<AudioTask>()
                .eq(AudioTask::getProjectId, projectId)
                .eq(AudioTask::getUserId, userId)
                .orderByDesc(AudioTask::getCreateTime));
    }

    @Override
    public AudioTask getTaskById(Long id, Long userId) {
        AudioTask task = getById(id);
        if (task == null || !task.getUserId().equals(userId)) {
            throw new BusinessException(404, "任务不存在");
        }
        return task;
    }

    @Override
    @Transactional
    public boolean updateTaskStatus(Long id, Integer status, Integer progress) {
        AudioTask task = getById(id);
        if (task == null) {
            return false;
        }
        task.setStatus(status);
        task.setProgress(progress);
        return updateById(task);
    }

    @Override
    @Transactional
    public boolean updateTaskResult(Long id, String resultPath, String resultBucket) {
        AudioTask task = getById(id);
        if (task == null) {
            return false;
        }
        task.setResultPath(resultPath);
        task.setResultBucket(resultBucket);
        task.setStatus(2);
        task.setProgress(100);
        return updateById(task);
    }
}