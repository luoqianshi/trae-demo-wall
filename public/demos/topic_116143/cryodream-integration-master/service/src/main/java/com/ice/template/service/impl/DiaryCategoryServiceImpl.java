package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.DiaryCategoryMapper;
import com.ice.template.model.dto.diary.DiaryCategoryAddRequest;
import com.ice.template.model.dto.diary.DiaryCategoryUpdateRequest;
import com.ice.template.model.entity.DiaryCategory;
import com.ice.template.model.vo.DiaryCategoryVO;
import com.ice.template.service.DiaryCategoryService;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class DiaryCategoryServiceImpl extends ServiceImpl<DiaryCategoryMapper, DiaryCategory> implements DiaryCategoryService {

    @Override
    public List<DiaryCategoryVO> listAll() {
        LambdaQueryWrapper<DiaryCategory> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(DiaryCategory::getSort);
        List<DiaryCategory> categories = this.list(wrapper);
        return categories.stream().map(DiaryCategoryVO::objToVo).collect(Collectors.toList());
    }

    @Override
    public String addCategory(DiaryCategoryAddRequest request) {
        if (request == null || StringUtils.isBlank(request.getName())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "分类名称不能为空");
        }
        DiaryCategory category = new DiaryCategory();
        BeanUtils.copyProperties(request, category);
        category.setUserId("SYSTEM");
        category.setIsPreset(0);
        if (StringUtils.isBlank(category.getColor())) {
            category.setColor("gray");
        }
        if (StringUtils.isBlank(category.getIcon())) {
            category.setIcon("Circle");
        }
        if (category.getSort() == null) {
            category.setSort(99);
        }
        boolean ok = this.save(category);
        if (!ok) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR);
        }
        return category.getId();
    }

    @Override
    public boolean updateCategory(DiaryCategoryUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        DiaryCategory category = new DiaryCategory();
        BeanUtils.copyProperties(request, category);
        return this.updateById(category);
    }

    @Override
    public boolean deleteCategory(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        DiaryCategory category = this.getById(id);
        if (category == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        if (category.getIsPreset() != null && category.getIsPreset() == 1) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "预设分类不能删除");
        }
        return this.removeById(id);
    }
}
