package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.NovelRelationMapper;
import com.ice.template.model.dto.novel.NovelRelationAddRequest;
import com.ice.template.model.dto.novel.NovelRelationUpdateRequest;
import com.ice.template.model.entity.NovelRelation;
import com.ice.template.model.vo.NovelRelationVO;
import com.ice.template.service.NovelRelationService;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class NovelRelationServiceImpl extends ServiceImpl<NovelRelationMapper, NovelRelation> implements NovelRelationService {

    @Override
    public String addRelation(NovelRelationAddRequest request) {
        if (request == null || StringUtils.isBlank(request.getNovelId())
                || StringUtils.isBlank(request.getSourceId()) || StringUtils.isBlank(request.getTargetId())
                || StringUtils.isBlank(request.getRelationType())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "缺少必要参数");
        }
        NovelRelation r = new NovelRelation();
        BeanUtils.copyProperties(request, r);
        boolean ok = this.save(r);
        if (!ok) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR);
        }
        return r.getId();
    }

    @Override
    public boolean updateRelation(NovelRelationUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        NovelRelation r = new NovelRelation();
        BeanUtils.copyProperties(request, r);
        return this.updateById(r);
    }

    @Override
    public List<NovelRelationVO> listByNovel(String novelId) {
        if (StringUtils.isBlank(novelId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        LambdaQueryWrapper<NovelRelation> q = new LambdaQueryWrapper<>();
        q.eq(NovelRelation::getNovelId, novelId);
        q.orderByAsc(NovelRelation::getCreateTime);
        return this.list(q).stream().map(NovelRelationVO::objToVo).collect(Collectors.toList());
    }
}
