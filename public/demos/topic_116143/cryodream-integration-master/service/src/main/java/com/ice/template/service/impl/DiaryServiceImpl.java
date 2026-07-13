package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.mapper.DiaryMapper;
import com.ice.template.model.dto.diary.DiaryAddRequest;
import com.ice.template.model.dto.diary.DiaryQueryRequest;
import com.ice.template.model.dto.diary.DiaryTimelineQueryRequest;
import com.ice.template.model.dto.diary.DiaryUpdateRequest;
import com.ice.template.model.entity.Diary;
import com.ice.template.model.entity.TagRelation;
import com.ice.template.model.vo.DiaryVO;
import com.ice.template.model.vo.TagVO;
import com.ice.template.service.DiaryAiService;
import com.ice.template.service.DiaryService;
import com.ice.template.service.TagRelationService;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

@Service
public class DiaryServiceImpl extends ServiceImpl<DiaryMapper, Diary> implements DiaryService {

    @Resource
    private TagRelationService tagRelationService;

    @Resource
    @Lazy
    private DiaryAiService diaryAiService;

    @Override
    public String addDiary(DiaryAddRequest request) {
        if (request == null || StringUtils.isBlank(request.getContent())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "日记内容不能为空");
        }
        Diary diary = new Diary();
        BeanUtils.copyProperties(request, diary);
        if (StringUtils.isBlank(diary.getMood())) {
            diary.setMood("calm");
        }
        if (diary.getMoodScore() == null) {
            diary.setMoodScore(0);
        }
        if (diary.getDiaryDate() == null) {
            diary.setDiaryDate(new Date());
        }
        diary.setWordCount(countWords(request.getContent()));
        diary.setAiAnalysisStatus("pending");
        boolean ok = this.save(diary);
        ThrowUtils.throwIf(!ok, ErrorCode.OPERATION_ERROR);

        // 异步触发 AI 分析
        if (StringUtils.isNotBlank(request.getModelConfigId())) {
            new Thread(() -> {
                try {
                    diaryAiService.analyze(diary.getId(), request.getModelConfigId());
                } catch (Exception e) {
                    // AI 分析失败不影响日记创建
                }
            }).start();
        }

