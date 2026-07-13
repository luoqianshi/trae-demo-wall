package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.NovelCharacterSnapshotMapper;
import com.ice.template.model.dto.novel.NovelCharacterSnapshotSaveRequest;
import com.ice.template.model.entity.NovelCharacterSnapshot;
import com.ice.template.model.vo.NovelCharacterSnapshotVO;
import com.ice.template.service.NovelCharacterSnapshotService;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class NovelCharacterSnapshotServiceImpl
        extends ServiceImpl<NovelCharacterSnapshotMapper, NovelCharacterSnapshot>
        implements NovelCharacterSnapshotService {

    @Override
    public String saveSnapshot(NovelCharacterSnapshotSaveRequest request) {
        if (request == null || StringUtils.isBlank(request.getNovelId())
                || StringUtils.isBlank(request.getCharacterId())
                || StringUtils.isBlank(request.getLabel())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "缺少必要参数");
        }
        NovelCharacterSnapshot entity = new NovelCharacterSnapshot();
        BeanUtils.copyProperties(request, entity);
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
    public List<NovelCharacterSnapshotVO> listByCharacter(String characterId) {
        if (StringUtils.isBlank(characterId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        LambdaQueryWrapper<NovelCharacterSnapshot> q = new LambdaQueryWrapper<>();
        q.eq(NovelCharacterSnapshot::getCharacterId, characterId);
        q.orderByAsc(NovelCharacterSnapshot::getSortOrder).orderByAsc(NovelCharacterSnapshot::getCreateTime);
        return this.list(q).stream().map(NovelCharacterSnapshotVO::objToVo).collect(Collectors.toList());
    }

    @Override
    public List<NovelCharacterSnapshotVO> listByNovel(String novelId) {
        if (StringUtils.isBlank(novelId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        LambdaQueryWrapper<NovelCharacterSnapshot> q = new LambdaQueryWrapper<>();
        q.eq(NovelCharacterSnapshot::getNovelId, novelId);
        q.orderByAsc(NovelCharacterSnapshot::getSortOrder).orderByAsc(NovelCharacterSnapshot::getCreateTime);
        return this.list(q).stream().map(NovelCharacterSnapshotVO::objToVo).collect(Collectors.toList());
    }

    @Override
    public List<NovelCharacterSnapshotVO> listByEvent(String eventId) {
        if (StringUtils.isBlank(eventId)) {
            return List.of();
        }
        LambdaQueryWrapper<NovelCharacterSnapshot> q = new LambdaQueryWrapper<>();
        q.eq(NovelCharacterSnapshot::getEventId, eventId);
        return this.list(q).stream().map(NovelCharacterSnapshotVO::objToVo).collect(Collectors.toList());
    }
}
