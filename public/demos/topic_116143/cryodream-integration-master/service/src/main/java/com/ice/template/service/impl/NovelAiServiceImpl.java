package com.ice.template.service.impl;

import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.integration.llm.OpenAiChatMessage;
import com.ice.template.integration.llm.OpenAiCompatibleClient;
import com.ice.template.model.dto.novel.NovelAiRequest;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.model.entity.NovelCharacter;
import com.ice.template.model.vo.NovelCharacterVO;
import com.ice.template.service.ModelConfigService;
import com.ice.template.service.NovelAiService;
import com.ice.template.service.NovelCharacterService;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NovelAiServiceImpl implements NovelAiService {

    private static final Logger log = LoggerFactory.getLogger(NovelAiServiceImpl.class);

    @Resource
    private ModelConfigService modelConfigService;

    @Resource
    private OpenAiCompatibleClient openAiCompatibleClient;

    @Resource
    private NovelCharacterService novelCharacterService;

    private ModelConfig requireModel(String modelConfigId) {
        if (StringUtils.isBlank(modelConfigId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "缺少 modelConfigId");
        }
        ModelConfig cfg = modelConfigService.getById(modelConfigId);
        if (cfg == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "模型配置不存在");
        }
        return cfg;
    }

    @Override
    public String continueWriting(NovelAiRequest request) {
        ModelConfig cfg = requireModel(request.getModelConfigId());
        String text = StringUtils.defaultString(request.getText());
        String instruction = StringUtils.defaultString(request.getInstruction(), "自然衔接，保持人称与语气一致。");

        List<OpenAiChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiChatMessage("system",
                "你是一位资深小说续写助手。请紧跟原文风格、人称、时态、情绪。只输出续写正文，不要输出任何解释或前后缀。"));
        messages.add(new OpenAiChatMessage("user",
                "【原文】\n" + text + "\n\n【要求】" + instruction + "\n\n请直接续写下一段（200-400 字）："));
        try {
            return openAiCompatibleClient.chat(cfg, messages, 0.8, null);
        } catch (Exception e) {
            log.error("[NovelAi] 续写失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "AI 续写失败：" + e.getMessage());
        }
    }

    @Override
    public List<String> polish(NovelAiRequest request) {
        ModelConfig cfg = requireModel(request.getModelConfigId());
        String text = StringUtils.defaultString(request.getText());
        String instruction = StringUtils.defaultString(request.getInstruction(), "更生动流畅");
        int count = request.getCandidateCount() == null ? 3 : Math.max(1, Math.min(request.getCandidateCount(), 5));

        List<OpenAiChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiChatMessage("system",
                "你是一位小说润色助手。请对给定文本进行润色，使其" + instruction + "，保持原意与人称。"
                        + "请一次性给出 " + count + " 个不同风格的候选替换，每个候选单独占一段，用 '---' 分隔。只输出候选正文，不要输出解释。"));
        messages.add(new OpenAiChatMessage("user", "【原文】\n" + text));
        try {
            String raw = openAiCompatibleClient.chat(cfg, messages, 0.9, null);
            if (StringUtils.isBlank(raw)) {
                return List.of();
            }
            String[] parts = raw.split("\\s*-{3,}\\s*");
            List<String> results = new ArrayList<>();
            for (String p : parts) {
                String t = p.trim();
                if (!t.isEmpty()) results.add(t);
            }
            return results;
        } catch (Exception e) {
            log.error("[NovelAi] 润色失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "AI 润色失败：" + e.getMessage());
        }
    }

    @Override
    public String consistencyCheck(NovelAiRequest request) {
        ModelConfig cfg = requireModel(request.getModelConfigId());
        if (StringUtils.isBlank(request.getNovelId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "缺少 novelId");
        }
        String text = StringUtils.defaultString(request.getText());
        List<NovelCharacterVO> allChars = novelCharacterService.listByNovel(request.getNovelId());
        List<NovelCharacterVO> chars;
        if (request.getCharacterIds() != null && !request.getCharacterIds().isEmpty()) {
            chars = allChars.stream()
                    .filter(c -> request.getCharacterIds().contains(c.getId()))
                    .collect(Collectors.toList());
        } else {
            chars = allChars;
        }
        if (chars.isEmpty()) {
            return "> 该小说尚无任何人物卡，无法进行一致性检查。请先创建人物设定。";
        }

        StringBuilder profile = new StringBuilder();
        for (NovelCharacterVO c : chars) {
            profile.append("- ").append(c.getName());
            if (StringUtils.isNotBlank(c.getIdentity())) profile.append("｜身份：").append(c.getIdentity());
            if (StringUtils.isNotBlank(c.getPersonality())) profile.append("｜性格：").append(oneLine(c.getPersonality()));
            if (StringUtils.isNotBlank(c.getCatchphrase())) profile.append("｜口头禅：").append(oneLine(c.getCatchphrase()));
            if (StringUtils.isNotBlank(c.getBackground())) profile.append("｜背景：").append(oneLine(c.getBackground()));
            profile.append("\n");
        }

        List<OpenAiChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiChatMessage("system",
                "你是一位小说人物一致性审校助手。请对照给定的人物卡设定，检查章节正文中人物的言行、身份、口头禅、背景是否与设定一致。"
                        + "请用 Markdown 输出偏差报告，格式：\n"
                        + "## 一致性检查报告\n"
                        + "### 潜在偏差\n"
                        + "- 【人物名】偏差描述（引用原文片段） → 建议\n"
                        + "### 未见明显偏差\n- 人物名列表\n"
                        + "只输出 Markdown 报告本身，不输出其它前后缀。"));
        messages.add(new OpenAiChatMessage("user",
                "【人物卡设定】\n" + profile + "\n【章节正文】\n" + text));
        try {
            return openAiCompatibleClient.chat(cfg, messages, 0.3, null);
        } catch (Exception e) {
            log.error("[NovelAi] 一致性检查失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "AI 一致性检查失败：" + e.getMessage());
        }
    }

    private String oneLine(String s) {
        if (s == null) return "";
        return s.replaceAll("\\s+", " ").trim();
    }

    @Override
    public String summarize(NovelAiRequest request) {
        ModelConfig cfg = requireModel(request.getModelConfigId());
        String text = StringUtils.defaultString(request.getText());
        if (StringUtils.isBlank(text)) {
            return "";
        }
        String instruction = StringUtils.defaultString(request.getInstruction(),
                "用一到两句话，客观概括本节剧情，不加评价，不要复述细节。");

        List<OpenAiChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiChatMessage("system",
                "你是一位小说编辑助手，擅长从章节正文中提炼精准的概要。"
                        + "输出只包含概要文本本身，不含任何前缀、序号、标题或引号。字数控制在 40-120 汉字。"));
        messages.add(new OpenAiChatMessage("user",
                "【要求】" + instruction + "\n\n【正文】\n" + text));
        try {
            String raw = openAiCompatibleClient.chat(cfg, messages, 0.4, null);
            if (raw == null) return "";
            return raw.trim().replaceAll("^[\"'\u201C\u201D\u2018\u2019]+|[\"'\u201C\u201D\u2018\u2019]+$", "");
        } catch (Exception e) {
            log.error("[NovelAi] 概要生成失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "AI 概要失败：" + e.getMessage());
        }
    }
}
