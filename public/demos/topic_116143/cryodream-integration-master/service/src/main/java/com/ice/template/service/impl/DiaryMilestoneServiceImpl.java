package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.DiaryMilestoneMapper;
import com.ice.template.model.dto.diary.MilestoneAddRequest;
import com.ice.template.model.dto.diary.MilestoneUpdateRequest;
import com.ice.template.model.entity.DiaryMilestone;
import com.ice.template.model.vo.DiaryMilestoneVO;
import com.ice.template.service.DiaryMilestoneService;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class DiaryMilestoneServiceImpl extends ServiceImpl<DiaryMilestoneMapper, DiaryMilestone> implements DiaryMilestoneService {

    @Override
    public List<DiaryMilestoneVO> listAll(String status) {
        LambdaQueryWrapper<DiaryMilestone> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.isNotBlank(status)) {
            wrapper.eq(DiaryMilestone::getStatus, status);
        }
        wrapper.orderByAsc(DiaryMilestone::getSort).orderByDesc(DiaryMilestone::getTargetDate);
        List<DiaryMilestone> milestones = this.list(wrapper);
        return milestones.stream().map(DiaryMilestoneVO::objToVo).collect(Collectors.toList());
    }

    @Override
    public String addMilestone(MilestoneAddRequest request) {
        if (request == null || StringUtils.isBlank(request.getTitle())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "标题不能为空");
        }
        DiaryMilestone milestone = new DiaryMilestone();
        BeanUtils.copyProperties(request, milestone);
        milestone.setUserId("SYSTEM");
        milestone.setStatus("active");
        if (StringUtils.isBlank(milestone.getColor())) {
            milestone.setColor("blue");
        }
        if (milestone.getSort() == null) {
            milestone.setSort(0);
        }
        boolean ok = this.save(milestone);
        if (!ok) throw new BusinessException(ErrorCode.OPERATION_ERROR);
        return milestone.getId();
    }

    @Override
    public boolean updateMilestone(MilestoneUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        DiaryMilestone milestone = new DiaryMilestone();
        BeanUtils.copyProperties(request, milestone);
        return this.updateById(milestone);
    }

    @Override
    public boolean deleteMilestone(String id) {
        if (StringUtils.isBlank(id)) throw new BusinessException(ErrorCode.PARAMS_ERROR);
        return this.removeById(id);
    }

    @Override
    public boolean achieveMilestone(String id, String linkedDiaryId) {
        if (StringUtils.isBlank(id)) throw new BusinessException(ErrorCode.PARAMS_ERROR);
        DiaryMilestone milestone = new DiaryMilestone();
        milestone.setId(id);
        milestone.setStatus("achieved");
        milestone.setAchievedDate(new Date());
        if (StringUtils.isNotBlank(linkedDiaryId)) {
            milestone.setLinkedDiaryId(linkedDiaryId);
        }
        return this.updateById(milestone);
    }
}
