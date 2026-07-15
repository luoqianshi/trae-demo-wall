package com.sva.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sva.entity.FusionTask;
import com.sva.vo.FusionResultVO;

import java.util.List;

public interface FusionService extends IService<FusionTask> {

    FusionTask createTask(Long projectId, Long userId, List<Long> videoIds, String fusionMode);

    FusionResultVO getResult(Long taskId, Long userId);

    List<FusionTask> listByProject(Long projectId, Long userId);

    void startFusion(Long taskId);
}
