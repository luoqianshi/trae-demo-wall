package com.ice.template.executor.node;

import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.rag.DocumentParser;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.io.File;

/**
 * 文件解析节点：读取上传的文件（txt/md/pdf 等），解析为 markdown 正文。
 *
 * <p>是「文件解析入库」工作流的起点，与网页工作流的提取节点对齐：输出 text/success/title/fileType，
 * 交由下游「存入知识库」节点（{@link SaveToKnowledgeBaseNodeExecutor}）做文档级存储。</p>
 *
 * <p>file_path 优先取节点字段；为空则取 {@code context.getVariable("file_path")}（由入库入口注入）。</p>
 */
@Component
public class FileLoaderNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(FileLoaderNodeExecutor.class);

    @Resource
    private DocumentParser documentParser;

    @Override
    public boolean supports(String nodeType) {
        return "FileLoader".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String filePath = FlowNodeDataUtils.getTemplateString(node, "file_path");
        if (StringUtils.isBlank(filePath)) {
            Object var = context.getVariable("file_path");
            if (var != null) {
                filePath = String.valueOf(var);
            }
        }
        if (StringUtils.isBlank(filePath)) {
            throw new IllegalArgumentException("请提供文件路径（file_path 为空）");
        }

        String fileType = extractFileType(filePath);
        String markdown = documentParser.parse(filePath);
        if (StringUtils.isBlank(markdown)) {
            throw new IllegalStateException("文件解析结果为空: " + filePath);
        }

        String title = extractTitle(filePath);
        context.setCurrentText(markdown);
        context.setVariable("webTitle", title);
        context.setVariable("fileType", fileType);
        log.info("[FileLoader] 解析成功: path={}, fileType={}, length={}", filePath, fileType, markdown.length());

        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(markdown);
        result.getOutput().put("text", markdown);
        result.getOutput().put("success", true);
        result.getOutput().put("title", title);
        result.getOutput().put("fileType", fileType);
        result.getOutput().put("length", markdown.length());
        return result;
    }

    private String extractFileType(String filePath) {
        int dot = filePath.lastIndexOf('.');
        if (dot < 0 || dot == filePath.length() - 1) {
            return "txt";
        }
        return filePath.substring(dot + 1).toLowerCase();
    }

    private String extractTitle(String filePath) {
        String name = new File(filePath).getName();
        int dot = name.lastIndexOf('.');
        return dot > 0 ? name.substring(0, dot) : name;
    }
}
