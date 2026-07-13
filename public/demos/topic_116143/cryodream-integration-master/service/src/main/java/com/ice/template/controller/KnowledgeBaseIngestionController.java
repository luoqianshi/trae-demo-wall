package com.ice.template.controller;

import cn.hutool.json.JSONObject;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.entity.Task;
import com.ice.template.rag.IngestTaskLogger;
import com.ice.template.rag.KnowledgeBaseIngestionService;
import com.ice.template.service.TaskService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/ingestion")
@Api(tags = "知识入库接口")
public class KnowledgeBaseIngestionController {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeBaseIngestionController.class);

    @Resource
    private KnowledgeBaseIngestionService ingestionService;

    @Resource
    private TaskService taskService;

    @Resource
    private IngestTaskLogger ingestTaskLogger;

    @PostMapping("/document")
    @ApiOperation("入库文档内容")
    public BaseResponse<String> ingestDocument(@RequestBody Map<String, String> request) {
        String kbId = request.get("kbId");
        String title = request.get("title");
        String content = request.get("content");
        String fileType = request.get("fileType");
        String ingestionMode = request.get("ingestionMode");

        if (isEmpty(kbId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库ID不能为空");
        }
        if (isEmpty(title)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文档标题不能为空");
        }
        if (isEmpty(content)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文档内容不能为空");
        }
        if (isEmpty(fileType)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件类型不能为空");
        }

        return ResultUtils.success(ingestionService.ingestDocument(kbId, title, content, fileType, ingestionMode));
    }

    @PostMapping("/upload")
    @ApiOperation("上传文档文件并转换为 Markdown")
    public BaseResponse<String> uploadDocument(@RequestPart("file") MultipartFile file,
                                               @RequestParam("kbId") String kbId,
                                               @RequestParam(value = "title", required = false) String title,
                                               @RequestParam(value = "ingestionMode", required = false) String ingestionMode) {
        if (isEmpty(kbId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库ID不能为空");
        }
        return ResultUtils.success(ingestionService.ingestUploadedFile(kbId, title, file, ingestionMode));
    }

    @PostMapping("/file")
    @ApiOperation("入库文件")
    public BaseResponse<String> ingestFile(@RequestBody Map<String, String> request) {
        String kbId = request.get("kbId");
        String title = request.get("title");
        String filePath = request.get("filePath");

        if (isEmpty(kbId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库ID不能为空");
        }
        if (isEmpty(title)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文档标题不能为空");
        }
        if (isEmpty(filePath)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件路径不能为空");
        }

        return ResultUtils.success(ingestionService.ingestFile(kbId, title, filePath));
    }

    @PostMapping("/url")
    @ApiOperation("解析网页 URL 并入库")
    public BaseResponse<String> ingestUrl(@RequestBody Map<String, String> request) {
        String kbId = request.get("kbId");
        String url = request.get("url");
        String title = request.get("title");
        String ingestionMode = request.get("ingestionMode");

        if (isEmpty(kbId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库ID不能为空");
        }
        if (isEmpty(url)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "网页 URL 不能为空");
        }

        return ResultUtils.success(ingestionService.ingestUrl(kbId, title, url, ingestionMode));
    }

    @PostMapping("/douyin")
    @ApiOperation("解析抖音链接并入库")
    public BaseResponse<String> ingestDouyin(@RequestBody Map<String, String> request) {
        String kbId = request.get("kbId");
        String url = request.get("url");
        String title = request.get("title");
        String ingestionMode = request.get("ingestionMode");

        if (isEmpty(kbId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库ID不能为空");
        }
        if (isEmpty(url)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "抖音链接不能为空");
        }

        return ResultUtils.success(ingestionService.ingestDouyinUrl(kbId, title, url, ingestionMode));
    }

    @PostMapping("/upload/async")
    @ApiOperation("异步上传文档文件并转换为 Markdown")
    public BaseResponse<Task> uploadDocumentAsync(@RequestPart("file") MultipartFile file,
                                                  @RequestParam("kbId") String kbId,
                                                  @RequestParam(value = "title", required = false) String title,
                                                  @RequestParam(value = "ingestionMode", required = false) String ingestionMode) {
        if (isEmpty(kbId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库ID不能为空");
        }
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "上传文件不能为空");
        }

        String originalFilename = StringUtils.defaultIfBlank(file.getOriginalFilename(), "document");
        Path stagedFile = stageAsyncUploadFile(file, originalFilename);
        JSONObject params = new JSONObject();
        params.set("kbId", kbId);
        params.set("fileName", originalFilename);
        params.set("ingestionMode", StringUtils.defaultIfBlank(ingestionMode, "none"));
        String taskId = ingestTaskLogger.start("upload_parse_ingest", "上传解析: " + originalFilename, params, "pending", 0);
        Task task = taskId != null ? taskService.getById(taskId) : null;
        if (task == null) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "创建上传解析任务失败");
        }

        CompletableFuture.runAsync(() -> {
            ingestTaskLogger.markRunning(taskId);
            try {
                String documentId = ingestionService.ingestUploadedFile(kbId, title, new StagedMultipartFile(stagedFile, originalFilename, file.getContentType()), ingestionMode, taskId);
                log.info("[uploadDocumentAsync] 任务完成: taskId={}, documentId={}", taskId, documentId);
            } catch (Exception e) {
                log.error("[uploadDocumentAsync] 任务失败: taskId={}, error={}", taskId, e.getMessage(), e);
                ingestTaskLogger.finish(taskId, "failed", null, e.getMessage());
            } finally {
                try {
                    Files.deleteIfExists(stagedFile);
                } catch (Exception e) {
                    log.warn("[uploadDocumentAsync] 删除异步暂存文件失败: file={}, error={}", stagedFile, e.getMessage());
                }
            }
        });

        return ResultUtils.success(task);
    }

    @PostMapping("/douyin/async")
    @ApiOperation("异步解析抖音链接并入库")
    public BaseResponse<Task> ingestDouyinAsync(@RequestBody Map<String, String> request) {
        String kbId = request.get("kbId");
        String url = request.get("url");
        String title = request.get("title");
        String ingestionMode = request.get("ingestionMode");

        if (isEmpty(kbId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库ID不能为空");
        }
        if (isEmpty(url)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "抖音链接不能为空");
        }

        JSONObject params = new JSONObject();
        params.set("kbId", kbId);
        params.set("sourceType", "douyin");
        params.set("url", url);
        params.set("ingestionMode", StringUtils.defaultIfBlank(ingestionMode, "none"));
        String taskId = ingestTaskLogger.start("douyin_ingest", "抖音链接转视频入库", params, "pending", 0);
        Task task = taskId != null ? taskService.getById(taskId) : null;
        if (task == null) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "创建抖音解析任务失败");
        }

        CompletableFuture.runAsync(() -> {
            ingestTaskLogger.markRunning(taskId);
            try {
                String documentId = ingestionService.ingestDouyinUrl(kbId, title, url, ingestionMode, taskId);
                log.info("[ingestDouyinAsync] 任务完成: taskId={}, documentId={}", taskId, documentId);
            } catch (Exception e) {
                log.error("[ingestDouyinAsync] 任务失败: taskId={}, error={}", taskId, e.getMessage(), e);
                ingestTaskLogger.finish(taskId, "failed", null, e.getMessage());
            }
        });

        return ResultUtils.success(task);
    }

    @PostMapping("/delete")
    @ApiOperation("删除文档及其Chunk")
    public BaseResponse<Boolean> deleteDocument(@RequestBody Map<String, String> request) {
        String documentId = request.get("documentId");

        if (isEmpty(documentId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文档ID不能为空");
        }

        ingestionService.deleteDocument(documentId);
        return ResultUtils.success(true);
    }

    @PostMapping("/cognitive")
    @ApiOperation("认知级 RAG 入库（异步任务）")
    public BaseResponse<Task> cognitiveIngest(@RequestBody Map<String, String> request) {
        String documentId = request.get("documentId");
        String modelConfigId = request.get("modelConfigId");
        String ingestionMode = request.get("ingestionMode");

        if (isEmpty(documentId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文档ID不能为空");
        }

        // 创建任务 — 根据入库模式动态设置类型和标题
        String taskType;
        String taskTitle;
        if ("thinking-model".equals(ingestionMode)) {
            taskType = "thinking_model_ingest";
            taskTitle = "思维模型入库";
        } else if ("standard".equals(ingestionMode)) {
            taskType = "standard_ingest";
            taskTitle = "普通 RAG 入库";
        } else if ("deep".equals(ingestionMode)) {
            taskType = "cognitive_ingest";
            taskTitle = "认知级 RAG 入库";
        } else {
            taskType = "tiered_ingest";
            taskTitle = "分级 RAG 入库";
        }

        Task task = new Task();
        task.setId(UUID.randomUUID().toString());
        task.setType(taskType);
        task.setCategory("knowledge_base");
        task.setStatus("pending");
        task.setProgress(0);
        task.setTitle(taskTitle);

        JSONObject params = new JSONObject();
        params.set("documentId", documentId);
        params.set("modelConfigId", modelConfigId != null ? modelConfigId : "");
        params.set("ingestionMode", ingestionMode != null ? ingestionMode : "");
        task.setParams(params.toString());

        taskService.save(task);

        // 异步执行（使用 CompletableFuture，Spring 代理对象可在新线程中使用）
        String taskId = task.getId();
        String effectiveModelConfigId = modelConfigId;
        String effectiveIngestionMode = ingestionMode;
        CompletableFuture.runAsync(() -> {
            try {
                // 更新为运行中
                Task runningTask = new Task();
                runningTask.setId(taskId);
                runningTask.setStatus("running");
                runningTask.setProgress(10);
                taskService.updateById(runningTask);

                // 执行入库
                JSONObject result = ingestionService.tieredIngestDocument(documentId, effectiveModelConfigId, effectiveIngestionMode);

                // 更新为完成
                Task completedTask = new Task();
                completedTask.setId(taskId);
                completedTask.setStatus("completed");
                completedTask.setProgress(100);
                completedTask.setResult(result.toString());
                taskService.updateById(completedTask);

                log.info("[cognitiveIngest] 任务完成: taskId={}", taskId);
            } catch (Exception e) {
                log.error("[cognitiveIngest] 任务失败: taskId={}, error={}", taskId, e.getMessage(), e);
                try {
                    Task failedTask = new Task();
                    failedTask.setId(taskId);
                    failedTask.setStatus("failed");
                    failedTask.setProgress(0);
                    failedTask.setErrorMessage(e.getMessage() != null && e.getMessage().length() > 500
                            ? e.getMessage().substring(0, 500) : e.getMessage());
                    taskService.updateById(failedTask);
                    String failedResolvedMode = "standard".equals(effectiveIngestionMode) || "deep".equals(effectiveIngestionMode) ? effectiveIngestionMode : null;
                    ingestionService.markDocumentFailed(documentId, e.getMessage(), failedResolvedMode);
                } catch (Exception ex) {
                    log.error("[cognitiveIngest] 更新失败状态也失败: taskId={}", taskId, ex);
                }
            }
        });

        return ResultUtils.success(task);
    }

    private Path stageAsyncUploadFile(MultipartFile file, String originalFilename) {
        try {
            Path dir = Paths.get("data", "async-uploads").toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String suffix = "";
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex >= 0 && dotIndex < originalFilename.length() - 1) {
                suffix = originalFilename.substring(dotIndex);
            }
            Path target = dir.resolve(UUID.randomUUID() + suffix).normalize();
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return target;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "暂存上传文件失败: " + e.getMessage());
        }
    }

    private static class StagedMultipartFile implements MultipartFile {
        private final Path path;
        private final String originalFilename;
        private final String contentType;

        private StagedMultipartFile(Path path, String originalFilename, String contentType) {
            this.path = path;
            this.originalFilename = originalFilename;
            this.contentType = contentType;
        }

        @Override
        public String getName() {
            return "file";
        }

        @Override
        public String getOriginalFilename() {
            return originalFilename;
        }

        @Override
        public String getContentType() {
            return contentType;
        }

        @Override
        public boolean isEmpty() {
            try {
                return !Files.exists(path) || Files.size(path) == 0;
            } catch (IOException e) {
                return true;
            }
        }

        @Override
        public long getSize() {
            try {
                return Files.size(path);
            } catch (IOException e) {
                return 0;
            }
        }

        @Override
        public byte[] getBytes() throws IOException {
            return Files.readAllBytes(path);
        }

        @Override
        public InputStream getInputStream() throws IOException {
            return Files.newInputStream(path);
        }

        @Override
        public void transferTo(File dest) throws IOException, IllegalStateException {
            Files.copy(path, dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private boolean isEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }
}
