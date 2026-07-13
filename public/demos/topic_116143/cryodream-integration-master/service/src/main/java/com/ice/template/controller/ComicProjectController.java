package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.entity.ComicProject;
import com.ice.template.model.entity.ComfyUIProject;
import com.ice.template.service.ComicProjectService;
import com.ice.template.service.ComfyUIProjectService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 漫画项目画布接口：CRUD 漫画作品项目。
 */
@RestController
@RequestMapping("/comic/project")
@Api(tags = "漫画项目画布接口")
public class ComicProjectController {

    private static final String DEFAULT_COMIC_DATA = "{\"pages\":[]}";

    @Resource
    private ComicProjectService comicProjectService;

    @Resource
    private ComfyUIProjectService comfyUIProjectService;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @GetMapping("/list")
    @ApiOperation("漫画项目列表")
    public BaseResponse<List<ComicProject>> list() {
        return ResultUtils.success(comicProjectService.lambdaQuery()
                .orderByDesc(ComicProject::getUpdateTime)
                .list());
    }

    @PostMapping("/create")
    @ApiOperation("新建漫画项目")
    public BaseResponse<ComicProject> create(@RequestBody Map<String, Object> request) {
        String name = asString(request.get("name"));
        if (StringUtils.isBlank(name)) {
            name = "未命名漫画";
        }
        ComicProject project = new ComicProject();
        project.setName(name);
        project.setDescription(asString(request.get("description")));
        project.setCanvasWidth(asInt(request.get("canvasWidth"), 1200));
        project.setCanvasHeight(asInt(request.get("canvasHeight"), 1600));
        project.setComicData(asString(request.getOrDefault("comicData", DEFAULT_COMIC_DATA)));
        project.setSourceComfyuiProjectId(asString(request.get("sourceComfyuiProjectId")));
        comicProjectService.save(project);
        return ResultUtils.success(project);
    }

