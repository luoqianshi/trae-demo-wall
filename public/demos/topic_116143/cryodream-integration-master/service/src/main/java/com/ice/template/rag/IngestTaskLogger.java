package com.ice.template.rag;

import cn.hutool.json.JSONObject;
import com.ice.template.model.entity.Task;
import com.ice.template.service.TaskService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.util.UUID;

@Component
public class IngestTaskLogger {

    private static final Logger log = LoggerFactory.getLogger(IngestTaskLogger.class);

    @Resource
    private TaskService taskService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String start(String type, String title, JSONObject params) {
        return start(type, title, params, "running", 10);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String start(String type, String title, JSONObject params, String status, Integer progress) {
        try {
            Task task = new Task();
            task.setId(UUID.randomUUID().toString());
            task.setType(type);
            task.setCategory("knowledge_base");
            task.setStatus(StringUtils.defaultIfBlank(status, "running"));
            task.setProgress(progress != null ? progress : 10);
            task.setTitle(title);
            if (params != null) {
                task.setParams(params.toString());
            }
            taskService.save(task);
            return task.getId();
        } catch (Exception ex) {
            log.warn("[IngestTaskLogger.start] 任务日志创建失败（不影响入库）: {}", ex.getMessage());
            return null;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finish(String taskId, String status, JSONObject result, String errorMessage) {
        if (StringUtils.isBlank(taskId)) {
            return;
        }
        try {
            Task task = new Task();
            task.setId(taskId);
            task.setStatus(status);
            task.setProgress("completed".equals(status) ? 100 : 0);
            if (result != null) {
                task.setResult(result.toString());
            }
            if (StringUtils.isNotBlank(errorMessage)) {
                task.setErrorMessage(errorMessage.length() > 500 ? errorMessage.substring(0, 500) : errorMessage);
            }
            taskService.updateById(task);
        } catch (Exception ex) {
            log.warn("[IngestTaskLogger.finish] 任务日志更新失败（不影响入库）: {}", ex.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markRunning(String taskId) {
        updateProgress(taskId, "running", 10, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateProgress(String taskId, String status, Integer progress, String errorMessage) {
        if (StringUtils.isBlank(taskId)) {
            return;
        }
        try {
            Task task = new Task();
            task.setId(taskId);
            if (StringUtils.isNotBlank(status)) {
                task.setStatus(status);
            }
            if (progress != null) {
                task.setProgress(progress);
            }
            if (StringUtils.isNotBlank(errorMessage)) {
                task.setErrorMessage(errorMessage.length() > 500 ? errorMessage.substring(0, 500) : errorMessage);
            }
            taskService.updateById(task);
        } catch (Exception ex) {
            log.warn("[IngestTaskLogger.updateProgress] 任务日志更新失败（不影响入库）: {}", ex.getMessage());
        }
    }
}