        return diary.getId();
    }

    @Override
    public boolean updateDiary(DiaryUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Diary diary = new Diary();
        BeanUtils.copyProperties(request, diary);
        if (StringUtils.isNotBlank(request.getContent())) {
            diary.setWordCount(countWords(request.getContent()));
        }
        return this.updateById(diary);
    }

    @Override
    public Page<DiaryVO> listByPage(DiaryQueryRequest request) {
        long current = request.getCurrent();
        long size = request.getPageSize();
        LambdaQueryWrapper<Diary> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.isNotBlank(request.getSearchText())) {
            String kw = "%" + request.getSearchText() + "%";
            wrapper.and(w -> w.like(Diary::getTitle, kw).or().like(Diary::getContent, kw).or().like(Diary::getSummary, kw));
        }
        if (StringUtils.isNotBlank(request.getCategory())) {
            wrapper.eq(Diary::getCategory, request.getCategory());
        }
        if (StringUtils.isNotBlank(request.getMood())) {
            wrapper.eq(Diary::getMood, request.getMood());
        }
        if (StringUtils.isNotBlank(request.getStartDate())) {
            wrapper.ge(Diary::getDiaryDate, java.sql.Date.valueOf(request.getStartDate()));
        }
        if (StringUtils.isNotBlank(request.getEndDate())) {
            wrapper.le(Diary::getDiaryDate, java.sql.Date.valueOf(request.getEndDate()));
        }
        wrapper.orderByDesc(Diary::getDiaryDate);
        Page<Diary> page = this.page(new Page<>(current, size), wrapper);
        Page<DiaryVO> voPage = new Page<>(current, size, page.getTotal());
        List<DiaryVO> voList = page.getRecords().stream().map(diary -> {
            DiaryVO vo = DiaryVO.objToVo(diary);
            vo.setTags(loadTags(diary.getId()));
            return vo;
        }).collect(Collectors.toList());
        voPage.setRecords(voList);
        return voPage;
    }

    @Override
    public DiaryVO getDiaryVO(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Diary diary = this.getById(id);
        if (diary == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        DiaryVO vo = DiaryVO.objToVo(diary);
        vo.setTags(loadTags(diary.getId()));
        return vo;
    }

    @Override
    public boolean reanalyze(String diaryId, String modelConfigId) {
        if (StringUtils.isBlank(diaryId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        new Thread(() -> diaryAiService.analyze(diaryId, modelConfigId)).start();
        return true;
    }

    @Override
    public List<Map<String, Object>> timeline(DiaryTimelineQueryRequest request) {
        LambdaQueryWrapper<Diary> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.isNotBlank(request.getStartDate())) {
            wrapper.ge(Diary::getDiaryDate, java.sql.Date.valueOf(request.getStartDate()));
        }
        if (StringUtils.isNotBlank(request.getEndDate())) {
            wrapper.le(Diary::getDiaryDate, java.sql.Date.valueOf(request.getEndDate()));
        }
        if (StringUtils.isNotBlank(request.getCategory())) {
            wrapper.eq(Diary::getCategory, request.getCategory());
        }
        if (StringUtils.isNotBlank(request.getMood())) {
            wrapper.eq(Diary::getMood, request.getMood());
        }
        wrapper.orderByDesc(Diary::getDiaryDate);
        List<Diary> diaries = this.list(wrapper);

        String granularity = StringUtils.defaultString(request.getGranularity(), "day");
        String pattern = "day".equals(granularity) ? "yyyy-MM-dd" : ("week".equals(granularity) ? "yyyy-'W'ww" : "yyyy-MM");
        SimpleDateFormat sdf = new SimpleDateFormat(pattern);

        Map<String, List<Diary>> grouped = new java.util.LinkedHashMap<>();
        for (Diary d : diaries) {
            String key = d.getDiaryDate() != null ? sdf.format(d.getDiaryDate()) : "unknown";
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(d);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<Diary>> entry : grouped.entrySet()) {
            List<Diary> bucket = entry.getValue();
            Map<String, Object> item = new HashMap<>();
            item.put("key", entry.getKey());
            item.put("count", bucket.size());
            item.put("avgMoodScore", bucket.stream().mapToInt(d -> d.getMoodScore() == null ? 0 : d.getMoodScore()).average().orElse(0));
            List<Map<String, Object>> items = bucket.stream().map(d -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", d.getId());
                m.put("title", d.getTitle());
                m.put("summary", d.getSummary());
                m.put("mood", d.getMood());
                m.put("moodScore", d.getMoodScore());
                m.put("category", d.getCategory());
                m.put("diaryDate", d.getDiaryDate());
                m.put("audioUrl", d.getAudioUrl());
                m.put("wordCount", d.getWordCount());
                return m;
            }).collect(Collectors.toList());
            item.put("items", items);
            result.add(item);
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> moodTrend(String startDate, String endDate) {
        LambdaQueryWrapper<Diary> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.isNotBlank(startDate)) {
            wrapper.ge(Diary::getDiaryDate, java.sql.Date.valueOf(startDate));
        }
        if (StringUtils.isNotBlank(endDate)) {
            wrapper.le(Diary::getDiaryDate, java.sql.Date.valueOf(endDate));
        }
        wrapper.orderByAsc(Diary::getDiaryDate);
        List<Diary> diaries = this.list(wrapper);
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        return diaries.stream().map(d -> {
            Map<String, Object> m = new HashMap<>();
            m.put("date", d.getDiaryDate() != null ? sdf.format(d.getDiaryDate()) : "");
            m.put("moodScore", d.getMoodScore() == null ? 0 : d.getMoodScore());
            m.put("mood", d.getMood());
            return m;
        }).collect(Collectors.toList());
    }

    private List<String> loadTags(String diaryId) {
        List<TagVO> tagVOs = tagRelationService.listByTarget("diary", diaryId);
        return tagVOs.stream().map(TagVO::getName).collect(Collectors.toList());
    }

    private int countWords(String text) {
        if (StringUtils.isBlank(text)) {
            return 0;
        }
        // 去掉 Markdown 标记后统计字符数
        String clean = text.replaceAll("#+\\s*", "").replaceAll("\\*+", "").replaceAll("\\[.+?\\]\\(.+?\\)", "").replaceAll("[\\s\\n\\r]+", "");
        return clean.length();
    }
}
