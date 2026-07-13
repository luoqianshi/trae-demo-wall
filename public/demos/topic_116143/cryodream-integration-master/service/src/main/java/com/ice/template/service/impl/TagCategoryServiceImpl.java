package com.ice.template.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.mapper.TagCategoryMapper;
import com.ice.template.model.dto.tag.TagCategoryAddRequest;
import com.ice.template.model.dto.tag.TagCategoryUpdateRequest;
import com.ice.template.model.entity.Tag;
import com.ice.template.model.entity.TagCategory;
import com.ice.template.model.vo.TagCategoryVO;
import com.ice.template.model.vo.TagVO;
import com.ice.template.service.TagCategoryService;
import com.ice.template.service.TagService;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class TagCategoryServiceImpl extends ServiceImpl<TagCategoryMapper, TagCategory> implements TagCategoryService {

    @Resource
    private TagService tagService;

    @Override
    public String addCategory(TagCategoryAddRequest request) {
        if (request == null || StringUtils.isBlank(request.getName())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "分类名称不能为空");
        }
        TagCategory category = new TagCategory();
        BeanUtils.copyProperties(request, category);
        if (StringUtils.isBlank(category.getColor())) {
            category.setColor("gray");
        }
        boolean result = this.save(category);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return category.getId();
    }

    @Override
    public Boolean updateCategory(TagCategoryUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        TagCategory oldCategory = this.getById(request.getId());
        ThrowUtils.throwIf(oldCategory == null, ErrorCode.NOT_FOUND_ERROR, "分类不存在");
        TagCategory category = new TagCategory();
        category.setId(request.getId());
        if (request.getName() != null) {
            category.setName(request.getName());
        }
        if (request.getColor() != null) {
            category.setColor(request.getColor());
        }
        if (request.getSort() != null) {
            category.setSort(request.getSort());
        }
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }
        boolean result = this.updateById(category);
        // 分类颜色变更时，同步更新该分类下所有标签的颜色
        if (result && request.getColor() != null) {
            List<Tag> tags = tagService.lambdaQuery().eq(Tag::getCategoryId, request.getId()).list();
            for (Tag tag : tags) {
                Tag updateTag = new Tag();
                updateTag.setId(tag.getId());
                updateTag.setColor(request.getColor());
                tagService.updateById(updateTag);
            }
        }
        return result;
    }

    @Override
    public Boolean deleteCategory(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        TagCategory category = this.getById(id);
        ThrowUtils.throwIf(category == null, ErrorCode.NOT_FOUND_ERROR, "分类不存在");
        // 删除分类时，其下标签的 categoryId 置空（变为未分类）
        List<Tag> tags = tagService.lambdaQuery().eq(Tag::getCategoryId, id).list();
        for (Tag tag : tags) {
            Tag updateTag = new Tag();
            updateTag.setId(tag.getId());
            updateTag.setCategoryId(null);
            tagService.updateById(updateTag);
        }
        return this.removeById(id);
    }

    @Override
    public List<TagCategoryVO> listCategories() {
        List<TagCategory> categories = this.lambdaQuery()
                .orderByAsc(TagCategory::getSort)
                .orderByDesc(TagCategory::getCreateTime)
                .list();
        if (categories == null || categories.isEmpty()) {
            return Collections.emptyList();
        }
        return categories.stream().map(category -> {
            TagCategoryVO vo = TagCategoryVO.objToVo(category);
            List<TagVO> tagVOs = tagService.getTagVOList(
                    tagService.lambdaQuery().eq(Tag::getCategoryId, category.getId())
                            .orderByAsc(Tag::getSort)
                            .orderByDesc(Tag::getCreateTime)
                            .list());
            vo.setTags(tagVOs);
            return vo;
        }).collect(Collectors.toList());
    }
}
