package com.sva.controller;

import com.sva.common.result.R;
import com.sva.entity.EditorProject;
import com.sva.entity.TimelineClip;
import com.sva.entity.TimelineTrack;
import com.sva.service.EditorAnalysisService;
import com.sva.service.EditorService;
import com.sva.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "剪辑工作台")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/editor")
@RequiredArgsConstructor
public class EditorController {

    private final EditorService editorService;
    private final EditorAnalysisService analysisService;
    private final ExportService exportService;

    @Operation(summary = "创建剪辑项目")
    @PostMapping("/projects")
    @PreAuthorize("hasRole('USER')")
    public R<EditorProject> createProject(@RequestBody Map<String, Object> body,
                                          @RequestAttribute("userId") Long userId) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        Long projectId = body.containsKey("projectId") ? ((Number) body.get("projectId")).longValue() : null;
        return R.ok(editorService.createProject(userId, projectId, name, description));
    }

    @Operation(summary = "获取剪辑项目列表")
    @GetMapping("/projects")
    @PreAuthorize("hasRole('USER')")
    public R<List<EditorProject>> listProjects(@RequestAttribute("userId") Long userId) {
        return R.ok(editorService.listProjects(userId));
    }

    @Operation(summary = "获取剪辑项目详情")
    @GetMapping("/projects/{id}")
    @PreAuthorize("hasRole('USER')")
    public R<EditorProject> getProject(@PathVariable Long id,
                                       @RequestAttribute("userId") Long userId) {
        return R.ok(editorService.getProjectById(id, userId));
    }

    @Operation(summary = "更新剪辑项目")
    @PutMapping("/projects/{id}")
    @PreAuthorize("hasRole('USER')")
    public R<EditorProject> updateProject(@PathVariable Long id,
                                          @RequestBody Map<String, Object> body,
                                          @RequestAttribute("userId") Long userId) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        return R.ok(editorService.updateProject(id, userId, name, description));
    }

    @Operation(summary = "删除剪辑项目")
    @DeleteMapping("/projects/{id}")
    @PreAuthorize("hasRole('USER')")
    public R<Void> deleteProject(@PathVariable Long id,
                                  @RequestAttribute("userId") Long userId) {
        editorService.deleteProject(id, userId);
        return R.ok();
    }

    @Operation(summary = "获取时间轴轨道")
    @GetMapping("/projects/{id}/tracks")
    @PreAuthorize("hasRole('USER')")
    public R<List<TimelineTrack>> getTracks(@PathVariable Long id) {
        return R.ok(editorService.getTracksByProject(id));
    }

    @Operation(summary = "创建时间轴轨道")
    @PostMapping("/tracks")
    @PreAuthorize("hasRole('USER')")
    public R<TimelineTrack> createTrack(@RequestBody Map<String, Object> body) {
        Long projectId = ((Number) body.get("projectId")).longValue();
        String trackType = (String) body.get("trackType");
        String trackName = (String) body.get("trackName");
        Integer trackIndex = ((Number) body.get("trackIndex")).intValue();
        return R.ok(editorService.createTrack(projectId, trackType, trackName, trackIndex));
    }

    @Operation(summary = "更新轨道属性")
    @PutMapping("/tracks/{id}")
    @PreAuthorize("hasRole('USER')")
    public R<TimelineTrack> updateTrack(@PathVariable Long id,
                                         @RequestBody Map<String, Object> updates) {
        return R.ok(editorService.updateTrack(id, updates));
    }

    @Operation(summary = "删除轨道")
    @DeleteMapping("/tracks/{id}")
    @PreAuthorize("hasRole('USER')")
    public R<Void> deleteTrack(@PathVariable Long id) {
        editorService.deleteTrack(id);
        return R.ok();
    }

    @Operation(summary = "获取轨道片段")
    @GetMapping("/tracks/{id}/clips")
    @PreAuthorize("hasRole('USER')")
    public R<List<TimelineClip>> getClips(@PathVariable Long id) {
        return R.ok(editorService.getClipsByTrack(id));
    }

    @Operation(summary = "创建片段")
    @PostMapping("/clips")
    @PreAuthorize("hasRole('USER')")
    public R<TimelineClip> createClip(@RequestBody Map<String, Object> body) {
        Long trackId = ((Number) body.get("trackId")).longValue();
        return R.ok(editorService.createClip(trackId, body));
    }

    @Operation(summary = "更新片段属性")
    @PutMapping("/clips/{id}")
    @PreAuthorize("hasRole('USER')")
    public R<TimelineClip> updateClip(@PathVariable Long id,
                                       @RequestBody Map<String, Object> updates) {
        return R.ok(editorService.updateClip(id, updates));
    }

    @Operation(summary = "删除片段")
    @DeleteMapping("/clips/{id}")
    @PreAuthorize("hasRole('USER')")
    public R<Void> deleteClip(@PathVariable Long id) {
        editorService.deleteClip(id);
        return R.ok();
    }

    @Operation(summary = "保存时间轴数据")
    @PostMapping("/projects/{id}/timeline")
    @PreAuthorize("hasRole('USER')")
    public R<Void> saveTimeline(@PathVariable Long id,
                                 @RequestBody Map<String, String> body) {
        editorService.saveTimeline(id, body.get("timelineData"));
        return R.ok();
    }

    @Operation(summary = "获取时间轴数据")
    @GetMapping("/projects/{id}/timeline")
    @PreAuthorize("hasRole('USER')")
    public R<String> getTimeline(@PathVariable Long id) {
        return R.ok(editorService.getTimeline(id));
    }

    @Operation(summary = "获取素材库")
    @GetMapping("/materials")
    @PreAuthorize("hasRole('USER')")
    public R<Map<String, Object>> getMaterials(@RequestAttribute("userId") Long userId) {
        return R.ok(editorService.getMaterialLibrary(userId));
    }

    @Operation(summary = "AI 一键分析")
    @PostMapping("/projects/{id}/analyze")
    @PreAuthorize("hasRole('USER')")
    public R<Map<String, Object>> analyze(@PathVariable Long id) {
        return R.ok(analysisService.analyzeProject(id));
    }

    @Operation(summary = "导出成片")
    @PostMapping("/projects/{id}/export")
    @PreAuthorize("hasRole('USER')")
    public R<Map<String, Object>> exportVideo(@PathVariable Long id,
                                               @RequestBody(required = false) Map<String, Object> params) {
        return R.ok(exportService.exportProject(id, params));
    }

    @Operation(summary = "获取导出进度")
    @GetMapping("/projects/{id}/export/progress")
    @PreAuthorize("hasRole('USER')")
    public R<Map<String, Object>> getExportProgress(@PathVariable Long id) {
        return R.ok(exportService.getExportProgress(id));
    }
}