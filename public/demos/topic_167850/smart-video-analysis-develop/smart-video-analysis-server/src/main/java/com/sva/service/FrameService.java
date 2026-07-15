package com.sva.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sva.dto.FrameExtractRequest;
import com.sva.dto.FrameTaskCreateRequest;
import com.sva.entity.FrameTask;
import com.sva.vo.FrameExtractVO;
import com.sva.vo.FrameTaskVO;

import java.util.List;

public interface FrameService extends IService<FrameTask> {

    FrameTask createTask(FrameTaskCreateRequest request, Long userId);

    FrameTaskVO getTaskResult(Long taskId, Long userId);

    List<FrameTask> listByProject(Long projectId, Long userId);

    FrameTask regenerate(Long taskId, Long userId);

    FrameExtractVO extractFrames(FrameExtractRequest request, Long userId);

    void startFrameTask(Long taskId);
}
