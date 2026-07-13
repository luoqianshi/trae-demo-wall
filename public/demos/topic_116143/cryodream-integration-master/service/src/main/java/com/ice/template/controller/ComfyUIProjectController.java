package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.entity.ComfyUIProject;
import com.ice.template.service.ComfyUIProjectService;
import com.ice.template.config.ComfyUIConfig;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.io.File;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * ComfyUI 项目画布接口
 */
@RestController
@RequestMapping("/comfyui/project")
@Api(tags = "ComfyUI 项目画布接口")
public class ComfyUIProjectController {

    @Resource
    private ComfyUIProjectService comfyUIProjectService;

    @Resource
    private ComfyUIConfig comfyUIConfig;

    @GetMapping("/list")
    @ApiOperation("项目列表")
    public BaseResponse<List<ComfyUIProject>> list() {
        return ResultUtils.success(comfyUIProjectService.lambdaQuery()
                .orderByDesc(ComfyUIProject::getUpdateTime)
                .list());
    }

    @PostMapping("/create")
    @ApiOperation("新建项目")
    public BaseResponse<ComfyUIProject> create(@RequestBody Map<String, Object> request) {
        String name = asString(request.get("name"));
        if (StringUtils.isBlank(name)) {
            name = "未命名项目";
        }
        ComfyUIProject project = new ComfyUIProject();
        project.setName(name);
        project.setDescription(asString(request.get("description")));
        project.setGraphJson(asString(request.getOrDefault("graphJson", "{\"nodes\":[],\"edges\":[]}")));
        comfyUIProjectService.save(project);
        // 用 projectId 作为目录名（稳定）
        File projectDir = getProjectDir(project.getId());
        if (!projectDir.exists()) {
            projectDir.mkdirs();
        }
        return ResultUtils.success(project);
    }

