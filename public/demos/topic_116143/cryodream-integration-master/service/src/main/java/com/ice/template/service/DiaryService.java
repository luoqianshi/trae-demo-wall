package com.ice.template.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.diary.DiaryAddRequest;
import com.ice.template.model.dto.diary.DiaryQueryRequest;
import com.ice.template.model.dto.diary.DiaryTimelineQueryRequest;
import com.ice.template.model.dto.diary.DiaryUpdateRequest;
import com.ice.template.model.entity.Diary;
import com.ice.template.model.vo.DiaryVO;
import java.util.List;
import java.util.Map;

public interface DiaryService extends IService<Diary> {

    String addDiary(DiaryAddRequest request);

    boolean updateDiary(DiaryUpdateRequest request);

    Page<DiaryVO> listByPage(DiaryQueryRequest request);

    DiaryVO getDiaryVO(String id);

    /** 重新触发 AI 分析 */
    boolean reanalyze(String diaryId, String modelConfigId);

    /** 时间线聚合 */
    List<Map<String, Object>> timeline(DiaryTimelineQueryRequest request);

    /** 情绪趋势 */
    List<Map<String, Object>> moodTrend(String startDate, String endDate);
}
