package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.NovelTimelineEventMapper;
import com.ice.template.model.dto.novel.NovelTimelineEventSaveRequest;
import com.ice.template.model.dto.novel.NovelTimelineReorderRequest;
import com.ice.template.model.entity.NovelTimelineEvent;
import com.ice.template.model.vo.NovelTimelineEventVO;
import com.ice.template.service.NovelTimelineEventService;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class NovelTimelineEventServiceImpl
        extends ServiceImpl<NovelTimelineEventMapper, NovelTimelineEvent>
        implements NovelTimelineEventService {

    @Override
    public String saveEvent(NovelTimelineEventSaveRequest request) {
        if (request == null || StringUtils.isBlank(request.getNovelId())
                || StringUtils.isBlank(request.getTitle())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "缺少 novelId 或 title");
        }
        NovelTimelineEvent entity = new NovelTimelineEvent();
        BeanUtils.copyProperties(request, entity);
        if (entity.getImportance() == null) entity.setImportance(1);
        if (entity.getSortOrder() == null) {
            LambdaQueryWrapper<NovelTimelineEvent> q = new LambdaQueryWrapper<>();
            q.eq(NovelTimelineEvent::getNovelId, request.getNovelId());
            long count = this.count(q);
            entity.setSortOrder((int) count);
        }
        if (StringUtils.isNotBlank(request.getId())) {
            this.updateById(entity);
            return request.getId();
        }
        boolean ok = this.save(entity);
        if (!ok) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR);
        }
        return entity.getId();
    }

    @Override
    public List<NovelTimelineEventVO> listByNovel(String novelId) {
        if (StringUtils.isBlank(novelId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        LambdaQueryWrapper<NovelTimelineEvent> q = new LambdaQueryWrapper<>();
        q.eq(NovelTimelineEvent::getNovelId, novelId);
        q.orderByAsc(NovelTimelineEvent::getSortOrder).orderByAsc(NovelTimelineEvent::getCreateTime);
        return this.list(q).stream().map(NovelTimelineEventVO::objToVo).collect(Collectors.toList());
    }

    @Override
    public boolean reorder(NovelTimelineReorderRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return true;
        }
        for (NovelTimelineReorderRequest.Item item : request.getItems()) {
            if (StringUtils.isBlank(item.getId()) || item.getSortOrder() == null) continue;
            LambdaUpdateWrapper<NovelTimelineEvent> u = new LambdaUpdateWrapper<>();
            u.eq(NovelTimelineEvent::getId, item.getId())
                    .set(NovelTimelineEvent::getSortOrder, item.getSortOrder());
            this.update(u);
        }
        return true;
    }
}
