package com.sva.service;

import java.util.Map;

public interface ExportService {

    Map<String, Object> exportProject(Long projectId, Map<String, Object> params);

    Map<String, Object> getExportProgress(Long projectId);

    void cancelExport(Long projectId);
}