    @GetMapping("/get")
    @ApiOperation("获取漫画项目详情")
    public BaseResponse<ComicProject> get(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        ComicProject project = comicProjectService.getById(id);
        if (project == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "漫画项目不存在");
        }
        return ResultUtils.success(project);
    }

    @PostMapping("/save")
    @ApiOperation("保存漫画项目（更新 name / description / comicData / thumbnailUrl）")
    public BaseResponse<Boolean> save(@RequestBody Map<String, Object> request) {
        String id = asString(request.get("id"));
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        ComicProject project = comicProjectService.getById(id);
        if (project == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "漫画项目不存在");
        }
        String name = asString(request.get("name"));
        if (StringUtils.isNotBlank(name) && !name.equals(project.getName())) {
            project.setName(name);
        }
        if (request.containsKey("description")) {
            project.setDescription(asString(request.get("description")));
        }
        if (request.containsKey("canvasWidth")) {
            project.setCanvasWidth(asInt(request.get("canvasWidth"), project.getCanvasWidth()));
        }
        if (request.containsKey("canvasHeight")) {
            project.setCanvasHeight(asInt(request.get("canvasHeight"), project.getCanvasHeight()));
        }
        if (request.containsKey("comicData")) {
            String comicData = asString(request.get("comicData"));
            if (comicData != null) {
                project.setComicData(comicData);
            }
        }
        if (request.containsKey("thumbnailUrl")) {
            project.setThumbnailUrl(asString(request.get("thumbnailUrl")));
        }
        if (request.containsKey("sourceComfyuiProjectId")) {
            project.setSourceComfyuiProjectId(asString(request.get("sourceComfyuiProjectId")));
        }
        return ResultUtils.success(comicProjectService.updateById(project));
    }

    @PostMapping("/delete")
    @ApiOperation("删除漫画项目")
    public BaseResponse<Boolean> delete(@RequestBody Map<String, Object> request) {
        String id = asString(request.get("id"));
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        return ResultUtils.success(comicProjectService.removeById(id));
    }

    /**
     * 素材项：来自 ComfyUI 项目 AssetNode 的图片
     */
    public static class AssetItem {
        public String id;
        public String name;
        public String url;

        public AssetItem(String id, String name, String url) {
            this.id = id;
            this.name = name;
            this.url = url;
        }
    }

    @GetMapping("/list-comfyui-assets")
    @ApiOperation("获取关联 ComfyUI 项目的所有图片素材（遍历所有节点，去重）")
    public BaseResponse<List<AssetItem>> listComfyuiAssets(String projectId) {
        if (StringUtils.isBlank(projectId)) {
            return ResultUtils.success(new ArrayList<>());
        }
        ComfyUIProject project = comfyUIProjectService.getById(projectId);
        if (project == null || StringUtils.isBlank(project.getGraphJson())) {
            return ResultUtils.success(new ArrayList<>());
        }
        List<AssetItem> items = new ArrayList<>();
        Set<String> seenUrls = new HashSet<>();
        try {
            JsonNode root = OBJECT_MAPPER.readTree(project.getGraphJson());
            JsonNode nodes = root.get("nodes");
            if (nodes != null && nodes.isArray()) {
                for (JsonNode node : nodes) {
                    String nodeId = node.hasNonNull("id") ? node.get("id").asText() : "node";
                    JsonNode data = node.get("data");
                    if (data == null) continue;
                    // 节点显示名
                    String nodeName = data.hasNonNull("name") ? data.get("name").asText() : "素材";
                    // mediaKind：如果明确不是 image 则整个节点跳过（video/audio）
                    String mediaKind = data.hasNonNull("mediaKind") ? data.get("mediaKind").asText() : null;
                    if (mediaKind != null && !"image".equalsIgnoreCase(mediaKind)) continue;
                    // 收集节点内所有可能包含图片 URL 的字段
                    List<String> urls = new ArrayList<>();
                    collectImageUrls(data, urls);
                    // 记录
                    int idx = 0;
                    for (String url : urls) {
                        if (StringUtils.isBlank(url)) continue;
                        if (!isImageUrl(url)) continue;
                        if (!seenUrls.add(url)) continue; // 去重
                        String label = urls.size() > 1
                                ? nodeName + " #" + (idx + 1)
                                : nodeName;
                        items.add(new AssetItem(nodeId + "_" + idx, label, url));
                        idx++;
                    }
                }
            }
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "解析 ComfyUI 项目数据失败: " + e.getMessage());
        }
        return ResultUtils.success(items);
    }

    /**
     * 递归收集节点 data 中所有可能是图片 URL 的字段：
     * 主要来自 urls[]、baselineUrls[]、activeUrl、sourceUrl、以及 editVersions[].urls[] 等
     */
    private static void collectImageUrls(JsonNode node, List<String> out) {
        if (node == null) return;
        if (node.isTextual()) {
            String s = node.asText();
            if (isPotentialUrl(s)) out.add(s);
            return;
        }
        if (node.isArray()) {
            for (JsonNode child : node) collectImageUrls(child, out);
            return;
        }
        if (node.isObject()) {
            // 只递归可能包含图片的字段名，避免误收 prompt / description 等文本字段
            String[] urlishFieldNames = {
                    "urls", "url", "baselineUrls", "baselineUrl",
                    "activeUrl", "sourceUrl", "src", "imageUrl", "blobUrl",
                    "editVersions", "versions"
            };
            for (String field : urlishFieldNames) {
                JsonNode child = node.get(field);
                if (child != null) collectImageUrls(child, out);
            }
        }
    }

    /** 简单判断字段值是否可能是 URL（避免把普通字符串识别为 URL） */
    private static boolean isPotentialUrl(String s) {
        if (StringUtils.isBlank(s)) return false;
        return s.startsWith("http://") || s.startsWith("https://")
                || s.startsWith("/api/") || s.startsWith("blob:") || s.startsWith("data:image/");
    }

    /** 按 URL 后缀判断是否为图片 */
    private static boolean isImageUrl(String url) {
        if (StringUtils.isBlank(url)) return false;
        if (url.startsWith("data:image/")) return true;
        // 移除查询串和 hash
        int qIdx = url.indexOf('?');
        String path = qIdx >= 0 ? url.substring(0, qIdx) : url;
        int hIdx = path.indexOf('#');
        if (hIdx >= 0) path = path.substring(0, hIdx);
        String lower = path.toLowerCase(Locale.ROOT);
        return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")
                || lower.endsWith(".webp") || lower.endsWith(".gif") || lower.endsWith(".bmp")
                || lower.endsWith(".avif") || lower.endsWith(".svg");
    }

    @GetMapping("/list-comfyui-projects")
    @ApiOperation("获取所有 ComfyUI 项目（供选择关联）")
    public BaseResponse<List<Map<String, Object>>> listComfyuiProjects() {
        List<ComfyUIProject> list = comfyUIProjectService.lambdaQuery()
                .orderByDesc(ComfyUIProject::getUpdateTime)
                .list();
        List<Map<String, Object>> result = new ArrayList<>();
        for (ComfyUIProject p : list) {
            Map<String, Object> item = new java.util.HashMap<>();
            item.put("id", p.getId());
            item.put("name", p.getName());
            result.add(item);
        }
        return ResultUtils.success(result);
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private Integer asInt(Object value, Integer defaultValue) {
        if (value == null) return defaultValue;
        if (value instanceof Number) return ((Number) value).intValue();
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
