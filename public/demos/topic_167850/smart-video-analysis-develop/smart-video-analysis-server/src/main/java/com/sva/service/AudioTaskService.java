package com.sva.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sva.entity.AudioTask;

import java.util.List;

/**
 * 音频创作任务服务接口
 */
public interface AudioTaskService extends IService<AudioTask> {

    /**
     * 获取任务列表（按项目）
     */
    List<AudioTask> listByProject(Long projectId, Long userId);

    /**
     * 获取任务详情
     */
    AudioTask getTaskById(Long id, Long userId);

    /**
     * 更新任务状态
     */
    boolean updateTaskStatus(Long id, Integer status, Integer progress);

    /**
     * 更新任务结果
     */
    boolean updateTaskResult(Long id, String resultPath, String resultBucket);
}