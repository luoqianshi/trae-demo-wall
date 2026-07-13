package com.ice.template.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.entity.Task;
import com.ice.template.service.TaskService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import java.util.List;
import java.util.Map;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/task")
@Api(tags = "任务管理接口")
public class TaskController {

    @Resource
    private TaskService taskService;

    @GetMapping("/get")
    @ApiOperation("根据 ID 查询任务")
    public BaseResponse<Task> getTask(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Task task = taskService.getById(id);
        if (task == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        return ResultUtils.success(task);
    }

    @PostMapping("/list")
    @ApiOperation("查询任务列表")
    public BaseResponse<List<Task>> listTasks(@RequestBody Map<String, String> request) {
        String category = request.get("category");
        String status = request.get("status");
        QueryWrapper<Task> queryWrapper = new QueryWrapper<>();
        if (StringUtils.isNotBlank(category)) {
            queryWrapper.eq("category", category);
        }
        if (StringUtils.isNotBlank(status)) {
            queryWrapper.eq("status", status);
        }
        queryWrapper.orderByDesc("create_time");
        queryWrapper.last("LIMIT 100");
        List<Task> tasks = taskService.list(queryWrapper);
        return ResultUtils.success(tasks);
    }

    @GetMapping("/recent")
    @ApiOperation("查询最近的任务（含运行中的）")
    public BaseResponse<List<Task>> getRecentTasks() {
        QueryWrapper<Task> queryWrapper = new QueryWrapper<>();
        queryWrapper.orderByDesc("create_time");
        queryWrapper.last("LIMIT 50");
        List<Task> tasks = taskService.list(queryWrapper);
        return ResultUtils.success(tasks);
    }
}
