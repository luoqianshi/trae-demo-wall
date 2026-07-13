package com.ice.template.rag.storage;

import cn.hutool.core.io.FileUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class MediaStorageService {

    private static final DateTimeFormatter DATE_PATH_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    @Resource
    private MediaStorageProperties properties;

    @PostConstruct
    public void init() {
        ensureRootDirectory();
    }

    public Path resolveAbsolutePath(String relativePath) {
        if (StringUtils.isBlank(relativePath)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "媒体文件相对路径不能为空");
        }
        Path root = getRootPath();
        Path resolved = root.resolve(relativePath.replace('/', java.io.File.separatorChar)).normalize();
        if (!resolved.startsWith(root)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "非法媒体文件路径");
        }
        return resolved;
    }

    public StoredMediaFile downloadDouyinVideo(String kbId, String awemeId, String videoUrl, Map<String, String> headers) {
        if (StringUtils.isAnyBlank(kbId, awemeId, videoUrl)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "下载抖音视频参数不完整");
        }
        String relativePath = String.join("/", "kb", sanitize(kbId), "douyin", LocalDate.now().format(DATE_PATH_FORMATTER), sanitize(awemeId), "source.mp4");
        ensureRootDirectory();
        Path absolutePath = resolveAbsolutePath(relativePath);
        try {
            Files.createDirectories(absolutePath.getParent());
            if (Files.exists(absolutePath) && Files.size(absolutePath) > 0) {
                return StoredMediaFile.builder()
                        .relativePath(relativePath)
                        .absolutePath(absolutePath)
                        .fileSize(Files.size(absolutePath))
                        .build();
            }
            HttpRequest request = HttpRequest.get(videoUrl)
                    .timeout(600000)
                    .setFollowRedirects(true);
            if (headers != null) {
                headers.forEach((key, value) -> {
                    if (StringUtils.isNotBlank(key) && StringUtils.isNotBlank(value)) {
                        request.header(key, value);
                    }
                });
            }
            try (HttpResponse response = request.execute()) {
                if (!response.isOk()) {
                    throw new BusinessException(ErrorCode.OPERATION_ERROR, "抖音视频下载失败，HTTP " + response.getStatus());
                }
                try (InputStream inputStream = response.bodyStream()) {
                    FileUtil.writeFromStream(inputStream, absolutePath.toFile());
                }
            }
            long fileSize = Files.size(absolutePath);
            if (fileSize <= 0) {
                Files.deleteIfExists(absolutePath);
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "抖音视频下载结果为空");
            }
            return StoredMediaFile.builder()
                    .relativePath(relativePath)
                    .absolutePath(absolutePath)
                    .fileSize(fileSize)
                    .build();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "保存抖音视频失败: " + absolutePath + "，原因: " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    private Path getRootPath() {
        return Paths.get(properties.getRootPath()).toAbsolutePath().normalize();
    }

    private void ensureRootDirectory() {
        Path root = getRootPath();
        try {
            Files.createDirectories(root);
            if (!Files.isDirectory(root)) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "媒体存储路径不是目录: " + root);
            }
            if (!Files.isWritable(root)) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "媒体存储目录不可写: " + root);
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "初始化媒体存储目录失败: " + root + "，原因: " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    private String sanitize(String value) {
        return value.replaceAll("[^a-zA-Z0-9_-]", "_");
    }
}
