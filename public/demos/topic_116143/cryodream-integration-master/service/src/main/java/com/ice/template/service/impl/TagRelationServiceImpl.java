package com.ice.template.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.TagRelationMapper;
import com.ice.template.model.dto.tag.TagBindRequest;
import com.ice.template.model.entity.Tag;
import com.ice.template.model.entity.TagRelation;
import com.ice.template.model.vo.TagVO;
import com.ice.template.service.TagRelationService;
import com.ice.template.service.TagService;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TagRelationServiceImpl extends ServiceImpl<TagRelationMapper, TagRelation> implements TagRelationService {

    @Resource
    private TagService tagService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Boolean bindTags(TagBindRequest request) {
        if (request == null || StringUtils.isBlank(request.getTargetType()) || StringUtils.isBlank(request.getTargetId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "目标类型和ID不能为空");
        }
        String targetType = request.getTargetType();
        String targetId = request.getTargetId();
        // 先删除该对象的所有标签关联
        this.lambdaUpdate()
                .eq(TagRelation::getTargetType, targetType)
                .eq(TagRelation::getTargetId, targetId)
                .remove();
        // 再批量插入新关联
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            for (String tagId : request.getTagIds()) {
                TagRelation relation = new TagRelation();
                relation.setTagId(tagId);
                relation.setTargetType(targetType);
                relation.setTargetId(targetId);
                this.save(relation);
            }
        }
        return true;
    }

    @Override
    public List<TagVO> listByTarget(String targetType, String targetId) {
        if (StringUtils.isBlank(targetType) || StringUtils.isBlank(targetId)) {
            return Collections.emptyList();
        }
        List<TagRelation> relations = this.lambdaQuery()
                .eq(TagRelation::getTargetType, targetType)
                .eq(TagRelation::getTargetId, targetId)
                .list();
        if (relations.isEmpty()) {
            return Collections.emptyList();
        }
        List<String> tagIds = relations.stream().map(TagRelation::getTagId).collect(Collectors.toList());
        List<Tag> tags = tagService.listByIds(tagIds);
        return tagService.getTagVOList(tags);
    }

    @Override
    public List<String> listTargetIds(String tagId, String targetType) {
        if (StringUtils.isBlank(tagId)) {
            return Collections.emptyList();
        }
        List<TagRelation> relations = this.lambdaQuery()
                .eq(TagRelation::getTagId, tagId)
                .eq(StringUtils.isNotBlank(targetType), TagRelation::getTargetType, targetType)
                .list();
        return relations.stream().map(TagRelation::getTargetId).collect(Collectors.toList());
    }
}
