package com.sva.controller;

import com.sva.common.result.R;
import com.sva.dto.FusionCreateRequest;
import com.sva.entity.FusionTask;
import com.sva.service.FusionService;
import com.sva.vo.FusionResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "多视频融合创作")
@RestController
@RequestMapping("/api/fusion")
@RequiredArgsConstructor
public class FusionController {

    private final FusionService fusionService;

    @Operation(summary = "创建融合任务")
    @PostMapping
    public R<FusionTask> createFusion(@Valid @RequestBody FusionCreateRequest request,
                                       @RequestAttribute("userId") Long userId) {
        FusionTask task = fusionService.createTask(request.getProjectId(), userId, request.getVideoIds(), request.getFusionMode());
        return R.ok(task);
    }

    @Operation(summary = "获取融合结果")
    @GetMapping("/{id}/result")
    public R<FusionResultVO> getFusionResult(@PathVariable Long id,
                                              @RequestAttribute("userId") Long userId) {
        FusionResultVO result = fusionService.getResult(id, userId);
        return R.ok(result);
    }

    @Operation(summary = "获取融合任务列表")
    @GetMapping
    public R<List<FusionTask>> listFusionTasks(@RequestParam Long projectId,
                                                @RequestAttribute("userId") Long userId) {
        List<FusionTask> list = fusionService.listByProject(projectId, userId);
        return R.ok(list);
    }

    @Operation(summary = "重新生成融合方案")
    @PostMapping("/{id}/regenerate")
    public R<FusionTask> regenerate(@PathVariable Long id,
                                     @RequestAttribute("userId") Long userId) {
        FusionTask task = fusionService.getById(id);
        if (task == null || !task.getUserId().equals(userId)) {
            return R.fail(404, "任务不存在");
        }
        task.setStatus(0);
        task.setProgress(0);
        task.setErrorMsg(null);
        task.setScriptOutline(null);
        task.setShotSuggestions(null);
        fusionService.updateById(task);
        fusionService.startFusion(id);
        return R.ok(task);
    }
}
