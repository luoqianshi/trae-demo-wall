package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.mapper.TagCategoryMapper;
import com.ice.template.mapper.TagMapper;
import com.ice.template.model.dto.tag.TagAddRequest;
import com.ice.template.model.dto.tag.TagQueryRequest;
import com.ice.template.model.dto.tag.TagUpdateRequest;
import com.ice.template.model.entity.Tag;
import com.ice.template.model.entity.TagCategory;
import com.ice.template.model.vo.TagVO;
import com.ice.template.service.TagService;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class TagServiceImpl extends ServiceImpl<TagMapper, Tag> implements TagService {

    @Resource
    private TagCategoryMapper tagCategoryMapper;

    @Override
    public String addTag(TagAddRequest request) {
        if (request == null || StringUtils.isBlank(request.getName())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "标签名称不能为空");
        }
        Tag tag = new Tag();
        BeanUtils.copyProperties(request, tag);
        // 强制继承分类主色，标签不单独设颜色
        if (StringUtils.isNotBlank(tag.getCategoryId())) {
            TagCategory category = tagCategoryMapper.selectById(tag.getCategoryId());
            if (category != null) {
                tag.setColor(category.getColor());
            }
        }
        if (StringUtils.isBlank(tag.getColor())) {
            tag.setColor("gray");
        }
        boolean result = this.save(tag);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return tag.getId();
    }

    @Override
    public Boolean updateTag(TagUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Tag oldTag = this.getById(request.getId());
        ThrowUtils.throwIf(oldTag == null, ErrorCode.NOT_FOUND_ERROR, "标签不存在");
        Tag tag = new Tag();
        tag.setId(request.getId());
        if (request.getCategoryId() != null) {
            tag.setCategoryId(request.getCategoryId());
            // 切换分类时继承新分类的颜色
            TagCategory category = tagCategoryMapper.selectById(request.getCategoryId());
            if (category != null) {
                tag.setColor(category.getColor());
            }
        }
        if (request.getName() != null) {
            tag.setName(request.getName());
        }
        if (request.getSort() != null) {
            tag.setSort(request.getSort());
        }
        return this.updateById(tag);
    }

    @Override
    public Boolean deleteTag(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Tag tag = this.getById(id);
        ThrowUtils.throwIf(tag == null, ErrorCode.NOT_FOUND_ERROR, "标签不存在");
        return this.removeById(id);
    }

    @Override
    public QueryWrapper<Tag> getQueryWrapper(TagQueryRequest request) {
        QueryWrapper<Tag> queryWrapper = new QueryWrapper<>();
        if (request == null) {
            return queryWrapper;
        }
        String categoryId = request.getCategoryId();
        String name = request.getName();
        String searchText = request.getSearchText();
        queryWrapper.eq(ObjectUtils.isNotEmpty(categoryId), "category_id", categoryId);
        if (StringUtils.isNotBlank(name)) {
            queryWrapper.like("name", name);
        }
        if (StringUtils.isNotBlank(searchText)) {
            queryWrapper.like("name", searchText);
        }
        queryWrapper.orderByAsc("sort").orderByDesc("create_time");
        return queryWrapper;
    }

    @Override
    public TagVO getTagVO(Tag tag) {
        if (tag == null) {
            return null;
        }
        TagVO vo = TagVO.objToVo(tag);
        if (StringUtils.isNotBlank(tag.getCategoryId())) {
            TagCategory category = tagCategoryMapper.selectById(tag.getCategoryId());
            if (category != null) {
                vo.setCategoryName(category.getName());
                vo.setCategoryColor(category.getColor());
            }
        }
        return vo;
    }

    @Override
    public List<TagVO> getTagVOList(List<Tag> list) {
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }
        return list.stream().map(this::getTagVO).collect(Collectors.toList());
    }

    @Override
    public List<TagVO> listAllTags() {
        List<Tag> tags = this.lambdaQuery()
                .orderByAsc(Tag::getSort)
                .orderByDesc(Tag::getCreateTime)
                .list();
        return getTagVOList(tags);
    }
}
