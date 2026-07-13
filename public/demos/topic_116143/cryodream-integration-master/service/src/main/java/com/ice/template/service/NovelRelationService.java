package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.novel.NovelRelationAddRequest;
import com.ice.template.model.dto.novel.NovelRelationUpdateRequest;
import com.ice.template.model.entity.NovelRelation;
import com.ice.template.model.vo.NovelRelationVO;
import java.util.List;

public interface NovelRelationService extends IService<NovelRelation> {

    String addRelation(NovelRelationAddRequest request);

    boolean updateRelation(NovelRelationUpdateRequest request);

    List<NovelRelationVO> listByNovel(String novelId);
}
