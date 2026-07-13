package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.tag.TagCategoryAddRequest;
import com.ice.template.model.dto.tag.TagCategoryUpdateRequest;
import com.ice.template.model.entity.TagCategory;
import com.ice.template.model.vo.TagCategoryVO;
import java.util.List;

public interface TagCategoryService extends IService<TagCategory> {

    String addCategory(TagCategoryAddRequest request);

    Boolean updateCategory(TagCategoryUpdateRequest request);

    Boolean deleteCategory(String id);

    List<TagCategoryVO> listCategories();
}
