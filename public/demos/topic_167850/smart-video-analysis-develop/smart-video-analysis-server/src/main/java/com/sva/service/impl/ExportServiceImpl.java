package com.sva.service.impl;

import com.sva.entity.EditorProject;
import com.sva.service.EditorService;
import com.sva.service.ExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportServiceImpl implements ExportService {

    private final EditorService editorService;
    private final ConcurrentHashMap<Long, Integer> exportProgressMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, String> exportResultMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, Boolean> exportCancelledMap = new ConcurrentHashMap<>();

    @Override
    public Map<String, Object> exportProject(Long projectId, Map<String, Object> params) {
        EditorProject project = editorService.getById(projectId);
        if (project == null) {
            throw new RuntimeException("项目不存在");
        }

        project.setStatus(2);
        project.setExportProgress(0);
        editorService.updateById(project);

        exportProgressMap.put(projectId, 0);
        exportResultMap.remove(projectId);
        exportCancelledMap.put(projectId, false);

        startExportAsync(projectId, params);

        Map<String, Object> result = new HashMap<>();
        result.put("projectId", projectId);
        result.put("message", "导出任务已启动");
        result.put("status", "exporting");

        return result;
    }

    @Async
    public void startExportAsync(Long projectId, Map<String, Object> params) {
        try {
            simulateExportProgress(projectId);

            if (!exportCancelledMap.getOrDefault(projectId, false)) {
                String resultPath = generateMockResultPath(projectId);
                exportResultMap.put(projectId, resultPath);

                EditorProject project = editorService.getById(projectId);
                if (project != null) {
                    project.setStatus(1);
                    project.setExportProgress(100);
                    project.setExportResultPath(resultPath);
                    editorService.updateById(project);
                }
            }

        } catch (Exception e) {
            log.error("导出失败", e);
            exportProgressMap.put(projectId, -1);

            EditorProject project = editorService.getById(projectId);
            if (project != null) {
                project.setStatus(3);
                project.setExportProgress(0);
                editorService.updateById(project);
            }
        } finally {
            exportCancelledMap.remove(projectId);
        }
    }

    private void simulateExportProgress(Long projectId) throws InterruptedException {
        int progress = 0;
        while (progress < 100) {
            if (exportCancelledMap.getOrDefault(projectId, false)) {
                break;
            }

            Thread.sleep(500);
            progress += 5 + (int) (Math.random() * 10);
            if (progress > 100) progress = 100;

            exportProgressMap.put(projectId, progress);

            EditorProject project = editorService.getById(projectId);
            if (project != null) {
                project.setExportProgress(progress);
                editorService.updateById(project);
            }
        }
    }

    private String generateMockResultPath(Long projectId) {
        return "mock/export/video_" + projectId + "_" + System.currentTimeMillis() + ".mp4";
    }

    @Override
    public Map<String, Object> getExportProgress(Long projectId) {
        Map<String, Object> result = new HashMap<>();

        EditorProject project = editorService.getById(projectId);
        if (project != null) {
            result.put("projectId", projectId);
            result.put("progress", project.getExportProgress());
            result.put("status", getStatusText(project.getStatus()));

            if (project.getExportResultPath() != null) {
                result.put("resultPath", project.getExportResultPath());
                result.put("downloadUrl", "/api/editor/projects/" + projectId + "/download");
            }
        } else {
            result.put("projectId", projectId);
            result.put("progress", exportProgressMap.getOrDefault(projectId, 0));
            result.put("status", "unknown");
        }

        return result;
    }

    private String getStatusText(Integer status) {
        return switch (status) {
            case 0 -> "editing";
            case 1 -> "completed";
            case 2 -> "exporting";
            case 3 -> "failed";
            default -> "unknown";
        };
    }

    @Override
    public void cancelExport(Long projectId) {
        exportCancelledMap.put(projectId, true);

        EditorProject project = editorService.getById(projectId);
        if (project != null) {
            project.setStatus(0);
            project.setExportProgress(0);
            editorService.updateById(project);
        }
    }
}