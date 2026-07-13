package com.ice.template.service;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.config.ComfyUIConfig;
import com.ice.template.integration.comfyui.ComfyUIClient;
import com.ice.template.integration.comfyui.ComfyUIProgress;
import com.ice.template.integration.comfyui.ComfyUIWorkflowConverter;
import com.ice.template.model.entity.ComfyUIWorkflow;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * ComfyUI 异步执行任务管理：提交任务后立即返回 taskId，后台线程执行并记录实时进度。
 */
@Service
public class ComfyUITaskService {

    private static final Logger log = LoggerFactory.getLogger(ComfyUITaskService.class);

    @Resource
    private ComfyUIConfig comfyUIConfig;

    @Resource
    private ComfyUIClient comfyUIClient;

    @Resource
    private ComfyUIWorkflowService comfyUIWorkflowService;

    private final ExecutorService executor = Executors.newFixedThreadPool(2);
    private final Map<String, ComfyUIProgress> tasks = new ConcurrentHashMap<>();

    /**
     * 提交一次执行，返回 taskId。后台线程执行。
     */
    public String submit(String workflowId, Map<String, Object> overrideValues, String projectId) {
        ComfyUIWorkflow wf = comfyUIWorkflowService.getById(workflowId);
        if (wf == null) {
            throw new IllegalArgumentException("工作流不存在: " + workflowId);
        }
        Map<String, Object> values = new HashMap<>();
        if (StringUtils.isNotBlank(wf.getParamValues())) {
            JSONObject saved = JSONUtil.parseObj(wf.getParamValues());
            for (String key : saved.keySet()) {
                values.put(key, saved.get(key));
            }
        }
        if (overrideValues != null) {
            values.putAll(overrideValues);
        }
        syncCachedInputs(values, projectId);
        String apiPrompt = ComfyUIWorkflowConverter.toApiFormat(wf.getGraphJson(), values);

        // 使用 projectId 作为输出子目录（稳定不随重命名变化）
        final String finalProjectDirKey = StringUtils.isNotBlank(projectId) ? projectId : null;

        String taskId = UUID.randomUUID().toString();
        ComfyUIProgress progress = new ComfyUIProgress();
        progress.setMessage("排队中");
        tasks.put(taskId, progress);

        executor.submit(() -> {
            try {
                log.info("[ComfyUITaskService] 任务 {} 开始执行工作流 {}", taskId, wf.getName());
                com.ice.template.integration.comfyui.ComfyExecutionResult result = comfyUIClient.executeDetailed(apiPrompt, p -> {
                    ComfyUIProgress cur = tasks.get(taskId);
                    if (cur != null) {
                        cur.setStatus("running");
                        cur.setValue(p.getValue());
                        cur.setMax(p.getMax());
                        cur.setMessage(p.getMessage());
                    }
                }, finalProjectDirKey);
                List<String> urls = result.getOutputs().stream().map(name -> "/api/comfyui-output/" + name).toList();
                // 把 outputsBySlot 也做同样的 URL 前缀补齐，key 保持 ComfyUI 节点 id 不变
                java.util.Map<String, List<String>> urlsBySlot = new java.util.LinkedHashMap<>();
                for (java.util.Map.Entry<String, List<String>> e : result.getOutputsBySlot().entrySet()) {
                    urlsBySlot.put(
                            e.getKey(),
                            e.getValue().stream().map(name -> "/api/comfyui-output/" + name).toList()
                    );
                }
                ComfyUIProgress done = tasks.get(taskId);
                if (done != null) {
                    done.setStatus("done");
                    done.setUrls(urls);
                    done.setUrlsBySlot(urlsBySlot);
                    done.setMessage("完成");
                }
            } catch (Exception e) {
                log.warn("[ComfyUITaskService] 任务 {} 执行失败: {}", taskId, e.getMessage());
                ComfyUIProgress err = tasks.get(taskId);
                if (err != null) {
                    err.setStatus("error");
                    err.setMessage(e.getMessage());
                }
            }
        });
        return taskId;
    }

    private void syncCachedInputs(Map<String, Object> values, String projectId) {
        Set<String> synced = new HashSet<>();
        for (Object value : values.values()) {
            if (!(value instanceof String)) {
                continue;
            }
            String filename = (String) value;
            if (!filename.startsWith("trae-upload-") || !synced.add(filename)) {
                continue;
            }
            comfyUIClient.uploadCachedInputFile(filename, projectId);
        }
    }

    public ComfyUIProgress getProgress(String taskId) {
        return tasks.get(taskId);
    }

    public void remove(String taskId) {
        tasks.remove(taskId);
    }
}