    @GetMapping("/get")
    @ApiOperation("获取项目详情")
    public BaseResponse<ComfyUIProject> get(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        ComfyUIProject project = comfyUIProjectService.getById(id);
        if (project == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "项目不存在");
        }
        return ResultUtils.success(project);
    }

    @PostMapping("/save")
    @ApiOperation("保存项目画布（更新 graphJson / 名称）")
    public BaseResponse<Boolean> save(@RequestBody Map<String, Object> request) {
        String id = asString(request.get("id"));
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        ComfyUIProject project = comfyUIProjectService.getById(id);
        if (project == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "项目不存在");
        }
        String name = asString(request.get("name"));
        if (StringUtils.isNotBlank(name) && !name.equals(project.getName())) {
            // 目录名以 projectId 为准，重命名不再影响文件目录
            project.setName(name);
        }
        String graphJson = asString(request.get("graphJson"));
        if (graphJson != null) {
            project.setGraphJson(graphJson);
        }
        return ResultUtils.success(comfyUIProjectService.updateById(project));
    }

    @PostMapping("/delete")
    @ApiOperation("删除项目")
    public BaseResponse<Boolean> delete(@RequestBody Map<String, Object> request) {
        String id = asString(request.get("id"));
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        return ResultUtils.success(comfyUIProjectService.removeById(id));
    }

    @PostMapping("/migrate-files")
    @ApiOperation("迁移项目文件到项目子目录（移动物理文件 + 更新graphJson路径）")
    public BaseResponse<Map<String, Object>> migrateFiles(@RequestBody Map<String, Object> request) {
        String projectId = asString(request.get("projectId"));
        if (StringUtils.isBlank(projectId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "projectId 不能为空");
        }
        ComfyUIProject project = comfyUIProjectService.getById(projectId);
        if (project == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "项目不存在");
        }

        // 目录名 = projectId
        String dirName = sanitizeDirName(projectId);
        File baseDir = Paths.get(comfyUIConfig.getOutputDir()).toAbsolutePath().normalize().toFile();
        File projectDir = new File(baseDir, dirName);
        if (!projectDir.exists()) {
            projectDir.mkdirs();
        }

        int moved = 0, skipped = 0, errors = 0;
        Set<String> movedFiles = new HashSet<>();

        // 0. 如果存在按项目名命名的旧目录（<projectName>/），把其内容整体迁移到 <projectId>/
        String oldDirName = sanitizeDirName(project.getName());
        if (!oldDirName.equals(dirName)) {
            File oldProjectDir = new File(baseDir, oldDirName);
            if (oldProjectDir.exists() && oldProjectDir.isDirectory()) {
                File[] oldFiles = oldProjectDir.listFiles(File::isFile);
                if (oldFiles != null) {
                    for (File f : oldFiles) {
                        File dest = new File(projectDir, f.getName());
                        if (dest.exists()) {
                            skipped++;
                        } else if (f.renameTo(dest)) {
                            moved++;
                            movedFiles.add(f.getName());
                            // 同步更新 graphJson 中旧目录路径
                            String oldRef = "/api/comfyui-output/" + oldDirName + "/" + f.getName();
                            String newRef = "/api/comfyui-output/" + dirName + "/" + f.getName();
                            if (project.getGraphJson() != null && project.getGraphJson().contains(oldRef)) {
                                project.setGraphJson(project.getGraphJson().replace(oldRef, newRef));
                            }
                        } else {
                            errors++;
                        }
                    }
                }
                // 若旧目录已清空则删除
                File[] remain = oldProjectDir.listFiles();
                if (remain == null || remain.length == 0) {
                    oldProjectDir.delete();
                }
            }
        }

        // 1. 从 graphJson 中提取根目录下散落的旧文件引用并移动
        String graphJson = project.getGraphJson();
        if (StringUtils.isNotBlank(graphJson)) {
            // 匹配 /api/comfyui-output/uuid-filename.ext 格式（不含子目录的路径）
            Pattern pattern = Pattern.compile("/api/comfyui-output/([0-9a-f]{8}-[^/\"\\s]+)");
            Matcher matcher = pattern.matcher(graphJson);
            Set<String> fileNames = new HashSet<>();
            while (matcher.find()) {
                fileNames.add(matcher.group(1));
            }

            for (String fileName : fileNames) {
                File srcFile = new File(baseDir, fileName);
                File destFile = new File(projectDir, fileName);
                if (destFile.exists()) {
                    skipped++;
                } else if (srcFile.exists()) {
                    if (srcFile.renameTo(destFile)) {
                        moved++;
                        movedFiles.add(fileName);
                    } else {
                        errors++;
                    }
                } else {
                    skipped++;
                }
                // 更新 graphJson 路径
                graphJson = graphJson.replace(
                        "/api/comfyui-output/" + fileName,
                        "/api/comfyui-output/" + dirName + "/" + fileName);
            }
            project.setGraphJson(graphJson);
        }

        // 2. 移动项目根目录下所有剩余文件（mode=all 时）
        String mode = asString(request.getOrDefault("mode", "graphJson"));
        if ("all".equals(mode)) {
            File[] rootFiles = baseDir.listFiles(File::isFile);
            if (rootFiles != null) {
                for (File f : rootFiles) {
                    if (movedFiles.contains(f.getName())) continue;
                    File dest = new File(projectDir, f.getName());
                    if (!dest.exists()) {
                        if (f.renameTo(dest)) {
                            moved++;
                        } else {
                            errors++;
                        }
                    } else {
                        skipped++;
                    }
                }
            }
        }

        comfyUIProjectService.updateById(project);

        Map<String, Object> result = new HashMap<>();
        result.put("moved", moved);
        result.put("skipped", skipped);
        result.put("errors", errors);
        result.put("dirName", dirName);
        result.put("oldDirName", oldDirName);
        return ResultUtils.success(result);
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }

    /** 获取项目输出目录（以 projectId 为目录名） */
    private File getProjectDir(String projectId) {
        File baseDir = Paths.get(comfyUIConfig.getOutputDir()).toAbsolutePath().normalize().toFile();
        return new File(baseDir, sanitizeDirName(projectId));
    }

    /** 将字符串转为安全的目录名 */
    private String sanitizeDirName(String name) {
        if (StringUtils.isBlank(name)) return "unnamed";
        return name.trim().replaceAll("[\\\\/:*?\"<>|]", "_").replaceAll("\\s+", "_");
    }
}
