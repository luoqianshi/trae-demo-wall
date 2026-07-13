package com.ice.template.executor.node;

import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.model.entity.KnowledgeDocument;
import com.ice.template.rag.DocumentParser;
import com.ice.template.service.KnowledgeDocumentService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Component
public class DocumentLoaderNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(DocumentLoaderNodeExecutor.class);

    @Resource
    private DocumentParser documentParser;

    @Resource
    private KnowledgeDocumentService knowledgeDocumentService;

    @Override
    public boolean supports(String nodeType) {
        return "DocumentLoader".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String documentId = FlowNodeDataUtils.getTemplateString(node, "document_id");
        String filePath = FlowNodeDataUtils.getTemplateString(node, "file_path");
        String content = FlowNodeDataUtils.getTemplateString(node, "content");
        String fileType = FlowNodeDataUtils.getTemplateString(node, "file_type");

        log.info("[DocumentLoader] documentId={}, filePath={}, fileType={}, contentLength={}",
                documentId, filePath, fileType, content != null ? content.length() : 0);

        String parsedContent;
        // 优先级：已选文档(document_id) > 文件路径 > 直接文本内容
        if (StringUtils.isNotBlank(documentId)) {
            KnowledgeDocument document = knowledgeDocumentService.getById(documentId);
            if (document == null) {
                throw new IllegalArgumentException("文档不存在: " + documentId);
            }
            String rawText = document.getRawText();
            if (StringUtils.isNotBlank(rawText)) {
                parsedContent = rawText;
            } else if (StringUtils.isNotBlank(document.getFilePath())) {
                parsedContent = documentParser.parse(document.getFilePath());
            } else {
                throw new IllegalArgumentException("文档没有可用的正文内容: " + documentId);
            }
        } else if (StringUtils.isNotBlank(filePath)) {
            parsedContent = documentParser.parse(filePath);
        } else if (StringUtils.isNotBlank(content)) {
            fileType = StringUtils.defaultIfBlank(fileType, "txt");
            parsedContent = documentParser.parseContent(content, fileType);
        } else {
            throw new IllegalArgumentException("请提供文档、文件路径或文本内容之一");
        }

        context.setCurrentText(parsedContent);
        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(parsedContent);
        result.getOutput().put("text", parsedContent);
        result.getOutput().put("length", parsedContent.length());

        log.info("[DocumentLoader] 解析完成，内容长度={}", parsedContent.length());
        return result;
    }
}
