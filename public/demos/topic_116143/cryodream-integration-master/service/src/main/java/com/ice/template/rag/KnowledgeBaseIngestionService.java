package com.ice.template.rag;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.integration.llm.SiliconFlowEmbeddingClient;
import com.ice.template.rag.douyin.DouyinDownloadResult;
import com.ice.template.rag.douyin.DouyinVideoDownloadService;
import com.ice.template.model.dto.knowledge.DocumentAddRequest;
import com.ice.template.model.dto.knowledge.DocumentUpdateRequest;
import com.ice.template.model.entity.KnowledgeBase;
import com.ice.template.model.entity.KnowledgeChunk;
import com.ice.template.model.entity.KnowledgeDocument;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.model.entity.WorkflowTemplate;
import com.ice.template.service.KnowledgeBaseService;
import com.ice.template.service.KnowledgeChunkService;
import com.ice.template.service.KnowledgeDocumentService;
import com.ice.template.service.ModelConfigService;
import com.ice.template.service.WorkflowTemplateService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ice.template.model.entity.KnowledgeEvent;
import com.ice.template.service.KnowledgeEventService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
public class KnowledgeBaseIngestionService {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeBaseIngestionService.class);

    @Resource
    private DocumentParser documentParser;

    @Resource
    private GlobalMetadataExtractor metadataExtractor;

    @Resource
    private IntelligentSemanticChunker intelligentChunker;

    @Resource
    private SemanticChunker semanticChunker;

    @Resource
    private PGVectorClient vectorClient;

    @Resource
    private SiliconFlowEmbeddingClient embeddingClient;

    @Resource
    private KnowledgeBaseService knowledgeBaseService;

    @Resource
    private KnowledgeDocumentService documentService;

    @Resource
    private KnowledgeChunkService chunkService;

    @Resource
    private ModelConfigService modelConfigService;

    @Resource
    private WorkflowTemplateService workflowTemplateService;

    @Resource
    private IngestTaskLogger ingestTaskLogger;

    @Resource
    private com.ice.template.rag.web.WebExtractChain webExtractChain;

    @Resource
    private com.ice.template.executor.FlowGraphExecutor flowGraphExecutor;

    private static final String STANDARD_RAG_TEMPLATE_ID = "tpl-standard-rag-ingestion";
    private static final String TIERED_RAG_TEMPLATE_ID = "tpl-tiered-rag-ingestion";
    private static final String COGNITIVE_RAG_TEMPLATE_ID = "tpl-cognitive-rag-ingestion";
    private static final String THINKING_MODEL_TEMPLATE_ID = "tpl-thinking-model-ingestion";
    private static final String EVENT_TEMPLATE_ID = "tpl-event-ingestion";
    private static final String CASE_TEMPLATE_ID = "tpl-case-ingestion";
    private static final String OPINION_TEMPLATE_ID = "tpl-opinion-ingestion";
    private static final String WEB_PARSE_TEMPLATE_ID = "tpl-web-parse-ingestion";
    private static final String FILE_PARSE_TEMPLATE_ID = "tpl-file-parse-ingestion";
    private static final String VIDEO_PARSE_TEMPLATE_ID = "tpl-video-parse-ingestion";
    private static final String DOUYIN_PARSE_TEMPLATE_ID = "tpl-douyin-parse-ingestion";

    @Resource
    private DouyinVideoDownloadService douyinVideoDownloadService;

    @Resource
    private Vectorizer vectorizer;

    @Resource
    private KnowledgeEventService knowledgeEventService;

    @Transactional
    public String ingestDocument(String kbId, String title, String content, String fileType) {
        return ingestDocument(kbId, title, content, fileType, null);
    }

    @Transactional
    public String ingestDocument(String kbId, String title, String content, String fileType, String ingestionMode) {
        return ingestDocument(kbId, title, content, fileType, ingestionMode, null, null);
    }

    @Transactional
    public String ingestDocument(String kbId, String title, String content, String fileType, String ingestionMode,
                                 String filePath, Long fileSize) {
        log.info("[KnowledgeBaseIngestionService] 开始入库文档: kbId={}, title={}", kbId, title);

        KnowledgeBase knowledgeBase = knowledgeBaseService.getById(kbId);
        ThrowUtils.throwIf(knowledgeBase == null, ErrorCode.NOT_FOUND_ERROR, "知识库不存在");

        String documentId = UUID.randomUUID().toString();

        DocumentAddRequest addRequest = new DocumentAddRequest();
        addRequest.setKbId(kbId);
        addRequest.setTitle(title);
        addRequest.setFileType(fileType);
        addRequest.setIngestionMode(normalizeIngestionMode(ingestionMode));
        if (StringUtils.isNotBlank(filePath)) {
            addRequest.setFilePath(filePath);
        }
        if (fileSize != null) {
            addRequest.setFileSize(fileSize);
        }
        String actualDocumentId = documentService.addDocument(addRequest);

        DocumentUpdateRequest updateRequest = new DocumentUpdateRequest();
        updateRequest.setId(actualDocumentId);
        documentId = actualDocumentId;
        updateRequest.setStatus("processing");
        documentService.updateDocument(updateRequest);

        try {
            // 解析文档内容，保存原始文本
            String parsedText = documentParser.parseContent(content, fileType);

            // 更新文档状态为已上传，保存原始文本
            updateRequest = new DocumentUpdateRequest();
            updateRequest.setId(documentId);
            updateRequest.setRawText(parsedText);
            updateRequest.setStatus("parsed");
            updateRequest.setChunkCount(0); // 分片由认知级入库工作流处理
            documentService.updateDocument(updateRequest);

            log.info("[KnowledgeBaseIngestionService] 文档上传完成: documentId={}, 原始文本长度={}", documentId, parsedText.length());
            return documentId;

        } catch (Exception e) {
            log.error("[KnowledgeBaseIngestionService] 文档入库失败: {}", e.getMessage(), e);

            DocumentUpdateRequest failedRequest = new DocumentUpdateRequest();
            failedRequest.setId(documentId);
            failedRequest.setStatus("failed");
            failedRequest.setErrorMessage(e.getMessage());
            documentService.updateDocument(failedRequest);

            throw new BusinessException(ErrorCode.OPERATION_ERROR, "文档入库失败: " + e.getMessage());
        }
    }

    @Transactional
    public String ingestUploadedFile(String kbId, String title, MultipartFile file) {
        return ingestUploadedFile(kbId, title, file, null);
    }

    @Transactional
    public String ingestUploadedFile(String kbId, String title, MultipartFile file, String ingestionMode) {
        return ingestUploadedFile(kbId, title, file, ingestionMode, null);
    }

    @Transactional
    public String ingestUploadedFile(String kbId, String title, MultipartFile file, String ingestionMode, String externalTaskId) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "上传文件不能为空");
        }
        KnowledgeBase knowledgeBase = knowledgeBaseService.getById(kbId);
        ThrowUtils.throwIf(knowledgeBase == null, ErrorCode.NOT_FOUND_ERROR, "知识库不存在");

        String originalFilename = file.getOriginalFilename();
        String fileType = getFileType(originalFilename != null ? originalFilename : "document.txt");
        List<String> allowedTypes = List.of(
                "txt", "md", "markdown", "pdf",
                // 视频/音频
                "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v",
                "wav", "mp3", "flac", "aac", "ogg", "m4a"
        );
        if (!allowedTypes.contains(fileType.toLowerCase())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "不支持的文件类型: " + fileType);
        }

        boolean isVideoOrAudio = documentParser.isVideoOrAudio(fileType);
        Path storedPath = storeKnowledgeFile(kbId, originalFilename, file);
        String effectiveTitle = StringUtils.isNotBlank(title) ? title : removeExtension(originalFilename);

        // 旁路记录一条任务日志（独立事务 + 写失败不阻断入库主流程）
        String templateId = isVideoOrAudio ? VIDEO_PARSE_TEMPLATE_ID : FILE_PARSE_TEMPLATE_ID;
        JSONObject startParams = new JSONObject();
        startParams.set("kbId", kbId);
        startParams.set("fileName", originalFilename);
        startParams.set("fileType", fileType.toLowerCase());
        startParams.set("workflowTemplateId", templateId);
        String taskId = StringUtils.isNotBlank(externalTaskId)
                ? externalTaskId
                : ingestTaskLogger.start(isVideoOrAudio ? "video_ingest" : "file_ingest",
                (isVideoOrAudio ? "视频转录入库: " : "文件入库: ") + originalFilename, startParams);

        try {
            // 优先走图驱动：视频走 tpl-video-parse-ingestion，其他走 tpl-file-parse-ingestion
            WebGraphResult graphResult = isVideoOrAudio
                    ? runVideoGraph(kbId, effectiveTitle, storedPath.toString(), file.getSize())
                    : runFileGraph(kbId, effectiveTitle, storedPath.toString(), file.getSize());
            if (graphResult != null && StringUtils.isNotBlank(graphResult.documentId())) {
                log.info("[ingestUploadedFile] 图驱动{}入库成功: file={}, documentId={}",
                        isVideoOrAudio ? "视频转录" : "文件", originalFilename, graphResult.documentId());
                ingestTaskLogger.finish(taskId, "completed",
                        buildFileResult(true, "graph", graphResult.documentId(), kbId, templateId, graphResult.steps()), null);
                return graphResult.documentId();
            }

            // 回退：图不可用时用原有内联解析逻辑（DocumentParser 兜底，支持视频/音频）
            log.warn("[ingestUploadedFile] 图驱动{}入库未成功，回退内联解析: file={}",
                    isVideoOrAudio ? "视频转录" : "文件", originalFilename);
            String documentId = legacyStoreUploadedFile(kbId, effectiveTitle, fileType, storedPath, file.getSize(), ingestionMode);
            ingestTaskLogger.finish(taskId, "completed",
                    buildFileResult(true, "fallback", documentId, kbId, templateId, null), null);
            return documentId;
        } catch (Exception e) {
            ingestTaskLogger.finish(taskId, "failed", buildFileResult(false, null, null, kbId, templateId, null), e.getMessage());
            throw e;
        }
    }

    /** 组装文件入库任务日志的 result JSON（含节点级步骤时间线）。 */
    private JSONObject buildFileResult(boolean success, String engine, String documentId, String kbId, String templateId, JSONArray steps) {
        JSONObject result = new JSONObject();
        result.set("success", success);
        result.set("engine", engine);
        result.set("documentId", documentId);
        result.set("kbId", kbId);
        result.set("workflowTemplateId", templateId);
        if (steps != null) {
            result.set("steps", steps);
        }
        return result;
    }

    /**
     * 图驱动文件入库：加载 tpl-file-parse-ingestion 模板（FileLoader → 存入知识库），
     * 注入 file_path / kb_id / title / filePath / fileSize 后整图执行。
     */
    private WebGraphResult runFileGraph(String kbId, String title, String filePath, long fileSize) {
        try {
            WorkflowTemplate template = workflowTemplateService.getById(FILE_PARSE_TEMPLATE_ID);
            if (template == null || StringUtils.isBlank(template.getGraphJson())) {
                return null;
            }
            com.ice.template.model.dto.flow.FlowGraphDTO flow =
                    JSONUtil.toBean(template.getGraphJson(), com.ice.template.model.dto.flow.FlowGraphDTO.class);
            if (flow.getNodes() == null || flow.getNodes().isEmpty()) {
                return null;
            }

            com.ice.template.executor.FlowExecutionContext context = new com.ice.template.executor.FlowExecutionContext();
            context.setRunId("file-ingest-" + System.currentTimeMillis());
            context.setStartTime(System.currentTimeMillis());
            context.setVariable("file_path", filePath);
            context.setVariable("kb_id", kbId);
            context.setVariable("filePath", filePath);
            context.setVariable("fileSize", String.valueOf(fileSize));
            if (StringUtils.isNotBlank(title)) {
                context.setVariable("title", title);
                context.setVariable("documentTitle", title);
            }

            List<com.ice.template.model.vo.flow.FlowRunStepVO> steps = flowGraphExecutor.execute(flow, null, context);
            JSONArray stepArray = buildStepArray(steps);

            Object docVar = context.getVariable("documentId");
            if (docVar == null) {
                return null;
            }
            return new WebGraphResult(String.valueOf(docVar), "file", stepArray);
        } catch (Exception e) {
            log.warn("[runFileGraph] 图驱动文件入库异常: file={}, error={}", filePath, e.getMessage());
            return null;
        }
    }

    /**
     * 图驱动视频转录入库：加载 tpl-video-parse-ingestion 模板（VideoAudioTranscriber → 存入知识库），
     * 注入 file_path / kb_id / title 后整图执行。
     */
    private WebGraphResult runVideoGraph(String kbId, String title, String filePath, long fileSize) {
        try {
            WorkflowTemplate template = workflowTemplateService.getById(VIDEO_PARSE_TEMPLATE_ID);
            if (template == null || StringUtils.isBlank(template.getGraphJson())) {
                return null;
            }
            com.ice.template.model.dto.flow.FlowGraphDTO flow =
                    JSONUtil.toBean(template.getGraphJson(), com.ice.template.model.dto.flow.FlowGraphDTO.class);
            if (flow.getNodes() == null || flow.getNodes().isEmpty()) {
                return null;
            }

            com.ice.template.executor.FlowExecutionContext context = new com.ice.template.executor.FlowExecutionContext();
            context.setRunId("video-ingest-" + System.currentTimeMillis());
            context.setStartTime(System.currentTimeMillis());
            context.setVariable("file_path", filePath);
            context.setVariable("kb_id", kbId);
            context.setVariable("filePath", filePath);
            context.setVariable("fileSize", String.valueOf(fileSize));
            if (StringUtils.isNotBlank(title)) {
                context.setVariable("title", title);
                context.setVariable("documentTitle", title);
            }

            List<com.ice.template.model.vo.flow.FlowRunStepVO> steps = flowGraphExecutor.execute(flow, null, context);
            JSONArray stepArray = buildStepArray(steps);

            Object docVar = context.getVariable("documentId");
            if (docVar == null) {
                return null;
            }
            return new WebGraphResult(String.valueOf(docVar), "video", stepArray);
        } catch (Exception e) {
            log.warn("[runVideoGraph] 图驱动视频转录入库异常: file={}, error={}", filePath, e.getMessage());
            return null;
        }
    }

    /** 回退：原有内联文件解析+存文档逻辑（图不可用时使用）。 */
    private String legacyStoreUploadedFile(String kbId, String title, String fileType, Path storedPath,
                                           long fileSize, String ingestionMode) {
        String documentId = null;
        try {
            String markdownText = documentParser.parse(storedPath.toString());
            DocumentAddRequest addRequest = new DocumentAddRequest();
            addRequest.setKbId(kbId);
            addRequest.setTitle(title);
            addRequest.setFileType(fileType.toLowerCase());
            addRequest.setFilePath(storedPath.toString());
            addRequest.setFileSize(fileSize);
            addRequest.setIngestionMode(normalizeIngestionMode(ingestionMode));
            documentId = documentService.addDocument(addRequest);

            DocumentUpdateRequest updateRequest = new DocumentUpdateRequest();
            updateRequest.setId(documentId);
            updateRequest.setRawText(markdownText);
            updateRequest.setStatus("parsed");
            updateRequest.setChunkCount(0);
            documentService.updateDocument(updateRequest);

            log.info("[KnowledgeBaseIngestionService] 文件上传完成(回退): documentId={}, filePath={}, markdownLength={}",
                    documentId, storedPath, markdownText.length());
            return documentId;
        } catch (Exception e) {
            if (StringUtils.isNotBlank(documentId)) {
                DocumentUpdateRequest failedRequest = new DocumentUpdateRequest();
                failedRequest.setId(documentId);
                failedRequest.setStatus("failed");
                failedRequest.setErrorMessage(e.getMessage());
                documentService.updateDocument(failedRequest);
            }
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "文件上传解析失败: " + e.getMessage());
        }
    }

    @Transactional
    public String ingestFile(String kbId, String title, String filePath) {
        log.info("[KnowledgeBaseIngestionService] 开始入库文件: kbId={}, title={}, filePath={}", kbId, title, filePath);

        String fileType = getFileType(filePath);
        String content = documentParser.parse(filePath);
        return ingestDocument(kbId, title, content, fileType);
    }

    /**
     * 解析网页 URL 并入库（仅解析存 rawText，复用 ingestDocument 流水线）。
     *
     * <p>通过 {@link com.ice.template.rag.web.WebExtractChain} 多方案责任链提取网页正文，
     * 拿到 Markdown 后走与文本/文件上传完全一致的后续分块、向量化流程。</p>
     */
    @Transactional
    public String ingestUrl(String kbId, String title, String url, String ingestionMode) {
        log.info("[KnowledgeBaseIngestionService] 开始入库网页: kbId={}, url={}", kbId, url);

        KnowledgeBase knowledgeBase = knowledgeBaseService.getById(kbId);
        ThrowUtils.throwIf(knowledgeBase == null, ErrorCode.NOT_FOUND_ERROR, "知识库不存在");

        // 旁路记录一条任务日志（独立事务 + 写失败不阻断入库主流程）
        JSONObject startParams = new JSONObject();
        startParams.set("kbId", kbId);
        startParams.set("url", url);
        startParams.set("workflowTemplateId", WEB_PARSE_TEMPLATE_ID);
        String taskTitle = StringUtils.isNotBlank(title) ? title : ("网页入库: " + url);
        String taskId = ingestTaskLogger.start("web_ingest", taskTitle, startParams);

        try {
            // 优先走图驱动：tpl-web-rag-ingestion（URL→jsoup→Jina→Scrapling 短路降级→存入知识库节点）
            WebGraphResult graphResult = runWebGraph(kbId, title, url);
            if (graphResult != null && StringUtils.isNotBlank(graphResult.documentId())) {
                log.info("[ingestUrl] 图驱动网页入库成功: url={}, documentId={}, via={}",
                        url, graphResult.documentId(), graphResult.via());
                ingestTaskLogger.finish(taskId, "completed",
                        buildWebResult(true, "graph", graphResult.via(), graphResult.documentId(), kbId, graphResult.steps()), null);
                return graphResult.documentId();
            }

            // 回退：图不可用时用硬编码责任链提取，再存文档
            log.warn("[ingestUrl] 图驱动网页入库未成功，回退 WebExtractChain: url={}", url);
            com.ice.template.rag.web.WebContent webContent = webExtractChain.extract(url);
            String effectiveTitle = StringUtils.isNotBlank(title)
                    ? title
                    : (StringUtils.isNotBlank(webContent.getTitle()) ? webContent.getTitle() : url);
            String documentId = ingestDocument(kbId, effectiveTitle, webContent.getMarkdown(), "md", ingestionMode);
            ingestTaskLogger.finish(taskId, "completed",
                    buildWebResult(true, "fallback", webContent.getExtractorName(), documentId, kbId, null), null);
            return documentId;
        } catch (Exception e) {
            ingestTaskLogger.finish(taskId, "failed",
                    buildWebResult(false, null, null, null, kbId, null), e.getMessage());
            throw e;
        }
    }

    /** 网页入库的图执行结果：文档 ID + 实际成功的提取方案 + 节点级步骤日志。 */
    private record WebGraphResult(String documentId, String via, JSONArray steps) {}

    @Transactional
    public String ingestDouyinUrl(String kbId, String title, String input, String ingestionMode) {
        return ingestDouyinUrl(kbId, title, input, ingestionMode, null);
    }

    @Transactional
    public String ingestDouyinUrl(String kbId, String title, String input, String ingestionMode, String externalTaskId) {
        log.info("[KnowledgeBaseIngestionService] 开始抖音链接入库: kbId={}", kbId);
        KnowledgeBase knowledgeBase = knowledgeBaseService.getById(kbId);
        ThrowUtils.throwIf(knowledgeBase == null, ErrorCode.NOT_FOUND_ERROR, "知识库不存在");

        JSONObject startParams = new JSONObject();
        startParams.set("kbId", kbId);
        startParams.set("sourceType", "douyin");
        startParams.set("workflowTemplateId", DOUYIN_PARSE_TEMPLATE_ID);
        String taskId = StringUtils.isNotBlank(externalTaskId)
                ? externalTaskId
                : ingestTaskLogger.start("douyin_ingest", "抖音链接转视频入库", startParams);
        try {
            WebGraphResult graphResult = runDouyinGraph(kbId, title, input);
            if (graphResult == null || StringUtils.isBlank(graphResult.documentId())) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "抖音链接解析工作流未生成文档");
            }
            ingestTaskLogger.finish(taskId, "completed",
                    buildFileResult(true, "douyin", graphResult.documentId(), kbId, DOUYIN_PARSE_TEMPLATE_ID, graphResult.steps()), null);
            return graphResult.documentId();
        } catch (Exception e) {
            ingestTaskLogger.finish(taskId, "failed",
                    buildFileResult(false, "douyin", null, kbId, DOUYIN_PARSE_TEMPLATE_ID, null), e.getMessage());
            throw e;
        }
    }

    private WebGraphResult runDouyinGraph(String kbId, String title, String input) {
        try {
            WorkflowTemplate template = workflowTemplateService.getById(DOUYIN_PARSE_TEMPLATE_ID);
            if (template == null || StringUtils.isBlank(template.getGraphJson())) {
                return null;
            }
            com.ice.template.model.dto.flow.FlowGraphDTO flow =
                    JSONUtil.toBean(template.getGraphJson(), com.ice.template.model.dto.flow.FlowGraphDTO.class);
            if (flow.getNodes() == null || flow.getNodes().isEmpty()) {
                return null;
            }

            com.ice.template.executor.FlowExecutionContext context = new com.ice.template.executor.FlowExecutionContext();
            context.setRunId("douyin-ingest-" + System.currentTimeMillis());
            context.setStartTime(System.currentTimeMillis());
            context.setVariable("url", input);
            context.setVariable("kb_id", kbId);
            if (StringUtils.isNotBlank(title)) {
                context.setVariable("title", title);
                context.setVariable("documentTitle", title);
            }

            List<com.ice.template.model.vo.flow.FlowRunStepVO> steps = flowGraphExecutor.execute(flow, null, context);
            JSONArray stepArray = buildStepArray(steps);
            String failedStepMessage = findFailedStepMessage(steps);
            if (StringUtils.isNotBlank(failedStepMessage)) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, failedStepMessage);
            }

            Object docVar = context.getVariable("documentId");
            if (docVar == null) {
                return null;
            }
            return new WebGraphResult(String.valueOf(docVar), "douyin", stepArray);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("[runDouyinGraph] 图驱动抖音链接入库异常: error={}", e.getMessage());
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "抖音链接解析工作流执行失败: " + e.getMessage());
        }
    }

    /** 组装网页入库任务日志的 result JSON（含节点级步骤时间线）。 */
    private JSONObject buildWebResult(boolean success, String engine, String via, String documentId,
                                      String kbId, JSONArray steps) {
        JSONObject result = new JSONObject();
        result.set("success", success);
        result.set("engine", engine);
        result.set("via", via);
        result.set("documentId", documentId);
        result.set("kbId", kbId);
        result.set("workflowTemplateId", WEB_PARSE_TEMPLATE_ID);
        if (steps != null) {
            result.set("steps", steps);
        }
        return result;
    }

    /**
     * 图驱动网页入库：加载 tpl-web-rag-ingestion 模板（URL 输入 → jsoup/Jina/Scrapling 短路降级 → 存入知识库），
     * 注入 url / kb_id / title 后整图执行。图内「存入知识库」节点完成文档级存储（status=parsed，不分块向量化）。
     *
     * @return 成功返回文档 ID + 提取方案 + 节点步骤日志；模板缺失/执行异常/未产出文档 ID 时返回 null（由调用方回退）。
     */
    private WebGraphResult runWebGraph(String kbId, String title, String url) {
        try {
            WorkflowTemplate template = workflowTemplateService.getById(WEB_PARSE_TEMPLATE_ID);
            if (template == null || StringUtils.isBlank(template.getGraphJson())) {
                return null;
            }
            com.ice.template.model.dto.flow.FlowGraphDTO flow =
                    JSONUtil.toBean(template.getGraphJson(), com.ice.template.model.dto.flow.FlowGraphDTO.class);
            if (flow.getNodes() == null || flow.getNodes().isEmpty()) {
                return null;
            }

            com.ice.template.executor.FlowExecutionContext context = new com.ice.template.executor.FlowExecutionContext();
            context.setRunId("web-ingest-" + System.currentTimeMillis());
            context.setStartTime(System.currentTimeMillis());
            context.setVariable("url", url);
            context.setVariable("kb_id", kbId);
            if (StringUtils.isNotBlank(title)) {
                context.setVariable("title", title);
            }

            List<com.ice.template.model.vo.flow.FlowRunStepVO> steps = flowGraphExecutor.execute(flow, null, context);
            JSONArray stepArray = buildStepArray(steps);

            Object docVar = context.getVariable("documentId");
            if (docVar == null) {
                return null;
            }
            Object viaVar = context.getVariable("webVia");
            return new WebGraphResult(String.valueOf(docVar), viaVar == null ? "unknown" : String.valueOf(viaVar), stepArray);
        } catch (Exception e) {
            log.warn("[runWebGraph] 图驱动网页入库异常: url={}, error={}", url, e.getMessage());
            return null;
        }
    }

    /** 把图执行返回的节点步骤精简为前端可展示的时间线 JSON（节点名/类型/状态/耗时/方案/错误）。 */
    private JSONArray buildStepArray(List<com.ice.template.model.vo.flow.FlowRunStepVO> steps) {
        JSONArray array = new JSONArray();
        if (steps == null) {
            return array;
        }
        for (com.ice.template.model.vo.flow.FlowRunStepVO step : steps) {
            JSONObject node = new JSONObject();
            node.set("nodeName", step.getNodeName());
            node.set("nodeType", step.getNodeType());
            node.set("status", step.getStatus());
            node.set("elapsedMs", step.getElapsedMs());
            if (step.getOutput() != null) {
                Object via = step.getOutput().get("via");
                if (via != null) {
                    node.set("via", via);
                }
            }
            if (StringUtils.isNotBlank(step.getErrorMessage())) {
                node.set("errorMessage", step.getErrorMessage());
            }
            array.add(node);
        }
        return array;
    }


    private String findFailedStepMessage(List<com.ice.template.model.vo.flow.FlowRunStepVO> steps) {
        if (steps == null) {
            return null;
        }
        return steps.stream()
                .filter(step -> "FAILED".equals(step.getStatus()))
                .findFirst()
                .map(step -> "节点「" + StringUtils.defaultIfBlank(step.getNodeName(), step.getNodeType()) + "」执行失败：" + step.getErrorMessage())
                .orElse(null);
    }


    private Path storeKnowledgeFile(String kbId, String originalFilename, MultipartFile file) {
        try {
            String safeFilename = sanitizeFilename(StringUtils.defaultIfBlank(originalFilename, "document.txt"));
            String storedFilename = UUID.randomUUID() + "-" + safeFilename;
            Path uploadDir = Paths.get(System.getProperty("user.dir"), "uploads", "knowledge", kbId);
            Files.createDirectories(uploadDir);
            Path targetPath = uploadDir.resolve(storedFilename).normalize();
            if (!targetPath.startsWith(uploadDir)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件名非法");
            }
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return targetPath;
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "保存文件失败: " + e.getMessage());
        }
    }

    private String sanitizeFilename(String filename) {
        return filename.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    private String removeExtension(String filename) {
        if (StringUtils.isBlank(filename)) {
            return "未命名文档";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex <= 0) {
            return filename;
        }
        return filename.substring(0, lastDotIndex);
    }

    private String getFileType(String filePath) {
        int lastDotIndex = filePath.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filePath.length() - 1) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "无法确定文件类型");
        }
        return filePath.substring(lastDotIndex + 1);
    }

    public JSONObject tieredIngestDocument(String documentId, String modelConfigId, String requestedMode) {
        KnowledgeDocument document = documentService.getById(documentId);
        ThrowUtils.throwIf(document == null, ErrorCode.NOT_FOUND_ERROR, "文档不存在");
        String mode = StringUtils.defaultIfBlank(requestedMode, document.getIngestionMode());
        mode = normalizeIngestionMode(mode);
        String resolvedMode = resolveIngestionMode(document, mode);
        DocumentUpdateRequest modeUpdate = new DocumentUpdateRequest();
        modeUpdate.setId(documentId);
        modeUpdate.setIngestionMode(mode);
        modeUpdate.setResolvedIngestionMode(resolvedMode);
        documentService.updateDocument(modeUpdate);
        if ("standard".equals(resolvedMode)) {
            String standardTemplateId = "auto".equals(mode) ? TIERED_RAG_TEMPLATE_ID : STANDARD_RAG_TEMPLATE_ID;
            return standardIngestDocument(documentId, standardTemplateId, modelConfigId);
        }
        if ("thinking-model".equals(resolvedMode)) {
            return thinkingModelIngestDocument(documentId, modelConfigId);
        }
        if ("event".equals(resolvedMode)) {
            return eventIngestDocument(documentId, modelConfigId);
        }
        if ("case".equals(resolvedMode)) {
            return caseIngestDocument(documentId, modelConfigId);
        }
        if ("opinion".equals(resolvedMode)) {
            return opinionIngestDocument(documentId, modelConfigId);
        }
        try {
            return graphIngestDocument(documentId, modelConfigId);
        } catch (Exception e) {
            log.warn("[tieredIngest] 图驱动认知级入库失败，回退硬编码流水线: documentId={}, error={}", documentId, e.getMessage());
            return cognitiveIngestDocument(documentId, modelConfigId);
        }
    }

    @Transactional
    public JSONObject standardIngestDocument(String documentId) {
        return standardIngestDocument(documentId, STANDARD_RAG_TEMPLATE_ID, null);
    }

    @Transactional
    public JSONObject standardIngestDocument(String documentId, String templateId) {
        return standardIngestDocument(documentId, templateId, null);
    }

    @Transactional
    public JSONObject standardIngestDocument(String documentId, String templateId, String runtimeModelConfigId) {
        log.info("[KnowledgeBaseIngestionService] 开始普通入库: documentId={}, templateId={}", documentId, templateId);
        KnowledgeDocument document = documentService.getById(documentId);
        ThrowUtils.throwIf(document == null, ErrorCode.NOT_FOUND_ERROR, "文档不存在");
        ThrowUtils.throwIf(StringUtils.isBlank(document.getRawText()), ErrorCode.PARAMS_ERROR, "文档内容为空");

        String kbId = document.getKbId();
        String content = document.getRawText();

        DocumentUpdateRequest updateRequest = new DocumentUpdateRequest();
        updateRequest.setId(documentId);
        updateRequest.setStatus("processing");
        updateRequest.setResolvedIngestionMode("standard");
        documentService.updateDocument(updateRequest);

        try {
            JSONObject metadata = new JSONObject();
            metadata.set("source", StringUtils.defaultIfBlank(document.getTitle(), documentId));
            metadata.set("file_type", document.getFileType());
            metadata.set("ingestion_mode", "standard");

            int chunkSize = extractIntFromTemplate(templateId, "chunk_size", 500);
            int overlapSize = extractIntFromTemplate(templateId, "overlap_size", 50);
            String modelConfigId = resolveChunkingModelConfigId(templateId, runtimeModelConfigId);
            List<KnowledgeChunk> chunks = buildStandardChunks(documentId, kbId, content, metadata, modelConfigId, chunkSize, overlapSize);

            ModelConfig embeddingConfig = resolveEmbeddingConfig(kbId, templateId);
            for (KnowledgeChunk chunk : chunks) {
                if (embeddingConfig != null) {
                    try {
                        float[] embedding = embeddingClient.embed(embeddingConfig, chunk.getChunkText());
                        chunk.setEmbedding(vectorClient.vectorToString(embedding));
                    } catch (Exception e) {
                        log.warn("[standardIngest] 生成Embedding失败: {}", e.getMessage());
                    }
                }
            }

            vectorClient.saveChunks(chunks);

            DocumentUpdateRequest completeUpdate = new DocumentUpdateRequest();
            completeUpdate.setId(documentId);
            completeUpdate.setStatus("completed");
            completeUpdate.setChunkCount(chunks.size());
            completeUpdate.setErrorMessage("");
            completeUpdate.setGlobalMetadata(metadata.toString());
            completeUpdate.setResolvedIngestionMode("standard");
            documentService.updateDocument(completeUpdate);

            KnowledgeBase knowledgeBase = knowledgeBaseService.getById(kbId);
            if (knowledgeBase != null) {
                KnowledgeBase updateKb = new KnowledgeBase();
                updateKb.setId(kbId);
                int currentCount = knowledgeBase.getChunkCount() != null ? knowledgeBase.getChunkCount() : 0;
                updateKb.setChunkCount(currentCount + chunks.size());
                knowledgeBaseService.updateById(updateKb);
            }

            JSONObject result = new JSONObject();
            result.set("chunkCount", chunks.size());
            result.set("documentId", documentId);
            result.set("status", "completed");
            result.set("resolvedIngestionMode", "standard");
            result.set("chunkMethod", metadata.getStr("chunk_method", "rule"));
            return result;
        } catch (Exception e) {
            log.error("[standardIngest] 普通入库失败: {}", e.getMessage(), e);
            DocumentUpdateRequest failedRequest = new DocumentUpdateRequest();
            failedRequest.setId(documentId);
            failedRequest.setStatus("failed");
            failedRequest.setErrorMessage(e.getMessage());
            failedRequest.setResolvedIngestionMode("standard");
            documentService.updateDocument(failedRequest);
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "普通入库失败: " + e.getMessage());
        }
    }

    public String normalizeIngestionMode(String mode) {
        if (StringUtils.isBlank(mode)) {
            return "auto";
        }
        String normalized = mode.trim().toLowerCase();
        Set<String> allowed = Set.of("standard", "deep", "auto", "none", "thinking-model", "event", "case", "opinion");
        if (!allowed.contains(normalized)) {
            return "auto";
        }
        return normalized;
    }

    private String resolveIngestionMode(KnowledgeDocument document, String mode) {
        if ("standard".equals(mode) || "deep".equals(mode) || "thinking-model".equals(mode)
                || "event".equals(mode) || "case".equals(mode) || "opinion".equals(mode)) {
            return mode;
        }
        String text = StringUtils.defaultString(document.getRawText());
        String fileType = StringUtils.defaultString(document.getFileType()).toLowerCase();
        String standardSignals = extractStringFromTemplate(TIERED_RAG_TEMPLATE_ID, "standard_signals", "API,接口,说明书,操作手册,菜单,日志,规章,制度");
        String deepSignals = extractStringFromTemplate(TIERED_RAG_TEMPLATE_ID, "deep_signals", "观点,认为,吐槽,竞品,趋势,会议纪要,行业分析,风险,机会,情绪,战略,决策");
        int deepLengthThreshold = extractIntFromTemplate(TIERED_RAG_TEMPLATE_ID, "deep_length_threshold", 4000);
        if ("md".equals(fileType) || "markdown".equals(fileType) || "txt".equals(fileType)) {
            if (text.length() < 1500 && !containsSignals(text, deepSignals)) {
                return "standard";
            }
        }
        if (containsSignals(document.getTitle() + "\n" + text, standardSignals)) {
            return "standard";
        }
        if (containsSignals(text, deepSignals)) {
            return "deep";
        }
        return text.length() > deepLengthThreshold ? "deep" : "standard";
    }

    private boolean containsSignals(String text, String signals) {
        String source = StringUtils.defaultString(text).toLowerCase();
        for (String signal : StringUtils.split(StringUtils.defaultString(signals), ',')) {
            String normalized = signal.trim().toLowerCase();
            if (StringUtils.isNotBlank(normalized) && source.contains(normalized)) {
                return true;
            }
        }
        return false;
    }

    private ModelConfig resolveEmbeddingConfig(String kbId) {
        return resolveEmbeddingConfig(kbId, TIERED_RAG_TEMPLATE_ID, COGNITIVE_RAG_TEMPLATE_ID);
    }

    private ModelConfig resolveEmbeddingConfig(String kbId, String... templateIds) {
        KnowledgeBase knowledgeBase = knowledgeBaseService.getById(kbId);
        ModelConfig embeddingConfig = null;
        if (knowledgeBase != null && StringUtils.isNotBlank(knowledgeBase.getEmbeddingModelId())) {
            embeddingConfig = modelConfigService.getById(knowledgeBase.getEmbeddingModelId());
        }
        if (embeddingConfig == null && templateIds != null && templateIds.length > 0) {
            String embeddingModelId = extractModelConfigFromTemplate("embedding_model_id", templateIds);
            if (StringUtils.isNotBlank(embeddingModelId)) {
                embeddingConfig = modelConfigService.getById(embeddingModelId);
            }
        }
        if (embeddingConfig == null) {
            embeddingConfig = modelConfigService.list().stream()
                    .filter(mc -> Integer.valueOf(1).equals(mc.getEnabled())
                            && "embedding".equalsIgnoreCase(mc.getModelType()))
                    .findFirst()
                    .orElse(null);
        }
        return embeddingConfig;
    }

    private String resolveFallbackLlmModelConfigId() {
        List<ModelConfig> enabledLlms = modelConfigService.list().stream()
                .filter(mc -> Integer.valueOf(1).equals(mc.getEnabled())
                        && isChatCompletionModel(mc)
                        && StringUtils.isNotBlank(mc.getBaseUrl()))
                .sorted((a, b) -> {
                    int apiKeyCompare = Boolean.compare(StringUtils.isBlank(a.getApiKey()), StringUtils.isBlank(b.getApiKey()));
                    if (apiKeyCompare != 0) {
                        return apiKeyCompare;
                    }
                    int typeCompare = Boolean.compare("chat".equalsIgnoreCase(b.getModelType()), "chat".equalsIgnoreCase(a.getModelType()));
                    if (typeCompare != 0) {
                        return typeCompare;
                    }
                    if (a.getCreateTime() == null && b.getCreateTime() == null) {
                        return 0;
                    }
                    if (a.getCreateTime() == null) {
                        return 1;
                    }
                    if (b.getCreateTime() == null) {
                        return -1;
                    }
                    return b.getCreateTime().compareTo(a.getCreateTime());
                })
                .collect(Collectors.toList());
        ModelConfig fallback = enabledLlms.stream().findFirst().orElse(null);
        if (fallback != null) {
            log.info("[ingest] 工作流未配置模型，自动使用可用对话模型: {} ({})", fallback.getId(), fallback.getName());
            return fallback.getId();
        }
        return null;
    }

    private boolean isChatCompletionModel(ModelConfig modelConfig) {
        if (modelConfig == null || StringUtils.isBlank(modelConfig.getModelType())) {
            return false;
        }
        return "llm".equalsIgnoreCase(modelConfig.getModelType())
                || "chat".equalsIgnoreCase(modelConfig.getModelType());
    }

    private String resolveChunkingModelConfigId(String templateId, String runtimeModelConfigId) {
        if (StringUtils.isNotBlank(runtimeModelConfigId)) {
            return runtimeModelConfigId;
        }
        String fallback = resolveFallbackLlmModelConfigId();
        if (StringUtils.isNotBlank(fallback)) {
            return fallback;
        }
        String modelConfigId = extractModelConfigFromTemplate("model_config_id", templateId);
        if (StringUtils.isNotBlank(modelConfigId)) {
            return modelConfigId;
        }
        log.warn("[standardIngest] 普通 RAG 未找到可用 LLM 模型，将回退规则分块");
        return null;
    }

    private List<KnowledgeChunk> buildStandardChunks(String documentId, String kbId, String content, JSONObject metadata, String modelConfigId, int chunkSize, int overlapSize) {
        List<KnowledgeChunk> chunks = new ArrayList<>();
        log.info("[standardIngest] >>> 开始普通 LLM 分块: 文本长度={}, modelConfigId={}", content != null ? content.length() : 0, modelConfigId);
        try {
            List<IntelligentSemanticChunker.ChunkInfo> intelligentChunks = intelligentChunker.chunkPlain(content, metadata, modelConfigId);
            if (intelligentChunks != null && !intelligentChunks.isEmpty()) {
                for (IntelligentSemanticChunker.ChunkInfo chunkInfo : intelligentChunks) {
                    KnowledgeChunk chunk = new KnowledgeChunk();
                    chunk.setId(UUID.randomUUID().toString());
                    chunk.setDocId(documentId);
                    chunk.setKbId(kbId);
                    chunk.setChunkIndex(chunkInfo.getChunkIndex());
                    chunk.setChunkText(chunkInfo.getChunkText());
                    chunk.setRawText(chunkInfo.getRawText());
                    chunk.setMetadata(chunkInfo.getMetadata());
                    chunk.setContent(chunkInfo.getChunkText());
                    chunks.add(chunk);
                }
                log.info("[standardIngest] 普通 RAG 使用 LLM 语义分块完成: {} chunks", chunks.size());
                metadata.set("chunk_method", "llm");
                return chunks;
            }
        } catch (Exception e) {
            log.error("[standardIngest] LLM 语义分块不可用，回退到规则分块: {}", e.getMessage(), e);
        }
        List<SemanticChunker.ChunkInfo> ruleChunks = semanticChunker.chunk(content, metadata, chunkSize, overlapSize);
        for (SemanticChunker.ChunkInfo chunkInfo : ruleChunks) {
            KnowledgeChunk chunk = new KnowledgeChunk();
            chunk.setId(UUID.randomUUID().toString());
            chunk.setDocId(documentId);
            chunk.setKbId(kbId);
            chunk.setChunkIndex(chunkInfo.getChunkIndex());
            chunk.setChunkText(chunkInfo.getChunkText());
            chunk.setRawText(chunkInfo.getRawText());
            chunk.setMetadata(chunkInfo.getMetadata());
            chunk.setContent(chunkInfo.getChunkText());
            chunks.add(chunk);
        }
        log.info("[standardIngest] 普通 RAG 使用规则分块回退完成: {} chunks", chunks.size());
        metadata.set("chunk_method", "rule_fallback");
        return chunks;
    }

    /**
     * 思维模型入库：文档 → 工作流模板（ObjectInput→PromptTemplate→LLM→FormatValidator→ThinkingModelWriter）
     * 跳过分块和向量化，直接提取标准化工具 JSON 落库。
     */
    @Transactional
    public JSONObject thinkingModelIngestDocument(String documentId, String modelConfigId) {
        log.info("[KnowledgeBaseIngestionService] 开始思维模型入库: documentId={}", documentId);

        KnowledgeDocument document = documentService.getById(documentId);
        ThrowUtils.throwIf(document == null, ErrorCode.NOT_FOUND_ERROR, "文档不存在");
        ThrowUtils.throwIf(StringUtils.isBlank(document.getRawText()), ErrorCode.PARAMS_ERROR, "文档内容为空");

        WorkflowTemplate template = workflowTemplateService.getById(THINKING_MODEL_TEMPLATE_ID);
        if (template == null || StringUtils.isBlank(template.getGraphJson())) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "思维模型入库工作流模板不存在，请重启后端以自动创建");
        }

        String kbId = document.getKbId();

        // 解析 LLM 模型配置
        String effectiveModelConfigId = modelConfigId;
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            effectiveModelConfigId = resolveFallbackLlmModelConfigId();
        }
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            effectiveModelConfigId = extractModelConfigFromTemplate("model_config_id", THINKING_MODEL_TEMPLATE_ID, TIERED_RAG_TEMPLATE_ID);
        }
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR,
                    "思维模型入库必须指定 LLM 模型配置，请在模型设置中配置一个带 API Key 的 LLM 模型");
        }

        // 更新文档状态
        DocumentUpdateRequest updateRequest = new DocumentUpdateRequest();
        updateRequest.setId(documentId);
        updateRequest.setStatus("processing");
        updateRequest.setResolvedIngestionMode("thinking-model");
        documentService.updateDocument(updateRequest);

        try {
            com.ice.template.model.dto.flow.FlowGraphDTO flow =
                    JSONUtil.toBean(template.getGraphJson(), com.ice.template.model.dto.flow.FlowGraphDTO.class);

            // 注入运行时值：raw_text, kb_id, model_config_id
            injectThinkingModelRuntimeValues(flow, document, effectiveModelConfigId);

            com.ice.template.executor.FlowExecutionContext context = new com.ice.template.executor.FlowExecutionContext();
            context.setRunId("tm-ingest-" + documentId);
            context.setStartTime(System.currentTimeMillis());
            context.setVariable("raw_text", document.getRawText());

            List<com.ice.template.model.vo.flow.FlowRunStepVO> steps =
                    flowGraphExecutor.execute(flow, null, context);

            com.ice.template.model.vo.flow.FlowRunStepVO failedStep = steps.stream()
                    .filter(step -> "FAILED".equals(step.getStatus()))
                    .findFirst()
                    .orElse(null);
            if (failedStep != null) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR,
                        "节点「" + failedStep.getNodeName() + "」执行失败：" + failedStep.getErrorMessage());
            }

            // 从 ThinkingModelWriter 节点读取结果
            String thinkingModelId = null;
            String thinkingModelName = null;
            for (com.ice.template.model.vo.flow.FlowRunStepVO step : steps) {
                if ("ThinkingModelWriter".equals(step.getNodeType()) && step.getOutput() != null) {
                    thinkingModelId = (String) step.getOutput().get("thinkingModelId");
                    thinkingModelName = (String) step.getOutput().get("thinkingModelName");
                }
            }

            DocumentUpdateRequest completeUpdate = new DocumentUpdateRequest();
            completeUpdate.setId(documentId);
            completeUpdate.setStatus("completed");
            completeUpdate.setErrorMessage("");
            documentService.updateDocument(completeUpdate);

            JSONObject result = new JSONObject();
            result.set("documentId", documentId);
            result.set("mode", "thinking-model");
            result.set("thinkingModelId", thinkingModelId);
            result.set("thinkingModelName", thinkingModelName);
            return result;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            DocumentUpdateRequest failUpdate = new DocumentUpdateRequest();
            failUpdate.setId(documentId);
            failUpdate.setStatus("failed");
            failUpdate.setErrorMessage(e.getMessage());
            documentService.updateDocument(failUpdate);
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "思维模型入库失败: " + e.getMessage());
        }
    }

    /**
     * 为思维模型入库工作流注入运行时值
     */
    private void injectThinkingModelRuntimeValues(com.ice.template.model.dto.flow.FlowGraphDTO flow,
                                                   KnowledgeDocument document, String modelConfigId) {
        if (flow.getNodes() == null) return;
        for (com.ice.template.model.dto.flow.FlowNodeDTO node : flow.getNodes()) {
            Map<String, Object> data = node.getData();
            if (data == null) {
                data = new java.util.HashMap<>();
                node.setData(data);
            }
            Map<String, Object> values = (Map<String, Object>) data.get("values");
            if (values == null) {
                values = new java.util.HashMap<>();
                data.put("values", values);
            }
            String nodeType = com.ice.template.executor.FlowNodeDataUtils.getNodeType(node);
            switch (nodeType) {
                case "DocumentLoader":
                    values.put("document_id", document.getId());
                    break;
                case "LanguageModel":
                    if (StringUtils.isNotBlank(modelConfigId)) {
                        values.put("model_config_id", modelConfigId);
                    }
                    break;
                case "ThinkingModelWriter":
                    values.put("raw_text", document.getRawText());
                    break;
                default:
                    break;
            }
        }
    }

    /**
     * 事件入库（工作流驱动）
     * 流程：DocumentLoader → PromptTemplate → LanguageModel → FormatValidator → EventWriter
     */
    public JSONObject eventIngestDocument(String documentId, String modelConfigId) {
        log.info("[KnowledgeBaseIngestionService] 开始事件入库: documentId={}", documentId);

        KnowledgeDocument document = documentService.getById(documentId);
        ThrowUtils.throwIf(document == null, ErrorCode.NOT_FOUND_ERROR, "文档不存在");
        ThrowUtils.throwIf(StringUtils.isBlank(document.getRawText()), ErrorCode.PARAMS_ERROR, "文档内容为空");

        WorkflowTemplate template = workflowTemplateService.getById(EVENT_TEMPLATE_ID);
        if (template == null || StringUtils.isBlank(template.getGraphJson())) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "事件入库工作流模板不存在，请重启后端以自动创建");
        }

        String kbId = document.getKbId();

        // 解析 LLM 模型配置
        String effectiveModelConfigId = modelConfigId;
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            effectiveModelConfigId = resolveFallbackLlmModelConfigId();
        }
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            effectiveModelConfigId = extractModelConfigFromTemplate("model_config_id", EVENT_TEMPLATE_ID, TIERED_RAG_TEMPLATE_ID);
        }
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR,
                    "事件入库必须指定 LLM 模型配置，请在模型设置中配置一个带 API Key 的 LLM 模型");
        }

        // 更新文档状态
        DocumentUpdateRequest updateRequest = new DocumentUpdateRequest();
        updateRequest.setId(documentId);
        updateRequest.setStatus("processing");
        updateRequest.setResolvedIngestionMode("event");
        documentService.updateDocument(updateRequest);

        try {
            com.ice.template.model.dto.flow.FlowGraphDTO flow =
                    JSONUtil.toBean(template.getGraphJson(), com.ice.template.model.dto.flow.FlowGraphDTO.class);

            // 注入运行时值
            injectEventRuntimeValues(flow, document, effectiveModelConfigId);

            com.ice.template.executor.FlowExecutionContext context = new com.ice.template.executor.FlowExecutionContext();
            context.setRunId("event-ingest-" + documentId);
            context.setStartTime(System.currentTimeMillis());
            context.setVariable("raw_text", document.getRawText());
            context.setVariable("kb_id", kbId);
            context.setVariable("doc_id", documentId);

            List<com.ice.template.model.vo.flow.FlowRunStepVO> steps =
                    flowGraphExecutor.execute(flow, null, context);

            com.ice.template.model.vo.flow.FlowRunStepVO failedStep = steps.stream()
                    .filter(step -> "FAILED".equals(step.getStatus()))
                    .findFirst()
                    .orElse(null);
            if (failedStep != null) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR,
                        "节点「" + failedStep.getNodeName() + "」执行失败：" + failedStep.getErrorMessage());
            }

            // 从 EventWriter 节点读取结果
            int savedCount = 0;
            int skippedCount = 0;
            for (com.ice.template.model.vo.flow.FlowRunStepVO step : steps) {
                if ("EventWriter".equals(step.getNodeType()) && step.getOutput() != null) {
                    Object sc = step.getOutput().get("saved_count");
                    Object sk = step.getOutput().get("skipped_count");
                    if (sc != null) savedCount = ((Number) sc).intValue();
                    if (sk != null) skippedCount = ((Number) sk).intValue();
                }
            }

            DocumentUpdateRequest completeUpdate = new DocumentUpdateRequest();
            completeUpdate.setId(documentId);
            completeUpdate.setStatus("completed");
            completeUpdate.setErrorMessage("");
            documentService.updateDocument(completeUpdate);

            JSONObject result = new JSONObject();
            result.set("documentId", documentId);
            result.set("mode", "event");
            result.set("savedCount", savedCount);
            result.set("skippedCount", skippedCount);
            return result;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            DocumentUpdateRequest failUpdate = new DocumentUpdateRequest();
            failUpdate.setId(documentId);
            failUpdate.setStatus("failed");
            failUpdate.setErrorMessage(e.getMessage());
            documentService.updateDocument(failUpdate);
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "事件入库失败: " + e.getMessage());
        }
    }

    /**
     * 为事件入库工作流注入运行时值
     */
    private void injectEventRuntimeValues(com.ice.template.model.dto.flow.FlowGraphDTO flow,
                                           KnowledgeDocument document, String modelConfigId) {
        if (flow.getNodes() == null) return;
        for (com.ice.template.model.dto.flow.FlowNodeDTO node : flow.getNodes()) {
            Map<String, Object> data = node.getData();
            if (data == null) {
                data = new java.util.HashMap<>();
                node.setData(data);
            }
            Map<String, Object> values = (Map<String, Object>) data.get("values");
            if (values == null) {
                values = new java.util.HashMap<>();
                data.put("values", values);
            }
            String nodeType = com.ice.template.executor.FlowNodeDataUtils.getNodeType(node);
            switch (nodeType) {
                case "DocumentLoader":
                    values.put("document_id", document.getId());
                    break;
                case "LanguageModel":
                    if (StringUtils.isNotBlank(modelConfigId)) {
                        values.put("model_config_id", modelConfigId);
                    }
                    break;
                case "EventWriter":
                    values.put("kb_id", document.getKbId());
                    values.put("raw_text", document.getRawText());
                    break;
                default:
                    break;
            }
        }
    }

    /**
     * 案例入库（工作流驱动）
     * 流程：DocumentLoader → PromptTemplate → LanguageModel → FormatValidator → CaseWriter
     */
    public JSONObject caseIngestDocument(String documentId, String modelConfigId) {
        log.info("[KnowledgeBaseIngestionService] 开始案例入库: documentId={}", documentId);

        KnowledgeDocument document = documentService.getById(documentId);
        ThrowUtils.throwIf(document == null, ErrorCode.NOT_FOUND_ERROR, "文档不存在");
        ThrowUtils.throwIf(StringUtils.isBlank(document.getRawText()), ErrorCode.PARAMS_ERROR, "文档内容为空");

        WorkflowTemplate template = workflowTemplateService.getById(CASE_TEMPLATE_ID);
        if (template == null || StringUtils.isBlank(template.getGraphJson())) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "案例入库工作流模板不存在，请重启后端以自动创建");
        }

        String kbId = document.getKbId();

        // 解析 LLM 模型配置
        String effectiveModelConfigId = modelConfigId;
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            effectiveModelConfigId = resolveFallbackLlmModelConfigId();
        }
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            effectiveModelConfigId = extractModelConfigFromTemplate("model_config_id", CASE_TEMPLATE_ID, TIERED_RAG_TEMPLATE_ID);
        }
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR,
                    "案例入库必须指定 LLM 模型配置，请在模型设置中配置一个带 API Key 的 LLM 模型");
        }

        // 更新文档状态
        DocumentUpdateRequest updateRequest = new DocumentUpdateRequest();
        updateRequest.setId(documentId);
        updateRequest.setStatus("processing");
        updateRequest.setResolvedIngestionMode("case");
        documentService.updateDocument(updateRequest);

        try {
            com.ice.template.model.dto.flow.FlowGraphDTO flow =
                    JSONUtil.toBean(template.getGraphJson(), com.ice.template.model.dto.flow.FlowGraphDTO.class);

            // 注入运行时值
            injectCaseRuntimeValues(flow, document, effectiveModelConfigId);

            com.ice.template.executor.FlowExecutionContext context = new com.ice.template.executor.FlowExecutionContext();
            context.setRunId("case-ingest-" + documentId);
            context.setStartTime(System.currentTimeMillis());
            context.setVariable("raw_text", document.getRawText());
            context.setVariable("kb_id", kbId);
            context.setVariable("doc_id", documentId);

            List<com.ice.template.model.vo.flow.FlowRunStepVO> steps =
                    flowGraphExecutor.execute(flow, null, context);

            com.ice.template.model.vo.flow.FlowRunStepVO failedStep = steps.stream()
                    .filter(step -> "FAILED".equals(step.getStatus()))
                    .findFirst()
                    .orElse(null);
            if (failedStep != null) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR,
                        "节点「" + failedStep.getNodeName() + "」执行失败：" + failedStep.getErrorMessage());
            }

            // 从 CaseWriter 节点读取结果
            int savedCount = 0;
            int skippedCount = 0;
            for (com.ice.template.model.vo.flow.FlowRunStepVO step : steps) {
                if ("CaseWriter".equals(step.getNodeType()) && step.getOutput() != null) {
                    Object sc = step.getOutput().get("saved_count");
                    Object sk = step.getOutput().get("skipped_count");
                    if (sc != null) savedCount = ((Number) sc).intValue();
                    if (sk != null) skippedCount = ((Number) sk).intValue();
                }
            }

            DocumentUpdateRequest completeUpdate = new DocumentUpdateRequest();
            completeUpdate.setId(documentId);
            completeUpdate.setStatus("completed");
            completeUpdate.setErrorMessage("");
            documentService.updateDocument(completeUpdate);

            JSONObject result = new JSONObject();
            result.set("documentId", documentId);
            result.set("mode", "case");
            result.set("savedCount", savedCount);
            result.set("skippedCount", skippedCount);
            return result;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            DocumentUpdateRequest failUpdate = new DocumentUpdateRequest();
            failUpdate.setId(documentId);
            failUpdate.setStatus("failed");
            failUpdate.setErrorMessage(e.getMessage());
            documentService.updateDocument(failUpdate);
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "案例入库失败: " + e.getMessage());
        }
    }

    /**
     * 为案例入库工作流注入运行时值
     */
    private void injectCaseRuntimeValues(com.ice.template.model.dto.flow.FlowGraphDTO flow,
                                           KnowledgeDocument document, String modelConfigId) {
        if (flow.getNodes() == null) return;
        for (com.ice.template.model.dto.flow.FlowNodeDTO node : flow.getNodes()) {
            Map<String, Object> data = node.getData();
            if (data == null) {
                data = new java.util.HashMap<>();
                node.setData(data);
            }
            Map<String, Object> values = (Map<String, Object>) data.get("values");
            if (values == null) {
                values = new java.util.HashMap<>();
                data.put("values", values);
            }
            String nodeType = com.ice.template.executor.FlowNodeDataUtils.getNodeType(node);
            switch (nodeType) {
                case "DocumentLoader":
                    values.put("document_id", document.getId());
                    break;
                case "LanguageModel":
                    if (StringUtils.isNotBlank(modelConfigId)) {
                        values.put("model_config_id", modelConfigId);
                    }
                    break;
                case "CaseWriter":
                    values.put("kb_id", document.getKbId());
                    break;
                default:
                    break;
            }
        }
    }

    /**
     * 观点入库（工作流驱动）
     * 流程：DocumentLoader → PromptTemplate → LanguageModel → FormatValidator → OpinionWriter
     */
    public JSONObject opinionIngestDocument(String documentId, String modelConfigId) {
        log.info("[KnowledgeBaseIngestionService] 开始观点入库: documentId={}", documentId);

        KnowledgeDocument document = documentService.getById(documentId);
        ThrowUtils.throwIf(document == null, ErrorCode.NOT_FOUND_ERROR, "文档不存在");
        ThrowUtils.throwIf(StringUtils.isBlank(document.getRawText()), ErrorCode.PARAMS_ERROR, "文档内容为空");

        WorkflowTemplate template = workflowTemplateService.getById(OPINION_TEMPLATE_ID);
        if (template == null || StringUtils.isBlank(template.getGraphJson())) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "观点入库工作流模板不存在，请重启后端以自动创建");
        }

        String kbId = document.getKbId();

        // 解析 LLM 模型配置
        String effectiveModelConfigId = modelConfigId;
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            effectiveModelConfigId = resolveFallbackLlmModelConfigId();
        }
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            effectiveModelConfigId = extractModelConfigFromTemplate("model_config_id", OPINION_TEMPLATE_ID, TIERED_RAG_TEMPLATE_ID);
        }
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR,
                    "观点入库必须指定 LLM 模型配置，请在模型设置中配置一个带 API Key 的 LLM 模型");
        }

        // 更新文档状态
        DocumentUpdateRequest updateRequest = new DocumentUpdateRequest();
        updateRequest.setId(documentId);
        updateRequest.setStatus("processing");
        updateRequest.setResolvedIngestionMode("opinion");
        documentService.updateDocument(updateRequest);

        try {
            com.ice.template.model.dto.flow.FlowGraphDTO flow =
                    JSONUtil.toBean(template.getGraphJson(), com.ice.template.model.dto.flow.FlowGraphDTO.class);

            // 注入运行时值
            injectOpinionRuntimeValues(flow, document, effectiveModelConfigId);

            com.ice.template.executor.FlowExecutionContext context = new com.ice.template.executor.FlowExecutionContext();
            context.setRunId("opinion-ingest-" + documentId);
            context.setStartTime(System.currentTimeMillis());
            context.setVariable("raw_text", document.getRawText());
            context.setVariable("kb_id", kbId);
            context.setVariable("doc_id", documentId);

            List<com.ice.template.model.vo.flow.FlowRunStepVO> steps =
                    flowGraphExecutor.execute(flow, null, context);

            com.ice.template.model.vo.flow.FlowRunStepVO failedStep = steps.stream()
                    .filter(step -> "FAILED".equals(step.getStatus()))
                    .findFirst()
                    .orElse(null);
            if (failedStep != null) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR,
                        "节点「" + failedStep.getNodeName() + "」执行失败：" + failedStep.getErrorMessage());
            }

            // 从 OpinionWriter 节点读取结果
            int savedCount = 0;
            int skippedCount = 0;
            for (com.ice.template.model.vo.flow.FlowRunStepVO step : steps) {
                if ("OpinionWriter".equals(step.getNodeType()) && step.getOutput() != null) {
                    Object sc = step.getOutput().get("saved_count");
                    Object sk = step.getOutput().get("skipped_count");
                    if (sc != null) savedCount = ((Number) sc).intValue();
                    if (sk != null) skippedCount = ((Number) sk).intValue();
                }
            }

            DocumentUpdateRequest completeUpdate = new DocumentUpdateRequest();
            completeUpdate.setId(documentId);
            completeUpdate.setStatus("completed");
            completeUpdate.setErrorMessage("");
            documentService.updateDocument(completeUpdate);

            JSONObject result = new JSONObject();
            result.set("documentId", documentId);
            result.set("mode", "opinion");
            result.set("savedCount", savedCount);
            result.set("skippedCount", skippedCount);
            return result;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            DocumentUpdateRequest failUpdate = new DocumentUpdateRequest();
            failUpdate.setId(documentId);
            failUpdate.setStatus("failed");
            failUpdate.setErrorMessage(e.getMessage());
            documentService.updateDocument(failUpdate);
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "观点入库失败: " + e.getMessage());
        }
    }

    /**
     * 为观点入库工作流注入运行时值
     */
    private void injectOpinionRuntimeValues(com.ice.template.model.dto.flow.FlowGraphDTO flow,
                                              KnowledgeDocument document, String modelConfigId) {
        if (flow.getNodes() == null) return;
        for (com.ice.template.model.dto.flow.FlowNodeDTO node : flow.getNodes()) {
            Map<String, Object> data = node.getData();
            if (data == null) {
                data = new java.util.HashMap<>();
                node.setData(data);
            }
            Map<String, Object> values = (Map<String, Object>) data.get("values");
            if (values == null) {
                values = new java.util.HashMap<>();
                data.put("values", values);
            }
            String nodeType = com.ice.template.executor.FlowNodeDataUtils.getNodeType(node);
            switch (nodeType) {
                case "DocumentLoader":
                    values.put("document_id", document.getId());
                    break;
                case "LanguageModel":
                    if (StringUtils.isNotBlank(modelConfigId)) {
                        values.put("model_config_id", modelConfigId);
                    }
                    break;
                case "OpinionWriter":
                    values.put("kb_id", document.getKbId());
                    break;
                default:
                    break;
            }
        }
    }

    public JSONObject graphIngestDocument(String documentId, String modelConfigId) {
        log.info("[KnowledgeBaseIngestionService] 开始图驱动认知级入库: documentId={}", documentId);

        KnowledgeDocument document = documentService.getById(documentId);
        ThrowUtils.throwIf(document == null, ErrorCode.NOT_FOUND_ERROR, "文档不存在");
        ThrowUtils.throwIf(StringUtils.isBlank(document.getRawText()), ErrorCode.PARAMS_ERROR, "文档内容为空");

        WorkflowTemplate template = workflowTemplateService.getById(COGNITIVE_RAG_TEMPLATE_ID);
        if (template == null || StringUtils.isBlank(template.getGraphJson())) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "认知级入库工作流模板不存在");
        }

        String kbId = document.getKbId();

        String effectiveModelConfigId = modelConfigId;
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            effectiveModelConfigId = resolveFallbackLlmModelConfigId();
        }
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            effectiveModelConfigId = extractModelConfigFromTemplate("model_config_id", COGNITIVE_RAG_TEMPLATE_ID, TIERED_RAG_TEMPLATE_ID);
        }
        if (StringUtils.isBlank(effectiveModelConfigId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR,
                    "未指定聊天模型配置，请在系统工作流页面（/system-workflows/cognitive-rag）中选择模型，或在模型设置中配置一个带 API Key 的 LLM 模型");
        }

        // 解析嵌入模型：知识库配置 > 模板字段（保持与硬编码一致，注入到 Writer 节点）
        String effectiveEmbeddingModelId = null;
        KnowledgeBase knowledgeBase = knowledgeBaseService.getById(kbId);
        if (knowledgeBase != null && StringUtils.isNotBlank(knowledgeBase.getEmbeddingModelId())) {
            effectiveEmbeddingModelId = knowledgeBase.getEmbeddingModelId();
        }
        if (StringUtils.isBlank(effectiveEmbeddingModelId)) {
            effectiveEmbeddingModelId = extractModelConfigFromTemplate("embedding_model_id", COGNITIVE_RAG_TEMPLATE_ID);
        }

        // 更新文档状态为处理中
        DocumentUpdateRequest updateRequest = new DocumentUpdateRequest();
        updateRequest.setId(documentId);
        updateRequest.setStatus("processing");
        updateRequest.setResolvedIngestionMode("deep");
        documentService.updateDocument(updateRequest);

        try {
            com.ice.template.model.dto.flow.FlowGraphDTO flow =
                    JSONUtil.toBean(template.getGraphJson(), com.ice.template.model.dto.flow.FlowGraphDTO.class);

            // 注入运行时上下文到对应节点的 data.values（优先级最高，覆盖画布静态值）
            injectRuntimeValues(flow, documentId, kbId, effectiveModelConfigId, effectiveEmbeddingModelId);

            com.ice.template.executor.FlowExecutionContext context = new com.ice.template.executor.FlowExecutionContext();
            context.setRunId("ingest-" + documentId);
            context.setStartTime(System.currentTimeMillis());

            List<com.ice.template.model.vo.flow.FlowRunStepVO> steps =
                    flowGraphExecutor.execute(flow, null, context);

            com.ice.template.model.vo.flow.FlowRunStepVO failedStep = steps.stream()
                    .filter(step -> "FAILED".equals(step.getStatus()))
                    .findFirst()
                    .orElse(null);
            if (failedStep != null) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR,
                        "节点「" + failedStep.getNodeName() + "」执行失败：" + failedStep.getErrorMessage());
            }

            // 从 Writer 节点输出读取写入的 chunk 数量
            int chunkCount = 0;
            for (com.ice.template.model.vo.flow.FlowRunStepVO step : steps) {
                if ("KnowledgeBaseWriter".equals(step.getNodeType()) && step.getOutput() != null) {
                    Object cc = step.getOutput().get("chunkCount");
                    if (cc instanceof Number) {
                        chunkCount = ((Number) cc).intValue();
                    }
                }
            }

            // 保存全局元数据到文档（若图执行过程中生成）
            String globalMetadata = (String) context.getVariable("globalMetadata");
            DocumentUpdateRequest completeUpdate = new DocumentUpdateRequest();
            completeUpdate.setId(documentId);
            completeUpdate.setStatus("completed");
            completeUpdate.setChunkCount(chunkCount);
            completeUpdate.setErrorMessage("");
            completeUpdate.setResolvedIngestionMode("deep");
            if (StringUtils.isNotBlank(globalMetadata)) {
                completeUpdate.setGlobalMetadata(globalMetadata);
            }
            documentService.updateDocument(completeUpdate);

            if (knowledgeBase != null) {
                KnowledgeBase updateKb = new KnowledgeBase();
                updateKb.setId(kbId);
                int currentCount = knowledgeBase.getChunkCount() != null ? knowledgeBase.getChunkCount() : 0;
                updateKb.setChunkCount(currentCount + chunkCount);
                knowledgeBaseService.updateById(updateKb);
            }

            JSONObject result = new JSONObject();
            result.set("chunkCount", chunkCount);
            result.set("documentId", documentId);
            result.set("status", "completed");
            result.set("engine", "graph");
            log.info("[graphIngest] 图驱动认知级入库完成: documentId={}, chunks={}", documentId, chunkCount);
            return result;
        } catch (Exception e) {
            log.error("[graphIngest] 图驱动认知级入库失败: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "图驱动认知级入库失败: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private void injectRuntimeValues(com.ice.template.model.dto.flow.FlowGraphDTO flow,
                                     String documentId, String kbId,
                                     String fallbackModelConfigId, String fallbackEmbeddingModelId) {
        if (flow.getNodes() == null) {
            return;
        }
        for (com.ice.template.model.dto.flow.FlowNodeDTO node : flow.getNodes()) {
            Map<String, Object> data = node.getData();
            if (data == null) {
                data = new java.util.HashMap<>();
                node.setData(data);
            }
            Map<String, Object> values = (Map<String, Object>) data.get("values");
            if (values == null) {
                values = new java.util.HashMap<>();
                data.put("values", values);
            }
            String nodeType = com.ice.template.executor.FlowNodeDataUtils.getNodeType(node);
            switch (nodeType) {
                case "DocumentLoader":
                    values.put("document_id", documentId);
                    break;
                case "GlobalMetadataExtractor":
                case "IntelligentSemanticChunker":
                    if (StringUtils.isNotBlank(fallbackModelConfigId)) {
                        values.put("model_config_id", fallbackModelConfigId);
                    }
                    break;
                case "KnowledgeBaseWriter":
                    values.put("kb_id", kbId);
                    values.put("doc_id", documentId);
                    if (StringUtils.isBlank(com.ice.template.executor.FlowNodeDataUtils.getTemplateString(node, "embedding_model_id"))
                            && StringUtils.isNotBlank(fallbackEmbeddingModelId)) {
                        values.put("embedding_model_id", fallbackEmbeddingModelId);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    @Transactional
    public JSONObject cognitiveIngestDocument(String documentId, String modelConfigId) {
        log.info("[KnowledgeBaseIngestionService] 开始认知级入库: documentId={}", documentId);
        KnowledgeDocument document = documentService.getById(documentId);
        ThrowUtils.throwIf(document == null, ErrorCode.NOT_FOUND_ERROR, "文档不存在");
        ThrowUtils.throwIf(StringUtils.isBlank(document.getRawText()), ErrorCode.PARAMS_ERROR, "文档内容为空");

        String kbId = document.getKbId();
        String content = document.getRawText();

        // 1. 更新文档状态为处理中
        DocumentUpdateRequest updateRequest = new DocumentUpdateRequest();
        updateRequest.setId(documentId);
        updateRequest.setStatus("processing");
        updateRequest.setResolvedIngestionMode("deep");
        documentService.updateDocument(updateRequest);

        try {
            JSONObject result = new JSONObject();

            // 2. 获取聊天模型配置：优先使用传入的 modelConfigId，否则从工作流模板读取，仍为空则自动兜底可用 LLM
            String effectiveModelConfigId = modelConfigId;
            if (StringUtils.isBlank(effectiveModelConfigId)) {
                effectiveModelConfigId = resolveFallbackLlmModelConfigId();
            }
            if (StringUtils.isBlank(effectiveModelConfigId)) {
                effectiveModelConfigId = extractModelConfigFromTemplate("model_config_id", COGNITIVE_RAG_TEMPLATE_ID, TIERED_RAG_TEMPLATE_ID);
            }
            if (StringUtils.isBlank(effectiveModelConfigId)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR,
                        "未指定聊天模型配置，请在系统工作流页面（/system-workflows/cognitive-rag）中选择模型，或在模型设置中配置一个带 API Key 的 LLM 模型");
            }
            log.info("[cognitiveIngest] 使用聊天模型配置: {}", effectiveModelConfigId);

            // 3. 全局元数据提取
            JSONObject rawMetadata = metadataExtractor.extract(content, effectiveModelConfigId);
            JSONObject globalMetadata = metadataExtractor.build3DMetadata(rawMetadata);
            result.set("metadata", globalMetadata);

            // 保存元数据到文档
            DocumentUpdateRequest metaUpdate = new DocumentUpdateRequest();
            metaUpdate.setId(documentId);
            metaUpdate.setGlobalMetadata(globalMetadata.toString());
            documentService.updateDocument(metaUpdate);

            // 4. 智能语义分块（使用 LLM 识别语义边界，带元数据附加）
            List<IntelligentSemanticChunker.ChunkInfo> intelligentChunks = intelligentChunker.chunk(content, globalMetadata, effectiveModelConfigId);
            List<KnowledgeChunk> chunks = new ArrayList<>();
            Map<String, String> parentIdMap = new java.util.HashMap<>();
            for (IntelligentSemanticChunker.ChunkInfo chunkInfo : intelligentChunks) {
                KnowledgeChunk chunk = new KnowledgeChunk();
                chunk.setId(UUID.randomUUID().toString());
                chunk.setChunkIndex(chunkInfo.getChunkIndex());
                chunk.setChunkText(chunkInfo.getChunkText());
                chunk.setRawText(chunkInfo.getRawText());
                chunk.setContent(chunkInfo.getChunkText());
                chunk.setMetadata(chunkInfo.getMetadata());
                chunk.setEvents(chunkInfo.getEvents());
                chunk.setChunkLevel(StringUtils.defaultIfBlank(chunkInfo.getChunkLevel(), "child"));
                if ("parent".equals(chunk.getChunkLevel())) {
                    parentIdMap.put(chunkInfo.getParentLocalId(), chunk.getId());
                }
                chunks.add(chunk);
            }

            for (int i = 0; i < chunks.size(); i++) {
                KnowledgeChunk chunk = chunks.get(i);
                IntelligentSemanticChunker.ChunkInfo chunkInfo = intelligentChunks.get(i);
                if ("child".equals(chunk.getChunkLevel())) {
                    chunk.setParentId(parentIdMap.get(chunkInfo.getParentLocalId()));
                }
            }

            // 防御性校验：如果所有 chunk 都是 child 且无 parentId，自动合成父块包裹
            boolean hasParent = chunks.stream().anyMatch(c -> "parent".equals(c.getChunkLevel()));
            if (!hasParent && !chunks.isEmpty()) {
                log.warn("[cognitiveIngest] 未发现父块，自动合成父块包裹 {} 个子块", chunks.size());
                StringBuilder summaryBuilder = new StringBuilder();
                summaryBuilder.append("本段共包含").append(chunks.size()).append("个语义段落。");
                for (int i = 0; i < chunks.size(); i++) {
                    String childSummary = "";
                    try {
                        JSONObject meta = JSONUtil.parseObj(chunks.get(i).getMetadata());
                        JSONObject epist = meta.getJSONObject("3_Epistemology_Tag");
                        if (epist != null) childSummary = epist.getStr("chunk_summary", "");
                    } catch (Exception ignored) {}
                    if (StringUtils.isNotBlank(childSummary)) {
                        summaryBuilder.append(childSummary).append("（详见子块").append(i + 1).append("）；");
                    }
                }
                String parentSummary = summaryBuilder.toString();
                StringBuilder parentRawText = new StringBuilder();
                for (KnowledgeChunk c : chunks) {
                    if (parentRawText.length() > 0) parentRawText.append("\n\n");
                    parentRawText.append(StringUtils.defaultString(c.getRawText()));
                }

                KnowledgeChunk syntheticParent = new KnowledgeChunk();
                syntheticParent.setId(UUID.randomUUID().toString());
                syntheticParent.setDocId(documentId);
                syntheticParent.setKbId(kbId);
                syntheticParent.setChunkIndex(0);
                syntheticParent.setChunkText(parentSummary);
                syntheticParent.setRawText(parentRawText.toString());
                syntheticParent.setContent(parentSummary);
                syntheticParent.setChunkLevel("parent");
                syntheticParent.setEvents("[]");
                JSONObject parentMeta = new JSONObject();
                JSONObject domainScope = new JSONObject();
                domainScope.set("domain", StringUtils.defaultIfBlank(intelligentChunks.get(0).getDomain(), "综合"));
                domainScope.set("theme", StringUtils.defaultIfBlank(intelligentChunks.get(0).getTheme(), "自动聚合"));
                parentMeta.set("1_Domain_Scope", domainScope);
                JSONObject ontology = new JSONObject();
                ontology.set("entities", new JSONArray());
                ontology.set("concepts", new JSONArray());
                ontology.set("events", new JSONArray());
                ontology.set("chunk_level", "parent");
                parentMeta.set("2_Ontology_Routing", ontology);
                JSONObject epistTag = new JSONObject();
                epistTag.set("source", "parent");
                epistTag.set("claim_type", "段落聚合");
                epistTag.set("confidence", 1.0);
                epistTag.set("chunk_summary", parentSummary);
                parentMeta.set("3_Epistemology_Tag", epistTag);
                syntheticParent.setMetadata(parentMeta.toString());

                List<String> childIds = new ArrayList<>();
                for (KnowledgeChunk c : chunks) {
                    c.setParentId(syntheticParent.getId());
                    childIds.add(c.getId());
                }
                syntheticParent.setChildIds(JSONUtil.toJsonStr(childIds));
                ontology.set("child_ids", childIds);

                chunks.add(0, syntheticParent);
            }

            // 为父块注入 child_ids 指针（RAPTOR：父摘要索引 → 指向子块）
            Map<String, List<String>> parentChildIdsMap = new java.util.HashMap<>();
            for (KnowledgeChunk chunk : chunks) {
                if ("child".equals(chunk.getChunkLevel()) && StringUtils.isNotBlank(chunk.getParentId())) {
                    parentChildIdsMap.computeIfAbsent(chunk.getParentId(), k -> new ArrayList<>()).add(chunk.getId());
                }
            }
            for (KnowledgeChunk chunk : chunks) {
                if ("parent".equals(chunk.getChunkLevel())) {
                    List<String> childIds = parentChildIdsMap.getOrDefault(chunk.getId(), List.of());
                    chunk.setChildIds(JSONUtil.toJsonStr(childIds));
                    // 重建 metadata 以包含 child_ids
                    try {
                        JSONObject meta = JSONUtil.parseObj(chunk.getMetadata());
                        JSONObject ontology = meta.getJSONObject("2_Ontology_Routing");
                        if (ontology == null) {
                            ontology = new JSONObject();
                            meta.set("2_Ontology_Routing", ontology);
                        }
                        ontology.set("child_ids", childIds);
                        chunk.setMetadata(meta.toString());
                    } catch (Exception e) {
                        log.warn("[cognitiveIngest] 父块 metadata 注入 child_ids 失败: {}", e.getMessage());
                    }
                }
            }

            // 4. 向量生成和写入
            KnowledgeBase knowledgeBase = knowledgeBaseService.getById(kbId);
            ModelConfig embeddingConfig = null;
            // 优先从知识库配置中读取嵌入模型
            if (knowledgeBase != null && StringUtils.isNotBlank(knowledgeBase.getEmbeddingModelId())) {
                embeddingConfig = modelConfigService.getById(knowledgeBase.getEmbeddingModelId());
            }
            // 其次从工作流模板中读取嵌入模型配置
            if (embeddingConfig == null) {
                String embeddingModelId = extractModelConfigFromTemplate("embedding_model_id", COGNITIVE_RAG_TEMPLATE_ID);
                if (StringUtils.isNotBlank(embeddingModelId)) {
                    embeddingConfig = modelConfigService.getById(embeddingModelId);
                }
            }
            // 最后兜底：查找已启用的 embedding 模型
            if (embeddingConfig == null) {
                embeddingConfig = modelConfigService.list().stream()
                        .filter(mc -> Integer.valueOf(1).equals(mc.getEnabled())
                                && "embedding".equalsIgnoreCase(mc.getModelType()))
                        .findFirst()
                        .orElse(null);
            }

            for (KnowledgeChunk chunk : chunks) {
                chunk.setDocId(documentId);
                chunk.setKbId(kbId);

                // RAPTOR 双路向量化：父块摘要 + 子块原文均参与向量化
                // 父块：向量化结构化摘要（宏观问题可命中摘要 → 按需下钻子块）
                // 子块：向量化原文切片（微观问题精准命中细节 → 上拉父摘要补充背景）
                if (embeddingConfig != null) {
                    try {
                        String textToEmbed = "parent".equals(chunk.getChunkLevel())
                                ? chunk.getChunkText()   // 父块 chunkText = 结构化摘要
                                : chunk.getChunkText();  // 子块 chunkText = 原文切片
                        float[] embedding = embeddingClient.embed(embeddingConfig, textToEmbed);
                        chunk.setEmbedding(vectorClient.vectorToString(embedding));
                    } catch (Exception e) {
                        log.warn("[cognitiveIngest] 生成Embedding失败: chunkLevel={}, error={}", chunk.getChunkLevel(), e.getMessage());
                    }
                }
            }

            vectorClient.saveChunks(chunks);

            long parentCount = chunks.stream().filter(c -> "parent".equals(c.getChunkLevel())).count();
            int childCount = (int) chunks.stream().filter(c -> "child".equals(c.getChunkLevel())).count();
            int totalVectorized = (int) chunks.stream().filter(c -> StringUtils.isNotBlank(c.getEmbedding())).count();

            // 5. 更新文档状态为已完成
            DocumentUpdateRequest completeUpdate = new DocumentUpdateRequest();
            completeUpdate.setId(documentId);
            completeUpdate.setStatus("completed");
            completeUpdate.setChunkCount(chunks.size());
            completeUpdate.setErrorMessage("");
            completeUpdate.setResolvedIngestionMode("deep");
            documentService.updateDocument(completeUpdate);

            // 更新知识库 chunk 计数
            if (knowledgeBase != null) {
                KnowledgeBase updateKb = new KnowledgeBase();
                updateKb.setId(kbId);
                int currentCount = knowledgeBase.getChunkCount() != null ? knowledgeBase.getChunkCount() : 0;
                updateKb.setChunkCount(currentCount + childCount);
                knowledgeBaseService.updateById(updateKb);
            }

            result.set("chunkCount", chunks.size());
            result.set("parentChunkCount", parentCount);
            result.set("childChunkCount", childCount);
            result.set("vectorizedCount", totalVectorized);
            result.set("storedChunkCount", chunks.size());
            result.set("documentId", documentId);
            result.set("status", "completed");

            log.info("[cognitiveIngest] 认知级入库完成: documentId={}, parentChunks={}, childChunks={}", documentId, parentCount, childCount);
            return result;

        } catch (Exception e) {
            log.error("[cognitiveIngest] 认知级入库失败: {}", e.getMessage(), e);
            DocumentUpdateRequest failedRequest = new DocumentUpdateRequest();
            failedRequest.setId(documentId);
            failedRequest.setStatus("failed");
            failedRequest.setErrorMessage(e.getMessage());
            failedRequest.setResolvedIngestionMode("deep");
            documentService.updateDocument(failedRequest);
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "认知级入库失败: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteDocument(String documentId) {
        KnowledgeDocument document = documentService.getById(documentId);
        ThrowUtils.throwIf(document == null, ErrorCode.NOT_FOUND_ERROR, "文档不存在");

        chunkService.remove(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<KnowledgeChunk>()
                .eq("doc_id", documentId));

        documentService.removeById(documentId);

        KnowledgeBase knowledgeBase = knowledgeBaseService.getById(document.getKbId());
        if (knowledgeBase != null && document.getChunkCount() != null) {
            KnowledgeBase updateKb = new KnowledgeBase();
            updateKb.setId(document.getKbId());
            updateKb.setChunkCount(Math.max(0, knowledgeBase.getChunkCount() - document.getChunkCount()));
            knowledgeBaseService.updateById(updateKb);
        }

        log.info("[KnowledgeBaseIngestionService] 删除文档完成: documentId={}", documentId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markDocumentFailed(String documentId, String errorMessage, String resolvedMode) {
        if (StringUtils.isBlank(documentId)) {
            return;
        }
        DocumentUpdateRequest failedRequest = new DocumentUpdateRequest();
        failedRequest.setId(documentId);
        failedRequest.setStatus("failed");
        failedRequest.setErrorMessage(StringUtils.abbreviate(StringUtils.defaultIfBlank(errorMessage, "入库失败"), 1000));
        if (StringUtils.isNotBlank(resolvedMode)) {
            failedRequest.setResolvedIngestionMode(resolvedMode);
        }
        documentService.updateDocument(failedRequest);
    }

    private String extractModelConfigFromTemplate(String fieldKey, String... templateIds) {
        return extractStringFromTemplates(fieldKey, null, templateIds);
    }

    private String extractStringFromTemplate(String templateId, String fieldKey, String defaultValue) {
        return extractStringFromTemplates(fieldKey, defaultValue, templateId);
    }

    private int extractIntFromTemplate(String templateId, String fieldKey, int defaultValue) {
        String value = extractStringFromTemplate(templateId, fieldKey, String.valueOf(defaultValue));
        try {
            return Integer.parseInt(value);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private String extractStringFromTemplates(String fieldKey, String defaultValue, String... templateIds) {
        for (String templateId : templateIds) {
            String value = extractStringFromTemplateField(templateId, fieldKey);
            if (StringUtils.isNotBlank(value)) {
                return value;
            }
        }
        return defaultValue;
    }

    private String extractStringFromTemplateField(String templateId, String fieldKey) {
        try {
            WorkflowTemplate template = workflowTemplateService.getById(templateId);
            if (template == null || StringUtils.isBlank(template.getGraphJson())) {
                return null;
            }
            JSONObject graph = JSONUtil.parseObj(template.getGraphJson());
            JSONArray nodes = graph.getJSONArray("nodes");
            if (nodes == null || nodes.isEmpty()) {
                return null;
            }
            for (int i = 0; i < nodes.size(); i++) {
                JSONObject node = nodes.getJSONObject(i);
                JSONObject data = node.getJSONObject("data");
                if (data == null) {
                    continue;
                }
                JSONObject values = data.getJSONObject("values");
                if (values != null && StringUtils.isNotBlank(values.getStr(fieldKey))) {
                    return values.getStr(fieldKey);
                }
                JSONObject nodeObj = data.getJSONObject("node");
                if (nodeObj == null) {
                    continue;
                }
                JSONObject nodeValues = nodeObj.getJSONObject("values");
                if (nodeValues != null && StringUtils.isNotBlank(nodeValues.getStr(fieldKey))) {
                    return nodeValues.getStr(fieldKey);
                }
                JSONObject templateFields = nodeObj.getJSONObject("template");
                if (templateFields != null) {
                    JSONObject field = templateFields.getJSONObject(fieldKey);
                    if (field != null && field.containsKey("value")) {
                        return field.getStr("value");
                    }
                }
            }
            return null;
        } catch (Exception e) {
            log.warn("[extractStringFromTemplateField] 解析工作流模板失败: templateId={}, fieldKey={}, error={}", templateId, fieldKey, e.getMessage());
            return null;
        }
    }

    /**
     * 安全处理 JSONB 数组字段：确保写入的是合法 JSON 数组字符串
     * LLM 返回的可能是纯文本，需要包装或降级
     */
    /**
     * 构建结构化数据的 RAG chunk
     */
    private KnowledgeChunk buildStructuredChunk(String kbId, String docId, String sourceId, String sourceType, String chunkText) {
        KnowledgeChunk chunk = new KnowledgeChunk();
        chunk.setKbId(kbId);
        chunk.setDocId(docId);
        chunk.setChunkText(chunkText);
        chunk.setContent(chunkText);
        chunk.setRawText(chunkText);
        chunk.setChunkIndex(0);
        // 复用已有字段：chunkLevel 存来源类型(entity/event/viewpoint/case)，parentId 存来源ID
        chunk.setChunkLevel(sourceType);
        chunk.setParentId(sourceId);
        chunk.setMetadata("{\"source_type\":\"" + sourceType + "\",\"source_id\":\"" + sourceId + "\"}");
        return chunk;
    }

    private String safeJsonArray(String value) {
        if (StringUtils.isBlank(value)) {
            return "[]";
        }
        value = value.trim();
        try {
            Object parsed = JSONUtil.parse(value);
            if (parsed instanceof cn.hutool.json.JSONArray) {
                return parsed.toString();
            }
            // 不是数组，包装成单元素数组
            cn.hutool.json.JSONArray arr = new cn.hutool.json.JSONArray();
            arr.add(value);
            return arr.toString();
        } catch (Exception e) {
            // 不是合法 JSON，包装成单元素数组
            cn.hutool.json.JSONArray arr = new cn.hutool.json.JSONArray();
            arr.add(value);
            return arr.toString();
        }
    }

    /**
     * 安全处理 JSONB 对象字段：确保写入的是合法 JSON 对象字符串
     * LLM 返回的可能是纯文本，需要包装或降级
     */
    private String safeJsonObj(String value) {
        if (StringUtils.isBlank(value)) {
            return "{}";
        }
        value = value.trim();
        try {
            Object parsed = JSONUtil.parse(value);
            if (parsed instanceof cn.hutool.json.JSONObject) {
                return parsed.toString();
            }
            // 不是对象，包装成 {"text": value}
            return new JSONObject().set("text", value).toString();
        } catch (Exception e) {
            // 不是合法 JSON，包装成 {"text": value}
            return new JSONObject().set("text", value).toString();
        }
    }

}
