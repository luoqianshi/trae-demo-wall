package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.constant.CommonConstant;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.mapper.KnowledgeBaseMapper;
import com.ice.template.model.dto.knowledgebase.KnowledgeBaseAddRequest;
import com.ice.template.model.dto.knowledgebase.KnowledgeBaseQueryRequest;
import com.ice.template.model.dto.knowledgebase.KnowledgeBaseUpdateRequest;
import com.ice.template.model.entity.KnowledgeBase;
import com.ice.template.model.vo.KnowledgeBaseVO;
import com.ice.template.service.KnowledgeBaseService;
import com.ice.template.utils.SqlUtils;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class KnowledgeBaseServiceImpl extends ServiceImpl<KnowledgeBaseMapper, KnowledgeBase> implements KnowledgeBaseService {

    @Override
    public void validKnowledgeBase(KnowledgeBase knowledgeBase, boolean add) {
        if (knowledgeBase == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        if (add && StringUtils.isBlank(knowledgeBase.getProjectId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "项目ID不能为空");
        }
        if (add && StringUtils.isBlank(knowledgeBase.getName())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库名称不能为空");
        }
        if (StringUtils.isNotBlank(knowledgeBase.getName()) && knowledgeBase.getName().length() > 128) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库名称过长");
        }
        if (StringUtils.isNotBlank(knowledgeBase.getDescription()) && knowledgeBase.getDescription().length() > 1024) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库描述过长");
        }
    }

    @Override
    public String addKnowledgeBase(KnowledgeBaseAddRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        KnowledgeBase knowledgeBase = new KnowledgeBase();
        BeanUtils.copyProperties(request, knowledgeBase);
        knowledgeBase.setChunkCount(0);
        validKnowledgeBase(knowledgeBase, true);
        boolean result = this.save(knowledgeBase);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return knowledgeBase.getId();
    }

    @Override
    public Boolean updateKnowledgeBase(KnowledgeBaseUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        KnowledgeBase oldKnowledgeBase = this.getById(request.getId());
        ThrowUtils.throwIf(oldKnowledgeBase == null, ErrorCode.NOT_FOUND_ERROR, "知识库不存在");
        KnowledgeBase knowledgeBase = new KnowledgeBase();
        knowledgeBase.setId(request.getId());
        knowledgeBase.setName(request.getName());
        knowledgeBase.setDescription(request.getDescription());
        knowledgeBase.setDomain(request.getDomain());
        knowledgeBase.setEmbeddingModelId(request.getEmbeddingModelId());
        validKnowledgeBase(knowledgeBase, false);
        return this.updateById(knowledgeBase);
    }

    @Override
    public QueryWrapper<KnowledgeBase> getQueryWrapper(KnowledgeBaseQueryRequest request) {
        QueryWrapper<KnowledgeBase> queryWrapper = new QueryWrapper<>();
        if (request == null) {
            return queryWrapper;
        }
        String id = request.getId();
        String projectId = request.getProjectId();
        String searchText = request.getSearchText();
        String name = request.getName();
        String domain = request.getDomain();
        String sortField = request.getSortField();
        String sortOrder = request.getSortOrder();
        queryWrapper.eq(ObjectUtils.isNotEmpty(id), "id", id);
        queryWrapper.eq(ObjectUtils.isNotEmpty(projectId), "project_id", projectId);
        queryWrapper.like(StringUtils.isNotBlank(name), "name", name);
        queryWrapper.eq(StringUtils.isNotBlank(domain), "domain", domain);
        if (StringUtils.isNotBlank(searchText)) {
            queryWrapper.and(qw -> qw.like("name", searchText)
                    .or().like("description", searchText));
        }
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), CommonConstant.SORT_ORDER_ASC.equals(sortOrder), sortField);
        queryWrapper.orderByDesc("update_time");
        return queryWrapper;
    }

    @Override
    public KnowledgeBaseVO getKnowledgeBaseVO(KnowledgeBase knowledgeBase) {
        return KnowledgeBaseVO.objToVo(knowledgeBase);
    }

    @Override
    public List<KnowledgeBaseVO> getKnowledgeBaseVOList(List<KnowledgeBase> list) {
        if (list == null) {
            return Collections.emptyList();
        }
        return list.stream().map(KnowledgeBaseVO::objToVo).collect(Collectors.toList());
    }
}
