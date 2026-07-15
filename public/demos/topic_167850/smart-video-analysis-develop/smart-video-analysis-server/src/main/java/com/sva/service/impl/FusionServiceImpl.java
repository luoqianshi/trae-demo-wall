package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sva.common.exception.BusinessException;
import com.sva.entity.FusionTask;
import com.sva.entity.Video;
import com.sva.entity.VideoAnalysis;
import com.sva.mapper.FusionTaskMapper;
import com.sva.service.FusionService;
import com.sva.service.VideoAnalysisService;
import com.sva.service.VideoService;
import com.sva.vo.FusionResultVO;
import com.sva.vo.ShotSuggestionVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FusionServiceImpl extends ServiceImpl<FusionTaskMapper, FusionTask> implements FusionService {

    private final VideoService videoService;
    private final VideoAnalysisService videoAnalysisService;
    private final ObjectMapper objectMapper;

    @Override
    public FusionTask createTask(Long projectId, Long userId, List<Long> videoIds, String fusionMode) {
        if (videoIds == null || videoIds.size() < 2) {
            throw new BusinessException(400, "请至少选择2个视频");
        }
        if (videoIds.size() > 4) {
            throw new BusinessException(400, "最多支持4个视频融合");
        }

        for (Long videoId : videoIds) {
            Video v = videoService.getById(videoId);
            if (v == null || !v.getUserId().equals(userId)) {
                throw new BusinessException(400, "视频不存在或无权限: " + videoId);
            }
            if (v.getStatus() == null || v.getStatus() != 2) {
                throw new BusinessException(400, "视频未解析完成: " + v.getFilename());
            }
        }

        FusionTask task = new FusionTask();
        task.setProjectId(projectId);
        task.setUserId(userId);
        task.setFusionMode(fusionMode);
        try {
            task.setVideoIdsJson(objectMapper.writeValueAsString(videoIds));
        } catch (Exception e) {
            throw new BusinessException(500, "视频ID序列化失败");
        }
        task.setStatus(0);
        task.setProgress(0);
        save(task);

        startFusion(task.getId());
        return task;
    }

    @Override
    public FusionResultVO getResult(Long taskId, Long userId) {
        FusionTask task = getById(taskId);
        if (task == null || !task.getUserId().equals(userId)) {
            throw new BusinessException(404, "融合任务不存在");
        }

        FusionResultVO vo = new FusionResultVO();
        vo.setId(task.getId());
        vo.setProjectId(task.getProjectId());
        vo.setFusionMode(task.getFusionMode());
        vo.setFusionModeName(getModeName(task.getFusionMode()));
        vo.setScriptOutline(task.getScriptOutline());
        vo.setStatus(task.getStatus());
        vo.setProgress(task.getProgress());
        vo.setErrorMsg(task.getErrorMsg());
        vo.setCreateTime(task.getCreateTime() != null ? task.getCreateTime().toString() : "");

        try {
            List<Long> videoIds = objectMapper.readValue(task.getVideoIdsJson(), new TypeReference<List<Long>>() {});
            List<String> videoNames = new ArrayList<>();
            for (Long vid : videoIds) {
                Video v = videoService.getById(vid);
                if (v != null) videoNames.add(v.getFilename());
            }
            vo.setSourceVideos(videoNames);
        } catch (Exception e) {
            vo.setSourceVideos(Collections.emptyList());
        }

        if (task.getShotSuggestions() != null) {
            try {
                List<ShotSuggestionVO> shots = objectMapper.readValue(task.getShotSuggestions(), new TypeReference<List<ShotSuggestionVO>>() {});
                vo.setShotSuggestions(shots);
            } catch (Exception e) {
                vo.setShotSuggestions(Collections.emptyList());
            }
        }

        return vo;
    }

    @Override
    public List<FusionTask> listByProject(Long projectId, Long userId) {
        return list(new LambdaQueryWrapper<FusionTask>()
                .eq(FusionTask::getProjectId, projectId)
                .eq(FusionTask::getUserId, userId)
                .orderByDesc(FusionTask::getCreateTime)
                .last("LIMIT 20"));
    }

    @Async("taskExecutor")
    @Override
    public void startFusion(Long taskId) {
        FusionTask task = getById(taskId);
        if (task == null) return;

        try {
            task.setStatus(1);
            task.setProgress(10);
            updateById(task);

            List<Long> videoIds = objectMapper.readValue(task.getVideoIdsJson(), new TypeReference<List<Long>>() {});
            Thread.sleep(500);

            task.setProgress(30);
            updateById(task);
            Thread.sleep(500);

            List<VideoAnalysis> analyses = new ArrayList<>();
            List<Video> videos = new ArrayList<>();
            for (Long vid : videoIds) {
                Video v = videoService.getById(vid);
                VideoAnalysis va = videoAnalysisService.getAnalysisByVideoId(vid);
                if (v != null) videos.add(v);
                if (va != null) analyses.add(va);
            }

            task.setProgress(50);
            updateById(task);
            Thread.sleep(500);

            String scriptOutline = generateScriptOutline(videos, analyses, task.getFusionMode());
            task.setScriptOutline(scriptOutline);
            task.setProgress(75);
            updateById(task);
            Thread.sleep(500);

            List<ShotSuggestionVO> shots = generateShotSuggestions(videos, analyses, task.getFusionMode());
            task.setShotSuggestions(objectMapper.writeValueAsString(shots));

            task.setStatus(2);
            task.setProgress(100);
            updateById(task);

            log.info("融合任务完成: taskId={}", taskId);
        } catch (Exception e) {
            log.error("融合任务失败: taskId={}", taskId, e);
            task.setStatus(3);
            task.setErrorMsg(e.getMessage());
            updateById(task);
        }
    }

    private String generateScriptOutline(List<Video> videos, List<VideoAnalysis> analyses, String mode) {
        StringBuilder sb = new StringBuilder();

        switch (mode.toUpperCase()) {
            case "SCRIPT_COMPLEMENT":
                sb.append("# 脚本取长补短融合方案\n\n");
                sb.append("## 创作目标\n");
                sb.append("整合多部视频的内容优势，以互补的方式构建完整叙事。\n\n");
                sb.append("## 脚本大纲\n\n");
                for (int i = 0; i < videos.size(); i++) {
                    Video v = videos.get(i);
                    VideoAnalysis va = analyses.stream().filter(a -> a.getVideoId().equals(v.getId())).findFirst().orElse(null);
                    sb.append("### 第 ").append(i + 1).append(" 段：").append(v.getFilename()).append("\n\n");
                    sb.append("**来源**: [").append(v.getFilename()).append("]\n\n");
                    if (va != null && va.getSummary() != null) {
                        sb.append("**核心内容**: ").append(va.getSummary()).append("\n\n");
                    }
                    sb.append("**作用**: ").append(getComplementRole(i, videos.size())).append("\n\n");
                    sb.append("**建议时长**: ").append(Math.max(10, (int)(v.getDuration() != null ? v.getDuration() * 0.3 : 15))).append(" 秒\n\n");
                }
                sb.append("## 叙事脉络\n\n");
                sb.append("开场引入 → 核心内容展开 → 重点深化 → 结尾升华\n");
                break;

            case "SHOT_STYLE":
                sb.append("# 镜头风格融合方案\n\n");
                sb.append("## 风格定位\n");
                sb.append("融合各视频的镜头语言特色，形成统一而富有变化的视觉风格。\n\n");
                sb.append("## 风格分析\n\n");
                for (int i = 0; i < videos.size(); i++) {
                    Video v = videos.get(i);
                    sb.append("### ").append(v.getFilename()).append("\n\n");
                    sb.append("- **画面调性**: ").append(getStyleTone(i)).append("\n");
                    sb.append("- **节奏特点**: ").append(getStyleRhythm(i)).append("\n");
                    sb.append("- **色彩倾向**: ").append(getStyleColor(i)).append("\n\n");
                }
                sb.append("## 融合策略\n\n");
                sb.append("1. **主风格**: 以第一部视频为基调，保持整体视觉统一\n");
                sb.append("2. **风格穿插**: 在关键节点引入其他视频的镜头语言\n");
                sb.append("3. **转场设计**: 使用匹配剪辑实现风格自然过渡\n");
                break;

            case "CONTENT_RESTRUCTURE":
                sb.append("# 内容整合重构方案\n\n");
                sb.append("## 重构目标\n");
                sb.append("打破原视频叙事顺序，按照主题逻辑重新组织内容。\n\n");
                sb.append("## 主题框架\n\n");
                String[] themes = {"背景介绍", "核心概念", "实践方法", "案例分析", "总结展望"};
                for (int i = 0; i < Math.min(5, themes.length); i++) {
                    sb.append("### ").append(i + 1).append(". ").append(themes[i]).append("\n\n");
                    for (int j = 0; j < videos.size(); j++) {
                        if ((j + i) % 3 == 0) {
                            Video v = videos.get(j);
                            sb.append("- [").append(v.getFilename()).append("] 提取相关片段\n");
                        }
                    }
                    sb.append("\n");
                }
                sb.append("## 重构原则\n\n");
                sb.append("- 按主题而非按时间顺序组织\n");
                sb.append("- 每个主题段落融合多个视频的观点\n");
                sb.append("- 保持逻辑连贯性和信息密度\n");
                break;

            default:
                sb.append("# 融合创作方案\n\n");
                sb.append("模式: ").append(mode).append("\n\n");
                sb.append("已选择 ").append(videos.size()).append(" 个视频进行融合创作。\n");
        }

        return sb.toString();
    }

    private List<ShotSuggestionVO> generateShotSuggestions(List<Video> videos, List<VideoAnalysis> analyses, String mode) {
        List<ShotSuggestionVO> shots = new ArrayList<>();
        int shotIndex = 1;

        for (int i = 0; i < videos.size(); i++) {
            Video v = videos.get(i);
            VideoAnalysis va = analyses.stream().filter(a -> a.getVideoId().equals(v.getId())).findFirst().orElse(null);

            int shotCount = 3 + (i % 2);
            for (int j = 0; j < shotCount; j++) {
                int currentIndex = shotIndex;
                ShotSuggestionVO shot = new ShotSuggestionVO();
                shot.setIndex(shotIndex++);
                shot.setSourceVideoId(String.valueOf(v.getId()));
                shot.setSourceVideoName(v.getFilename());
                shot.setShotType(getShotType(currentIndex, mode));
                shot.setDescription(getShotDescription(currentIndex, i, j, v, mode));
                shot.setDuration((5 + j * 3) + "s");
                shot.setTags(getShotTags(i, j));
                shot.setPrompt(getShotPrompt(currentIndex, i, j, mode));
                shots.add(shot);

                if (shots.size() >= 12) break;
            }
            if (shots.size() >= 12) break;
        }

        return shots;
    }

    private String getComplementRole(int index, int total) {
        String[] roles = {"开场引入，建立主题基调", "深入展开，补充核心细节", "案例支撑，增强说服力", "总结升华，提炼核心观点"};
        return roles[index % roles.length];
    }

    private String getStyleTone(int index) {
        String[] tones = {"明亮清新", "沉稳大气", "温馨柔和", "动感活力"};
        return tones[index % tones.length];
    }

    private String getStyleRhythm(int index) {
        String[] rhythms = {"舒缓流畅", "快速紧凑", "张弛有度", "节奏感强"};
        return rhythms[index % rhythms.length];
    }

    private String getStyleColor(int index) {
        String[] colors = {"暖色调为主", "冷色调为主", "中性色调", "高饱和度"};
        return colors[index % colors.length];
    }

    private String getShotType(int index, String mode) {
        String[] types;
        switch (mode.toUpperCase()) {
            case "SCRIPT_COMPLEMENT":
                types = new String[]{"全景建立", "中景叙事", "特写强调", "转场过渡", "远景氛围"};
                break;
            case "SHOT_STYLE":
                types = new String[]{"风格开场", "节奏剪辑", "色彩对比", "动态镜头", "静态构图"};
                break;
            case "CONTENT_RESTRUCTURE":
                types = new String[]{"主题引入", "论点展开", "例证支撑", "过渡衔接", "总结归纳"};
                break;
            default:
                types = new String[]{"标准镜头", "特写", "全景", "中景", "远景"};
        }
        return types[index % types.length];
    }

    private String getShotDescription(int shotIndex, int videoIndex, int frameIndex, Video video, String mode) {
        String base = "来自《" + video.getFilename() + "》的第 " + (frameIndex + 1) + " 个推荐镜头";
        switch (mode.toUpperCase()) {
            case "SCRIPT_COMPLEMENT":
                return base + "，用于补充" + (videoIndex == 0 ? "开场" : "内容层次") + "部分";
            case "SHOT_STYLE":
                return base + "，具备" + getStyleTone(videoIndex) + "的视觉特征";
            case "CONTENT_RESTRUCTURE":
                return base + "，可归类到主题\"" + (frameIndex % 3 == 0 ? "背景" : frameIndex % 3 == 1 ? "方法" : "案例") + "\"中";
            default:
                return base;
        }
    }

    private String getShotTags(int videoIndex, int frameIndex) {
        String[][] tagSets = {
                {"室内,办公,讲解", "人物特写,表情", "产品展示,细节", "全景,环境,团队"},
                {"户外,自然光,运动", "人物中景,动作", "场景切换,转场", "近景,手,操作"}
        };
        return tagSets[videoIndex % tagSets.length][frameIndex % tagSets[0].length];
    }

    private String getShotPrompt(int shotIndex, int videoIndex, int frameIndex, String mode) {
        String base = "professional video shot, cinematic composition";
        String[] styles = {"bright and clean aesthetic", "warm color grading", "dynamic camera movement", "static framing with depth"};
        return base + ", " + styles[shotIndex % styles.length];
    }

    private String getModeName(String mode) {
        Map<String, String> names = new HashMap<>();
        names.put("SCRIPT_COMPLEMENT", "脚本取长补短");
        names.put("SHOT_STYLE", "镜头风格融合");
        names.put("CONTENT_RESTRUCTURE", "内容整合重构");
        return names.getOrDefault(mode, mode);
    }
}
