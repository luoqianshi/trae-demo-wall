package com.sva.controller;

import com.sva.common.result.R;
import com.sva.entity.Project;
import com.sva.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "项目管理")
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @Operation(summary = "获取用户项目列表")
    @GetMapping
    public R<List<Project>> list(@RequestAttribute("userId") Long userId) {
        return R.ok(projectService.listByUserId(userId));
    }

    @Operation(summary = "创建项目")
    @PostMapping
    public R<Project> create(@RequestBody Map<String, String> body, @RequestAttribute("userId") Long userId) {
        Project project = projectService.createProject(userId, body.get("name"), body.get("description"));
        return R.ok(project);
    }

    @Operation(summary = "更新项目")
    @PutMapping("/{id}")
    public R<Project> update(@PathVariable Long id, @RequestBody Map<String, String> body,
                             @RequestAttribute("userId") Long userId) {
        Project project = projectService.updateProject(id, userId, body.get("name"), body.get("description"));
        return R.ok(project);
    }

    @Operation(summary = "删除项目")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id, @RequestAttribute("userId") Long userId) {
        Project project = projectService.getById(id);
        if (project == null || !project.getUserId().equals(userId)) {
            return R.fail(404, "项目不存在");
        }
        projectService.removeById(id);
        return R.ok();
    }
}
