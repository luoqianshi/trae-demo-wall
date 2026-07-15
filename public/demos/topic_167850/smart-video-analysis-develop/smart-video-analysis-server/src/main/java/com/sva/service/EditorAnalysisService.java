package com.sva.service;

import java.util.Map;

public interface EditorAnalysisService {

    Map<String, Object> analyzeProject(Long projectId);

    Map<String, Object> getAnalysisResult(Long projectId);
}