package com.ice.template.executor.node;

import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.model.dto.knowledge.DocumentUpdateRequest;
import com.ice.template.rag.KnowledgeBaseIngestionService;
import com.ice.template.service.KnowledgeDocumentService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * 存入知识库节点：把上游解析得到的 markdown 正文存为知识库里的一篇文档（document 表，status=parsed）。
 *
 * <p>这是「入知识库」而非「入 RAG」：只做<b>文档级存储</b>，不做分块/向量化。
 * 真正的分块向量化（入 RAG）由用户后续点「入库」时走认知级工作流完成。</p>
 *
 * <p>输入：</p>
 * <ul>
 *   <li>text：上游提取的 markdown 正文（经连线注入）；</li>
 *   <li>kb_id：目标知识库（画布下拉选择，或运行时由入库入口注入 context 变量）；</li>
 *   <li>title：文档标题（可选，缺省用上游标题 webTitle 或 URL）。</li>
 * </ul>
 * <p>输出：documentId（新建文档 ID），并写入 context 变量 documentId 供入库入口读取。</p>
 */
@Component
public class SaveToKnowledgeBaseNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(SaveToKnowledgeBaseNodeExecutor.class);

    @Lazy
    @Resource
    private KnowledgeBaseIngestionService ingestionService;

    @Resource
    private KnowledgeDocumentService documentService;

    @Override
    public boolean supports(String nodeType) {
        return "SaveToKnowledgeBase".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String markdown = resolve(node, context, "text");
        if (StringUtils.isBlank(markdown)) {
            markdown = context.getCurrentText();
        }
        if (StringUtils.isBlank(markdown)) {
            throw new IllegalStateException("没有可存入知识库的正文，请检查上游网页提取是否成功");
        }

        String kbId = resolve(node, context, "kb_id");
        if (StringUtils.isBlank(kbId)) {
            throw new IllegalArgumentException("请选择目标知识库（kb_id 为空）");
        }

        String title = resolveDocumentTitle(node, context);
        if (StringUtils.isBlank(title)) {
            Object webTitle = context.getVariable("webTitle");
            title = webTitle != null ? String.valueOf(webTitle) : "未命名文档";
        }

        // 文件解析会注入实际文件类型；网页解析无此变量，默认 md
        Object fileTypeVar = context.getVariable("fileType");
        String fileType = fileTypeVar != null && StringUtils.isNotBlank(String.valueOf(fileTypeVar))
                ? String.valueOf(fileTypeVar) : "md";

        // 文件解析会注入原始文件路径/大小，用于保留可下载的原文件元数据；网页解析无此变量
        Object filePathVar = context.getVariable("relativeFilePath");
        if (filePathVar == null) {
            filePathVar = context.getVariable("filePath");
        }
        String filePath = filePathVar == null ? null : String.valueOf(filePathVar);
        Object fileSizeVar = context.getVariable("fileSize");
        Long fileSize = null;
        if (fileSizeVar != null) {
            try {
                fileSize = Long.parseLong(String.valueOf(fileSizeVar));
            } catch (NumberFormatException ignored) {
                fileSize = null;
            }
        }

        // 只入知识库（存文档），不入 RAG（不分块向量化）
        String documentId = ingestionService.ingestDocument(kbId, title, markdown, fileType, "none", filePath, fileSize);
        Object globalMetadata = context.getVariable("globalMetadata");
        if (globalMetadata != null && StringUtils.isNotBlank(String.valueOf(globalMetadata))) {
            DocumentUpdateRequest updateRequest = new DocumentUpdateRequest();
            updateRequest.setId(documentId);
            updateRequest.setGlobalMetadata(String.valueOf(globalMetadata));
            documentService.updateDocument(updateRequest);
        }
        context.setVariable("documentId", documentId);
        log.info("[SaveToKnowledgeBase] 已存入知识库: kbId={}, title={}, fileType={}, documentId={}, 正文长度={}",
                kbId, title, fileType, documentId, markdown.length());

        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(documentId);
        result.getOutput().put("documentId", documentId);
        result.getOutput().put("title", title);
        result.getOutput().put("kbId", kbId);
        return result;
    }

    private String resolveDocumentTitle(FlowNodeDTO node, FlowExecutionContext context) {
        Object documentTitle = context.getVariable("documentTitle");
        if (documentTitle != null && StringUtils.isNotBlank(String.valueOf(documentTitle))) {
            return String.valueOf(documentTitle);
        }
        return resolve(node, context, "title");
    }

    private String resolve(FlowNodeDTO node, FlowExecutionContext context, String key) {
        String value = FlowNodeDataUtils.getTemplateString(node, key);
        if (StringUtils.isNotBlank(value)) {
            return value;
        }
        Object var = context.getVariable(key);
        return var == null ? "" : String.valueOf(var);
    }
}
