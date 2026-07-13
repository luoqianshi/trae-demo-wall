package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.diary.MilestoneAddRequest;
import com.ice.template.model.dto.diary.MilestoneUpdateRequest;
import com.ice.template.model.entity.DiaryMilestone;
import com.ice.template.model.vo.DiaryMilestoneVO;
import java.util.List;

public interface DiaryMilestoneService extends IService<DiaryMilestone> {

    List<DiaryMilestoneVO> listAll(String status);

    String addMilestone(MilestoneAddRequest request);

    boolean updateMilestone(MilestoneUpdateRequest request);

    boolean deleteMilestone(String id);

    boolean achieveMilestone(String id, String linkedDiaryId);
}
