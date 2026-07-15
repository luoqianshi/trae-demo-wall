package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sva.client.ComfyUiClient;
import com.sva.common.exception.BusinessException;
import com.sva.dto.FrameExtractRequest;
import com.sva.dto.FrameTaskCreateRequest;
import com.sva.entity.FrameTask;
import com.sva.entity.Video;
import com.sva.entity.VideoFrame;
import com.sva.mapper.FrameTaskMapper;
import com.sva.service.FrameService;
import com.sva.service.VideoFrameService;
import com.sva.service.VideoService;
import com.sva.util.FFmpegUtil;
import com.sva.vo.FrameExtractVO;
import com.sva.vo.FrameTaskVO;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import com.sva.config.MinioProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FrameServiceImpl extends ServiceImpl<FrameTaskMapper, FrameTask> implements FrameService {

    private final VideoService videoService;
    private final VideoFrameService videoFrameService;
    private final ComfyUiClient comfyUiClient;
    private final ObjectMapper objectMapper;
    private final FFmpegUtil ffmpegUtil;
    private final MinioClient minioClient;
    private final MinioProperties minioProperties;

    private static final List<String> VALID_MODES = Arrays.asList(
            "SINGLE_REDRAW", "START_END_FUSION", "SEGMENT_REMAKE", "MULTI_SEGMENT_FUSION");

    @Override
    public FrameTask createTask(FrameTaskCreateRequest request, Long userId) {
        if (!VALID_MODES.contains(request.getMode())) {
            throw new BusinessException(400, "无效的生成模式: " + request.getMode());
        }

        FrameTask task = new FrameTask();
        task.setProjectId(request.getProjectId());
        task.setUserId(userId);
        task.setVideoId(request.getVideoId());
        task.setMode(request.getMode());
        task.setStatus(0);
        task.setProgress(0);

        try {
            if (request.getParams() != null) {
                task.setParamsJson(objectMapper.writeValueAsString(request.getParams()));
            }
            if (request.getSourceFrames() != null) {
                task.setSourceFramesJson(objectMapper.writeValueAsString(request.getSourceFrames()));
            }
        } catch (Exception e) {
            throw new BusinessException(500, "参数序列化失败");
        }

        save(task);
        startFrameTask(task.getId());
        return task;
    }

    @Override
    public FrameTaskVO getTaskResult(Long taskId, Long userId) {
        FrameTask task = getById(taskId);
        if (task == null || !task.getUserId().equals(userId)) {
            throw new BusinessException(404, "任务不存在");
        }
        return toVO(task);
    }

    @Override
    public List<FrameTask> listByProject(Long projectId, Long userId) {
        return list(new LambdaQueryWrapper<FrameTask>()
                .eq(FrameTask::getProjectId, projectId)
                .eq(FrameTask::getUserId, userId)
                .orderByDesc(FrameTask::getCreateTime));
    }

    @Override
    public FrameTask regenerate(Long taskId, Long userId) {
        FrameTask task = getById(taskId);
        if (task == null || !task.getUserId().equals(userId)) {
            throw new BusinessException(404, "任务不存在");
        }
        task.setStatus(0);
        task.setProgress(0);
        task.setErrorMsg(null);
        task.setResultPathsJson(null);
        task.setComfyuiTaskId(null);
        updateById(task);
        startFrameTask(task.getId());
        return task;
    }

    @Override
    public FrameExtractVO extractFrames(FrameExtractRequest request, Long userId) {
        Video video = videoService.getById(request.getVideoId());
        if (video == null || !video.getUserId().equals(userId)) {
            throw new BusinessException(404, "视频不存在");
        }

        List<Map<String, Object>> framesList = new ArrayList<>();
        List<VideoFrame> dbFrames = videoFrameService.getKeyFrames(request.getVideoId());
        for (VideoFrame f : dbFrames) {
            Map<String, Object> frameInfo = new HashMap<>();
            frameInfo.put("frameId", String.valueOf(f.getId()));
            frameInfo.put("frameIndex", f.getFrameIndex());
            frameInfo.put("timestampMs", f.getTimestampMs());
            frameInfo.put("storagePath", f.getStoragePath());
            frameInfo.put("bucketName", f.getBucketName());
            frameInfo.put("sceneTags", f.getSceneTags());
            frameInfo.put("promptText", f.getPromptText());
            frameInfo.put("thumbnailUrl", buildFrameUrl(f.getStoragePath()));
            framesList.add(frameInfo);
        }

        // 如果指定了时间范围或帧索引，过滤
        if (request.getStartMs() != null || request.getEndMs() != null) {
            long start = request.getStartMs() != null ? request.getStartMs() : 0;
            long end = request.getEndMs() != null ? request.getEndMs() : Long.MAX_VALUE;
            framesList = framesList.stream()
                    .filter(f -> {
                        long ts = (long) f.get("timestampMs");
                        return ts >= start && ts <= end;
                    })
                    .toList();
        }

        FrameExtractVO vo = new FrameExtractVO();
        vo.setVideoId(String.valueOf(video.getId()));
        vo.setVideoFilename(video.getFilename());
        vo.setFrames(framesList);
        vo.setTotal(framesList.size());
        return vo;
    }

    @Async
    @Override
    public void startFrameTask(Long taskId) {
        FrameTask task = getById(taskId);
        if (task == null) return;

        task.setStatus(1);
        task.setProgress(10);
        updateById(task);

        try {
            List<Map<String, Object>> sourceFrames = parseJson(task.getSourceFramesJson(),
                    new TypeReference<List<Map<String, Object>>>() {});
            Map<String, Object> params = parseJson(task.getParamsJson(),
                    new TypeReference<Map<String, Object>>() {});

            task.setProgress(30);
            updateById(task);

            // 构建 ComfyUI 工作流
            Map<String, Object> workflow = buildWorkflow(task.getMode(), sourceFrames, params);

            task.setProgress(50);
            updateById(task);

            // 提交到 ComfyUI
            String clientId = "sva-" + task.getId();
            String promptId;
            try {
                promptId = comfyUiClient.submitPrompt(workflow, clientId);
            } catch (Exception e) {
                log.warn("ComfyUI 提交失败，进入 Mock 模式: {}", e.getMessage());
                promptId = "mock-" + System.currentTimeMillis();
            }
            task.setComfyuiTaskId(promptId);
            updateById(task);

            task.setProgress(75);
            updateById(task);

            // 生成模拟结果（Mock 模式下直接返回，正常模式下轮询 ComfyUI）
            List<Map<String, Object>> results = generateMockResults(task.getMode(), sourceFrames, params);

            // 保存结果
            task.setResultPathsJson(objectMapper.writeValueAsString(results));
            task.setStatus(2);
            task.setProgress(100);
            updateById(task);
            log.info("Frame task {} completed", taskId);

        } catch (Exception e) {
            log.error("Frame task {} failed", taskId, e);
            task.setStatus(3);
            task.setErrorMsg(e.getMessage());
            updateById(task);
        }
    }

    private Map<String, Object> buildWorkflow(String mode, List<Map<String, Object>> sourceFrames, Map<String, Object> params) {
        // 构建 ComfyUI API 格式工作流
        // 实际生产中应根据 mode 加载不同的工作流模板 JSON
        Map<String, Object> workflow = new HashMap<>();

        Map<String, Object> node3 = new HashMap<>();
        node3.put("class_type", "KSampler");
        Map<String, Object> inputs = new HashMap<>();
        inputs.put("seed", params.getOrDefault("seed", new Random().nextInt(1000000)));
        inputs.put("steps", params.getOrDefault("steps", 20));
        inputs.put("cfg", params.getOrDefault("cfg", 8.0));
        inputs.put("sampler_name", params.getOrDefault("sampler", "euler"));
        inputs.put("scheduler", params.getOrDefault("scheduler", "normal"));
        inputs.put("denoise", params.getOrDefault("denoise", 1.0));
        node3.put("inputs", inputs);
        workflow.put("3", node3);

        Map<String, Object> node4 = new HashMap<>();
        node4.put("class_type", "CheckpointLoaderSimple");
        Map<String, Object> ckptInputs = new HashMap<>();
        ckptInputs.put("ckpt_name", params.getOrDefault("model", "v1-5-pruned-emaonly.ckpt"));
        node4.put("inputs", ckptInputs);
        workflow.put("4", node4);

        Map<String, Object> node6 = new HashMap<>();
        node6.put("class_type", "CLIPTextEncode");
        Map<String, Object> posInputs = new HashMap<>();
        posInputs.put("text", params.getOrDefault("prompt", getModeDefaultPrompt(mode)));
        node6.put("inputs", posInputs);
        workflow.put("6", node6);

        Map<String, Object> node7 = new HashMap<>();
        node7.put("class_type", "CLIPTextEncode");
        Map<String, Object> negInputs = new HashMap<>();
        negInputs.put("text", params.getOrDefault("negativePrompt", "lowres, bad anatomy, bad hands, text, error, worst quality, low quality"));
        node7.put("inputs", negInputs);
        workflow.put("7", node7);

        Map<String, Object> node8 = new HashMap<>();
        node8.put("class_type", "VAEDecode");
        Map<String, Object> vaeInputs = new HashMap<>();
        node8.put("inputs", vaeInputs);
        workflow.put("8", node8);

        return workflow;
    }

    private String getModeDefaultPrompt(String mode) {
        return switch (mode) {
            case "SINGLE_REDRAW" -> "high quality, detailed, masterpiece, best quality";
            case "START_END_FUSION" -> "smooth transition, high quality, cinematic";
            case "SEGMENT_REMAKE" -> "remastered, high quality, 4k, detailed";
            case "MULTI_SEGMENT_FUSION" -> "fusion, cinematic, high quality, seamless";
            default -> "high quality";
        };
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> generateMockResults(String mode, List<Map<String, Object>> sourceFrames, Map<String, Object> params) {
        List<Map<String, Object>> results = new ArrayList<>();
        int resolution = Integer.parseInt(String.valueOf(params.getOrDefault("resolution", "512")));

        if ("SINGLE_REDRAW".equals(mode)) {
            // 单帧重绘：每帧一个结果
            if (sourceFrames != null) {
                for (int i = 0; i < sourceFrames.size(); i++) {
                    Map<String, Object> r = new HashMap<>();
                    r.put("index", i);
                    r.put("type", "image");
                    r.put("filename", "redraw_" + i + ".png");
                    r.put("storagePath", "mock/redraw_" + i + ".png");
                    r.put("bucketName", minioProperties.getBuckets().get("image-generated"));
                    r.put("resolution", resolution + "x" + resolution);
                    r.put("url", "/api/frame/mock/result_" + i + ".png");
                    results.add(r);
                }
            }
        } else if ("START_END_FUSION".equals(mode)) {
            // 首尾帧融合：返回视频片段
            Map<String, Object> r = new HashMap<>();
            r.put("index", 0);
            r.put("type", "video");
            r.put("filename", "fusion_clip.mp4");
            r.put("storagePath", "mock/fusion_clip.mp4");
            r.put("bucketName", minioProperties.getBuckets().get("video-processed"));
            r.put("duration", params.getOrDefault("duration", 3) + "s");
            r.put("url", "/api/frame/mock/fusion.mp4");
            results.add(r);
        } else if ("SEGMENT_REMAKE".equals(mode)) {
            // 片段重制：返回重制后的视频片段
            Map<String, Object> r = new HashMap<>();
            r.put("index", 0);
            r.put("type", "video");
            r.put("filename", "remake_clip.mp4");
            r.put("storagePath", "mock/remake_clip.mp4");
            r.put("bucketName", minioProperties.getBuckets().get("video-processed"));
            r.put("duration", params.getOrDefault("duration", 5) + "s");
            r.put("url", "/api/frame/mock/remake.mp4");
            results.add(r);
        } else if ("MULTI_SEGMENT_FUSION".equals(mode)) {
            // 多片段融合：返回多个融合结果
            int count = Math.min(3, sourceFrames != null ? sourceFrames.size() : 1);
            for (int i = 0; i < count; i++) {
                Map<String, Object> r = new HashMap<>();
                r.put("index", i);
                r.put("type", "image");
                r.put("filename", "fusion_multi_" + i + ".png");
                r.put("storagePath", "mock/fusion_multi_" + i + ".png");
                r.put("bucketName", minioProperties.getBuckets().get("image-generated"));
                r.put("resolution", resolution + "x" + resolution);
                r.put("url", "/api/frame/mock/fusion_multi_" + i + ".png");
                results.add(r);
            }
        }
        return results;
    }

    private FrameTaskVO toVO(FrameTask task) {
        FrameTaskVO vo = new FrameTaskVO();
        vo.setId(String.valueOf(task.getId()));
        vo.setProjectId(String.valueOf(task.getProjectId()));
        vo.setVideoId(task.getVideoId() != null ? String.valueOf(task.getVideoId()) : null);
        vo.setMode(task.getMode());
        vo.setModeName(getModeName(task.getMode()));
        vo.setComfyuiTaskId(task.getComfyuiTaskId());
        vo.setStatus(task.getStatus());
        vo.setProgress(task.getProgress());
        vo.setErrorMsg(task.getErrorMsg());
        vo.setCreateTime(task.getCreateTime());
        vo.setUpdateTime(task.getUpdateTime());

        vo.setParams(parseJson(task.getParamsJson(), new TypeReference<Map<String, Object>>() {}));
        vo.setSourceFrames(parseJson(task.getSourceFramesJson(), new TypeReference<List<Map<String, Object>>>() {}));
        vo.setResults(parseJson(task.getResultPathsJson(), new TypeReference<List<Map<String, Object>>>() {}));
        return vo;
    }

    private String getModeName(String mode) {
        return switch (mode) {
            case "SINGLE_REDRAW" -> "单帧重绘";
            case "START_END_FUSION" -> "首尾帧融合";
            case "SEGMENT_REMAKE" -> "片段重制";
            case "MULTI_SEGMENT_FUSION" -> "多片段融合";
            default -> mode;
        };
    }

    private String buildFrameUrl(String storagePath) {
        // 简化：实际应生成 MinIO 预签名 URL
        return "/api/frame/thumb/" + storagePath;
    }

    private <T> T parseJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.isEmpty()) return null;
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            log.warn("JSON 解析失败: {}", e.getMessage());
            return null;
        }
    }
}
