package com.sva.controller;

import com.sva.common.result.R;
import com.sva.dto.FrameExtractRequest;
import com.sva.dto.FrameTaskCreateRequest;
import com.sva.entity.FrameTask;
import com.sva.service.FrameService;
import com.sva.vo.FrameExtractVO;
import com.sva.vo.FrameTaskVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "帧级创作")
@RestController
@RequestMapping("/api/frame")
@RequiredArgsConstructor
public class FrameController {

    private final FrameService frameService;

    @Operation(summary = "创建帧级创作任务")
    @PostMapping
    public R<FrameTask> createTask(@Valid @RequestBody FrameTaskCreateRequest request,
                                    @RequestAttribute("userId") Long userId) {
        FrameTask task = frameService.createTask(request, userId);
        return R.ok(task);
    }

    @Operation(summary = "获取任务结果")
    @GetMapping("/{id}/result")
    public R<FrameTaskVO> getTaskResult(@PathVariable Long id,
                                         @RequestAttribute("userId") Long userId) {
        return R.ok(frameService.getTaskResult(id, userId));
    }

    @Operation(summary = "获取任务列表")
    @GetMapping
    public R<List<FrameTask>> listTasks(@RequestParam Long projectId,
                                         @RequestAttribute("userId") Long userId) {
        return R.ok(frameService.listByProject(projectId, userId));
    }

    @Operation(summary = "重新生成")
    @PostMapping("/{id}/regenerate")
    public R<FrameTask> regenerate(@PathVariable Long id,
                                    @RequestAttribute("userId") Long userId) {
        return R.ok(frameService.regenerate(id, userId));
    }

    @Operation(summary = "提取视频帧")
    @PostMapping("/extract")
    public R<FrameExtractVO> extractFrames(@Valid @RequestBody FrameExtractRequest request,
                                            @RequestAttribute("userId") Long userId) {
        return R.ok(frameService.extractFrames(request, userId));
    }
}
