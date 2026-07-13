package com.ice.template.service.impl;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.integration.llm.OpenAiChatMessage;
import com.ice.template.integration.llm.OpenAiCompatibleClient;
import com.ice.template.model.dto.tag.TagAddRequest;
import com.ice.template.model.entity.Diary;
import com.ice.template.model.entity.DiaryCategory;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.model.entity.Tag;
import com.ice.template.model.vo.DiaryVO;
import com.ice.template.service.DiaryAiService;
import com.ice.template.service.DiaryCategoryService;
import com.ice.template.service.DiaryService;
import com.ice.template.service.ModelConfigService;
import com.ice.template.service.TagRelationService;
import com.ice.template.service.TagService;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class DiaryAiServiceImpl implements DiaryAiService {

    private static final Logger log = LoggerFactory.getLogger(DiaryAiServiceImpl.class);

    @Resource
    private ModelConfigService modelConfigService;

    @Resource
    private OpenAiCompatibleClient openAiCompatibleClient;

    @Resource
    private DiaryService diaryService;

    @Resource
    private DiaryCategoryService diaryCategoryService;

    @Resource
    private TagService tagService;

    @Resource
    private TagRelationService tagRelationService;

    @Override
    public void analyze(String diaryId, String modelConfigId) {
        if (StringUtils.isAnyBlank(diaryId, modelConfigId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "缺少 diaryId 或 modelConfigId");
        }
        ModelConfig cfg = modelConfigService.getById(modelConfigId);
        if (cfg == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "模型配置不存在");
        }
        Diary diary = diaryService.getById(diaryId);
        if (diary == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }

        // 标记为分析中
        Diary statusUpdate = new Diary();
        statusUpdate.setId(diaryId);
        statusUpdate.setAiAnalysisStatus("running");
        diaryService.updateById(statusUpdate);

        try {
            // 构建分类池
            List<DiaryCategory> categories = diaryCategoryService.list();
            String categoryPool = categories.stream()
                    .map(DiaryCategory::getName)
                    .collect(Collectors.joining(" / "));

            String content = StringUtils.defaultString(diary.getContent());

            List<OpenAiChatMessage> messages = new ArrayList<>();
            messages.add(new OpenAiChatMessage("system",
                    "你是一位日记助手，请对以下日记正文做结构化分析。\n\n"
                    + "分类池：" + categoryPool + "\n"
                    + "情绪枚举：joy(喜悦) / calm(平静) / anxious(焦虑) / sad(低落) / angry(愤怒) / confused(困惑)\n"
                    + "情绪打分：-2(极负) ~ +2(极正)\n\n"
                    + "请仅返回 JSON（不要 Markdown 代码块）：\n"
                    + "{\"category\":\"从分类池中选一个\",\"mood\":\"情绪枚举之一\","
                    + "\"moodScore\":-2到2的整数,\"shortSummary\":\"20字以内的一句话总结\","
                    + "\"summary\":\"60字以内摘要\","
                    + "\"tags\":[\"3-5个关键词标签\"]}"));
            messages.add(new OpenAiChatMessage("user", "日记正文：\n\"\"\"" + content + "\"\"\""));

            String raw = openAiCompatibleClient.chat(cfg, messages, 0.3, null);
            log.info("[DiaryAi] LLM 返回: {}", raw);

            JSONObject json = parseJson(raw);

            // 更新日记
            Diary update = new Diary();
            update.setId(diaryId);
            update.setSummary(json.getStr("summary", ""));
            update.setShortSummary(json.getStr("shortSummary", ""));
            update.setCategory(json.getStr("category", ""));
            update.setMood(json.getStr("mood", "calm"));
            update.setMoodScore(json.getInt("moodScore", 0));
            update.setAiAnalysisStatus("done");
            update.setAiRawResponse(raw);
            diaryService.updateById(update);

            // 处理标签
            JSONArray tagsArr = json.getJSONArray("tags");
            if (tagsArr != null && !tagsArr.isEmpty()) {
                bindTags(diaryId, tagsArr.toList(String.class));
            }

            log.info("[DiaryAi] 日记 {} 分析完成", diaryId);
        } catch (Exception e) {
            log.error("[DiaryAi] 日记 {} 分析失败", diaryId, e);
            Diary failUpdate = new Diary();
            failUpdate.setId(diaryId);
            failUpdate.setAiAnalysisStatus("failed");
            diaryService.updateById(failUpdate);
        }
    }

    @Override
    public DiaryVO getAnalysisResult(String diaryId) {
        return diaryService.getDiaryVO(diaryId);
    }

    private JSONObject parseJson(String raw) {
        if (StringUtils.isBlank(raw)) {
            throw new RuntimeException("LLM 返回为空");
        }
        // 去掉可能的 Markdown 代码块包裹
        String cleaned = raw.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("^```\\w*\\n?", "").replaceAll("\\n?```$", "");
        }
        try {
            return JSONUtil.parseObj(cleaned);
        } catch (Exception e) {
            // 尝试提取 JSON 片段
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start >= 0 && end > start) {
                return JSONUtil.parseObj(cleaned.substring(start, end + 1));
            }
            throw new RuntimeException("无法解析 LLM 返回为 JSON: " + e.getMessage());
        }
    }

    private void bindTags(String diaryId, List<String> tagNames) {
        // 查或建"日记标签"分类下的标签
        for (String tagName : tagNames) {
            if (StringUtils.isBlank(tagName)) continue;
            String trimmed = tagName.trim();
            // 先查是否已存在同名标签
            LambdaQueryWrapper<Tag> tagQuery = new LambdaQueryWrapper<>();
            tagQuery.eq(Tag::getName, trimmed);
            Tag tag = tagService.getOne(tagQuery, false);
            if (tag == null) {
                TagAddRequest tagReq = new TagAddRequest();
                tagReq.setName(trimmed);
                tagReq.setColor("blue");
                String tagId = tagService.addTag(tagReq);
                tag = new Tag();
                tag.setId(tagId);
            }
            // 绑定（先查重）
            List<String> existing = tagRelationService.listTargetIds(tag.getId(), "diary");
            if (!existing.contains(diaryId)) {
                com.ice.template.model.dto.tag.TagBindRequest bindReq = new com.ice.template.model.dto.tag.TagBindRequest();
                bindReq.setTargetType("diary");
                bindReq.setTargetId(diaryId);
                bindReq.setTagIds(List.of(tag.getId()));
                tagRelationService.bindTags(bindReq);
            }
        }
    }
}
