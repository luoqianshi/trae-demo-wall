package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.integration.comfyui.ComfyUIClient;
import com.ice.template.model.entity.ComfyUIWorkflow;
import com.ice.template.service.ComfyUIService;
import com.ice.template.service.ComfyUIWorkflowService;
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ComfyUI 集成接口
 */
@RestController
@RequestMapping("/comfyui")
@Api(tags = "ComfyUI 集成接口")
public class ComfyUIController {

    @Resource
    private ComfyUIService comfyUIService;

    @Resource
    private ComfyUIWorkflowService comfyUIWorkflowService;

    @Resource
    private com.ice.template.service.ComfyUITaskService comfyUITaskService;

    @Resource
    private ComfyUIClient comfyUIClient;

    @GetMapping("/scan")
    @ApiOperation("扫描本地 ComfyUI 工作流目录")
    public BaseResponse<List<Map<String, String>>> scan() {
        return ResultUtils.success(comfyUIService.scanLocalWorkflows());
    }

    @PostMapping("/import")
    @ApiOperation("导入本地工作流为变量化副本（不修改原文件）")
    public BaseResponse<ComfyUIWorkflow> importWorkflow(@RequestBody Map<String, Object> request) {
        String sourcePath = asString(request.get("sourcePath"));
        if (StringUtils.isBlank(sourcePath)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "sourcePath 不能为空");
        }
        return ResultUtils.success(comfyUIService.importWorkflow(sourcePath));
    }

    @GetMapping("/list")
    @ApiOperation("已导入的变量化工作流列表")
    public BaseResponse<List<ComfyUIWorkflow>> list() {
        return ResultUtils.success(comfyUIWorkflowService.lambdaQuery()
                .orderByDesc(ComfyUIWorkflow::getCreateTime)
                .list());
    }

    @GetMapping("/get")
    @ApiOperation("获取单个工作流（含参数 schema）")
    public BaseResponse<ComfyUIWorkflow> get(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        ComfyUIWorkflow wf = comfyUIWorkflowService.getById(id);
        if (wf == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "工作流不存在");
        }
        return ResultUtils.success(wf);
    }

    @PostMapping("/update")
    @ApiOperation("更新工作流的 paramSchema 和 paramValues")
    public BaseResponse<ComfyUIWorkflow> update(@RequestBody Map<String, Object> request) {
        String id = asString(request.get("id"));
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        ComfyUIWorkflow wf = comfyUIWorkflowService.getById(id);
        if (wf == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "工作流不存在");
        }
        Object paramSchema = request.get("paramSchema");
        if (paramSchema != null) {
            wf.setParamSchema(paramSchema instanceof String ? (String) paramSchema : cn.hutool.json.JSONUtil.toJsonStr(paramSchema));
        }
        Object paramValues = request.get("paramValues");
        if (paramValues != null) {
            wf.setParamValues(paramValues instanceof String ? (String) paramValues : cn.hutool.json.JSONUtil.toJsonStr(paramValues));
        }
        String outputType = asString(request.get("outputType"));
        if (StringUtils.isNotBlank(outputType)) {
            wf.setOutputType(outputType);
        }
        comfyUIWorkflowService.updateById(wf);
        return ResultUtils.success(wf);
    }

    @PostMapping("/delete")
    @ApiOperation("删除已导入的工作流")
    public BaseResponse<Boolean> delete(@RequestBody Map<String, Object> request) {
        String id = asString(request.get("id"));
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        ComfyUIWorkflow wf = comfyUIWorkflowService.getById(id);
        if (wf == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "工作流不存在");
        }
        comfyUIWorkflowService.removeById(id);
        return ResultUtils.success(true);
    }

    @PostMapping("/run")
    @ApiOperation("执行工作流出图，返回图片可访问 URL 列表")
    @SuppressWarnings("unchecked")
    public BaseResponse<List<String>> run(@RequestBody Map<String, Object> request) {
        String id = asString(request.get("id"));
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        Map<String, Object> overrides = null;
        Object paramValues = request.get("paramValues");
        if (paramValues instanceof Map) {
            overrides = (Map<String, Object>) paramValues;
        }
        List<String> files = comfyUIService.run(id, overrides, asString(request.get("projectId")));
        List<String> urls = files.stream()
                .map(name -> "/api/comfyui-output/" + name)
                .toList();
        return ResultUtils.success(urls);
    }

    @PostMapping("/submit")
    @ApiOperation("异步提交执行，返回 taskId，通过 /progress 查询实时进度")
    @SuppressWarnings("unchecked")
    public BaseResponse<String> submit(@RequestBody Map<String, Object> request) {
        String id = asString(request.get("id"));
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "id 不能为空");
        }
        Map<String, Object> overrides = null;
        Object paramValues = request.get("paramValues");
        if (paramValues instanceof Map) {
            overrides = (Map<String, Object>) paramValues;
        }
        String taskId = comfyUITaskService.submit(id, overrides, asString(request.get("projectId")));
        return ResultUtils.success(taskId);
    }

    @GetMapping("/progress")
    @ApiOperation("查询执行进度（status/value/max/percent/urls）")
    public BaseResponse<com.ice.template.integration.comfyui.ComfyUIProgress> progress(String taskId) {
        if (StringUtils.isBlank(taskId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "taskId 不能为空");
        }
        com.ice.template.integration.comfyui.ComfyUIProgress p = comfyUITaskService.getProgress(taskId);
        if (p == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "任务不存在或已过期");
        }
        if ("done".equals(p.getStatus()) || "error".equals(p.getStatus())) {
            comfyUITaskService.remove(taskId);
        }
        return ResultUtils.success(p);
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private String extractOutputImageName(String url) {
        String localPrefix = "/api/comfyui-output/";
        int outIdx = url.indexOf(localPrefix);
        if (url.startsWith(localPrefix) || outIdx >= 0) {
            String name = outIdx >= 0
                    ? url.substring(outIdx + localPrefix.length())
                    : url.substring(localPrefix.length());
            int q = name.indexOf('?');
            if (q >= 0) name = name.substring(0, q);
            int hash = name.indexOf('#');
            if (hash >= 0) name = name.substring(0, hash);
            return java.net.URLDecoder.decode(name, StandardCharsets.UTF_8);
        }
        return null;
    }

    @PostMapping("/upload-image")
    @ApiOperation("上传图片到画布项目目录（返回 {name, subfolder, type, url}）")
    public BaseResponse<Map<String, Object>> uploadImage(@RequestParam("file") MultipartFile file,
                                                         @RequestParam(value = "projectId", required = false) String projectId) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件不能为空");
        }
        try {
            JSONObject resp = saveInputFile(file.getBytes(), file.getOriginalFilename(), "upload.png", projectId);
            Map<String, Object> result = new HashMap<>();
            result.put("name", resp.getStr("name"));
            result.put("subfolder", StringUtils.defaultString(resp.getStr("subfolder"), ""));
            result.put("type", StringUtils.defaultString(resp.getStr("type"), "input"));
            result.put("url", resp.getStr("url"));
            return ResultUtils.success(result);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "读取文件失败: " + e.getMessage());
        }
    }

    @PostMapping(value = "/upload-video", consumes = "multipart/form-data")
    @ApiOperation("上传视频到画布项目目录（返回 {name, subfolder, type, url}）")
    public BaseResponse<Map<String, Object>> uploadVideo(@RequestParam("file") MultipartFile file,
                                                        @RequestParam(value = "projectId", required = false) String projectId) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件不能为空");
        }
        try {
            JSONObject resp = saveInputFile(file.getBytes(), file.getOriginalFilename(), "upload.mp4", projectId);
            Map<String, Object> result = new HashMap<>();
            result.put("name", resp.getStr("name"));
            result.put("subfolder", StringUtils.defaultString(resp.getStr("subfolder"), ""));
            result.put("type", StringUtils.defaultString(resp.getStr("type"), "input"));
            result.put("url", resp.getStr("url"));
            return ResultUtils.success(result);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "读取文件失败: " + e.getMessage());
        }
    }

    @GetMapping("/input-file")
    @ApiOperation("读取 ComfyUI input 文件用于前端回显")
    public ResponseEntity<byte[]> inputFile(@RequestParam("filename") String filename,
                                            @RequestParam(value = "type", required = false, defaultValue = "input") String type,
                                            @RequestParam(value = "subfolder", required = false, defaultValue = "") String subfolder) {
        if (StringUtils.isBlank(filename) || filename.contains("..") || filename.startsWith("/") || filename.startsWith("\\")) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件名非法");
        }
        Path localFile = resolveInputFile(filename, subfolder);
        byte[] bytes;
        Path cacheFile = resolveCachedInputFile(filename, subfolder);
        if (cacheFile != null && Files.exists(cacheFile) && Files.isRegularFile(cacheFile)) {
            try {
                bytes = Files.readAllBytes(cacheFile);
            } catch (IOException e) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "读取缓存 input 文件失败: " + e.getMessage());
            }
        } else if (localFile != null && Files.exists(localFile) && Files.isRegularFile(localFile)) {
            try {
                bytes = Files.readAllBytes(localFile);
            } catch (IOException e) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "读取本地 input 文件失败: " + e.getMessage());
            }
        } else {
            String baseUrl = StringUtils.removeEnd(comfyUIConfig.getBaseUrl(), "/");
            String viewUrl = baseUrl + "/view?filename=" + HttpUtil.encodeParams(filename, StandardCharsets.UTF_8)
                    + "&type=" + HttpUtil.encodeParams(StringUtils.defaultString(type, "input"), StandardCharsets.UTF_8)
                    + "&subfolder=" + HttpUtil.encodeParams(StringUtils.defaultString(subfolder, ""), StandardCharsets.UTF_8);
            bytes = HttpUtil.downloadBytes(viewUrl);
            if (bytes == null || bytes.length == 0) {
                throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "ComfyUI input 文件不存在");
            }
        }
        String contentType;
        try {
            contentType = Files.probeContentType(Paths.get(filename));
        } catch (IOException e) {
            contentType = null;
        }
        if (StringUtils.isBlank(contentType)) {
            contentType = "application/octet-stream";
        }
        return ResponseEntity.ok().header("Content-Type", contentType).body(bytes);
    }

    /**
     * 保存上传的输入/素材文件。
     * - 若 projectId 非空：落到 <outputDir>/<projectId>/，返回 URL 前缀 /api/comfyui-output/<projectId>/
     * - 若 projectId 为空：兼容旧行为，落到 <inputCacheDir>/，返回 URL 前缀 /api/comfyui/input-file
     * 统一由 canvas/<projectId>/ 承载「一个画布一份文件」。
     */
    private JSONObject saveInputFile(byte[] bytes, String originalFilename, String fallbackName, String projectId) {
        String safeName = uniqueUploadFilename(StringUtils.defaultIfBlank(originalFilename, fallbackName));
        Path root;
        String url;
        if (StringUtils.isNotBlank(projectId)) {
            if (StringUtils.isBlank(comfyUIConfig.getOutputDir())) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "ComfyUI 输出目录未配置");
            }
            String dirName = sanitizeProjectDir(projectId);
            root = Paths.get(comfyUIConfig.getOutputDir()).toAbsolutePath().normalize().resolve(dirName);
            url = "/api/comfyui-output/" + dirName + "/" + safeName;
        } else {
            if (StringUtils.isBlank(comfyUIConfig.getInputCacheDir())) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "ComfyUI input 缓存目录未配置");
            }
            root = Paths.get(comfyUIConfig.getInputCacheDir()).toAbsolutePath().normalize();
            url = null;
        }
        Path target = root.resolve(safeName).normalize();
        if (!target.startsWith(root)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件名非法");
        }
        try {
            Files.createDirectories(root);
            Files.write(target, bytes);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "保存文件失败: " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
        JSONObject resp = new JSONObject();
        resp.set("name", safeName);
        resp.set("subfolder", "");
        resp.set("type", "input");
        if (url != null) {
            resp.set("url", url);
        }
        return resp;
    }

    /** 兼容旧调用签名（无 projectId），沿用 input 缓存目录 */
    private JSONObject saveInputFile(byte[] bytes, String originalFilename, String fallbackName) {
        return saveInputFile(bytes, originalFilename, fallbackName, null);
    }

    /** projectId 目录名清洗（保留字母数字下划线连字符点） */
    private String sanitizeProjectDir(String projectId) {
        String s = projectId.trim().replaceAll("[\\\\/:*?\"<>|]", "_").replaceAll("\\s+", "_");
        return StringUtils.isBlank(s) ? "unnamed" : s;
    }

    private String uniqueUploadFilename(String filename) {
        String safe = sanitizeFilename(filename);
        int dot = safe.lastIndexOf('.');
        String base = dot > 0 ? safe.substring(0, dot) : safe;
        String ext = dot > 0 ? safe.substring(dot) : "";
        return "trae-upload-" + System.currentTimeMillis() + "-" + base + ext;
    }

    private String sanitizeFilename(String filename) {
        String name = Paths.get(filename).getFileName().toString();
        name = name.replaceAll("[\\\\/:*?\"<>|]", "_");
        if (StringUtils.isBlank(name)) {
            return "upload.bin";
        }
        return name;
    }

    private Path resolveInputFile(String filename, String subfolder) {
        if (StringUtils.isBlank(comfyUIConfig.getInputDir())) {
            return null;
        }
        Path inputRoot = Paths.get(comfyUIConfig.getInputDir()).toAbsolutePath().normalize();
        Path target = StringUtils.isBlank(subfolder)
                ? inputRoot.resolve(filename).normalize()
                : inputRoot.resolve(subfolder).resolve(filename).normalize();
        if (!target.startsWith(inputRoot)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件路径非法");
        }
        return target;
    }

    private Path resolveCachedInputFile(String filename, String subfolder) {
        if (StringUtils.isBlank(comfyUIConfig.getInputCacheDir())) {
            return null;
        }
        Path inputRoot = Paths.get(comfyUIConfig.getInputCacheDir()).toAbsolutePath().normalize();
        Path target = StringUtils.isBlank(subfolder)
                ? inputRoot.resolve(filename).normalize()
                : inputRoot.resolve(subfolder).resolve(filename).normalize();
        if (!target.startsWith(inputRoot)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件路径非法");
        }
        return target;
    }

    @Resource
    private com.ice.template.config.ComfyUIConfig comfyUIConfig;

    @PostMapping("/delete-output-image")
    @ApiOperation("删除本地 ComfyUI 输出图片")
    public BaseResponse<Boolean> deleteOutputImage(@RequestBody Map<String, Object> request) {
        String url = asString(request.get("url"));
        if (StringUtils.isBlank(url)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "url 不能为空");
        }
        String name = extractOutputImageName(url);
        if (StringUtils.isBlank(name)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "仅支持删除 /api/comfyui-output/ 下的本地图片");
        }
        if (name.contains("..") || name.startsWith("/") || name.startsWith("\\\\")) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片路径非法");
        }
        try {
            Path outputRoot = Paths.get(comfyUIConfig.getOutputDir()).toAbsolutePath().normalize();
            Path target = outputRoot.resolve(name).normalize();
            if (!target.startsWith(outputRoot)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片路径非法");
            }
            if (!Files.exists(target) || !Files.isRegularFile(target)) {
                return ResultUtils.success(true);
            }
            Files.delete(target);
            return ResultUtils.success(true);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "删除本地图片失败: " + e.getMessage());
        }
    }

    @PostMapping("/upload-image-from-url")
    @ApiOperation("将远程 URL 的图片上传到 ComfyUI input 目录")
    public BaseResponse<Map<String, Object>> uploadImageFromUrl(@RequestBody Map<String, Object> request) {
        String url = asString(request.get("url"));
        if (StringUtils.isBlank(url)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "url 不能为空");
        }
        byte[] bytes;
        String fileName;
        // 相对路径或本地静态资源 URL：直接从输出目录读取磁盘文件，避免反向 HTTP 调用自身
        String localPrefix = "/api/comfyui-output/";
        int outIdx = url.indexOf(localPrefix);
        if (url.startsWith("/api/comfyui-output/") || outIdx >= 0) {
            String name = outIdx >= 0
                    ? url.substring(outIdx + localPrefix.length())
                    : url.substring(localPrefix.length());
            int q = name.indexOf('?');
            if (q >= 0) name = name.substring(0, q);
            String outputDir = comfyUIConfig.getOutputDir();
            java.io.File f = new java.io.File(outputDir, name);
            if (!f.exists() || !f.isFile()) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "本地图片不存在: " + f.getAbsolutePath());
            }
            try {
                bytes = java.nio.file.Files.readAllBytes(f.toPath());
            } catch (IOException e) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "读取本地图片失败: " + e.getMessage());
            }
            fileName = name;
        } else if (url.startsWith("http://") || url.startsWith("https://")) {
            bytes = HttpUtil.downloadBytes(url);
            if (bytes == null || bytes.length == 0) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "下载图片失败");
            }
            fileName = url.substring(url.lastIndexOf('/') + 1);
            int q = fileName.indexOf('?');
            if (q >= 0) fileName = fileName.substring(0, q);
        } else {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "url 必须是 http(s) 绝对地址或 /api/comfyui-output/ 路径");
        }
        if (StringUtils.isBlank(fileName)) {
            fileName = "upload.png";
        }
        JSONObject resp = comfyUIClient.uploadImage(bytes, fileName);
        Map<String, Object> result = new HashMap<>();
        result.put("name", resp.getStr("name"));
        result.put("subfolder", StringUtils.defaultString(resp.getStr("subfolder"), ""));
        result.put("type", StringUtils.defaultString(resp.getStr("type"), "input"));
        return ResultUtils.success(result);
    }
}
