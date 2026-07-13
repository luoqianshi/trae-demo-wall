package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.diary.DiaryCategoryAddRequest;
import com.ice.template.model.dto.diary.DiaryCategoryUpdateRequest;
import com.ice.template.model.entity.DiaryCategory;
import com.ice.template.model.vo.DiaryCategoryVO;
import java.util.List;

public interface DiaryCategoryService extends IService<DiaryCategory> {

    List<DiaryCategoryVO> listAll();

    String addCategory(DiaryCategoryAddRequest request);

    boolean updateCategory(DiaryCategoryUpdateRequest request);

    boolean deleteCategory(String id);
}
