package com.ice.template.executor.node;

import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.rag.douyin.DouyinDownloadResult;
import com.ice.template.rag.douyin.DouyinVideoDownloadService;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

@Component
public class DouyinVideoDownloaderNodeExecutor implements FlowNodeExecutor {

    @Resource
    private DouyinVideoDownloadService douyinVideoDownloadService;

    @Override
    public boolean supports(String nodeType) {
        return "DouyinVideoDownloader".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String kbId = FlowNodeDataUtils.getTemplateString(node, "kb_id");
        if (StringUtils.isBlank(kbId)) {
            Object ctxKbId = context.getVariable("kb_id");
            kbId = ctxKbId == null ? null : String.valueOf(ctxKbId);
        }
        String input = FlowNodeDataUtils.getTemplateString(node, "url");
        if (StringUtils.isBlank(input)) {
            Object ctxUrl = context.getVariable("url");
            input = ctxUrl == null ? null : String.valueOf(ctxUrl);
        }
        DouyinDownloadResult downloadResult = douyinVideoDownloadService.download(kbId, input);
        String title = StringUtils.defaultIfBlank(downloadResult.getVideoInfo().getDesc(), downloadResult.getVideoInfo().getAwemeId());
        String metadata = douyinVideoDownloadService.buildMetadata(downloadResult);

        context.setCurrentText(downloadResult.getMediaFile().getAbsolutePath().toString());
        context.setVariable("file_path", downloadResult.getMediaFile().getAbsolutePath().toString());
        context.setVariable("filePath", downloadResult.getMediaFile().getAbsolutePath().toString());
        context.setVariable("relativeFilePath", downloadResult.getMediaFile().getRelativePath());
        context.setVariable("fileSize", String.valueOf(downloadResult.getMediaFile().getFileSize()));
        context.setVariable("title", title);
        context.setVariable("sourceUrl", downloadResult.getSourceUrl());
        context.setVariable("awemeId", downloadResult.getVideoInfo().getAwemeId());
        context.setVariable("globalMetadata", metadata);

        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(downloadResult.getMediaFile().getAbsolutePath().toString());
        result.getOutput().put("file_path", downloadResult.getMediaFile().getAbsolutePath().toString());
        result.getOutput().put("relative_path", downloadResult.getMediaFile().getRelativePath());
        result.getOutput().put("file_size", String.valueOf(downloadResult.getMediaFile().getFileSize()));
        result.getOutput().put("title", title);
        result.getOutput().put("source_url", downloadResult.getSourceUrl());
        result.getOutput().put("aweme_id", downloadResult.getVideoInfo().getAwemeId());
        result.getOutput().put("metadata", metadata);
        return result;
    }
}
