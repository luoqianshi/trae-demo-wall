package com.ice.template.rag.douyin;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.rag.storage.MediaStorageService;
import com.ice.template.rag.storage.StoredMediaFile;
import javax.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class DouyinVideoDownloadService {

    @Resource
    private DouyinApiClient douyinApiClient;

    @Resource
    private MediaStorageService mediaStorageService;

    public DouyinDownloadResult download(String kbId, String input) {
        if (StringUtils.isAnyBlank(kbId, input)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库ID和抖音链接不能为空");
        }
        String sourceUrl = douyinApiClient.resolveSourceUrl(input);
        DouyinVideoInfo videoInfo = douyinApiClient.resolveVideo(input);
        if (Boolean.TRUE.equals(videoInfo.getImagePost())) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "当前抖音链接是图文作品，暂不支持转视频语音");
        }
        StoredMediaFile mediaFile = mediaStorageService.downloadDouyinVideo(
                kbId,
                videoInfo.getAwemeId(),
                videoInfo.getVideoUrl(),
                douyinApiClient.buildVideoDownloadHeaders()
        );
        log.info("[DouyinVideoDownload] 下载完成: awemeId={}, path={}, size={}",
                videoInfo.getAwemeId(), mediaFile.getRelativePath(), mediaFile.getFileSize());
        return DouyinDownloadResult.builder()
                .input(input)
                .sourceUrl(sourceUrl)
                .videoInfo(videoInfo)
                .mediaFile(mediaFile)
                .build();
    }

    public String buildMetadata(DouyinDownloadResult result) {
        JSONObject metadata = new JSONObject();
        metadata.set("sourceType", "douyin");
        metadata.set("sourceUrl", result.getSourceUrl());
        metadata.set("storagePath", result.getMediaFile().getRelativePath());
        metadata.set("fileSize", result.getMediaFile().getFileSize());
        DouyinVideoInfo video = result.getVideoInfo();
        metadata.set("awemeId", video.getAwemeId());
        metadata.set("desc", video.getDesc());
        metadata.set("coverUrl", video.getVideoCover());
        metadata.set("duration", video.getDuration());
        metadata.set("createTime", video.getCreateTime());
        if (video.getAuthor() != null) {
            metadata.set("author", JSONUtil.parseObj(video.getAuthor()));
        }
        if (video.getStatistics() != null) {
            metadata.set("statistics", JSONUtil.parseObj(video.getStatistics()));
        }
        return metadata.toString();
    }
}
