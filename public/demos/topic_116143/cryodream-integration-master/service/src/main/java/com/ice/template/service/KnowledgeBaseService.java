package com.ice.template.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.knowledgebase.KnowledgeBaseAddRequest;
import com.ice.template.model.dto.knowledgebase.KnowledgeBaseQueryRequest;
import com.ice.template.model.dto.knowledgebase.KnowledgeBaseUpdateRequest;
import com.ice.template.model.entity.KnowledgeBase;
import com.ice.template.model.vo.KnowledgeBaseVO;
import java.util.List;

public interface KnowledgeBaseService extends IService<KnowledgeBase> {

    void validKnowledgeBase(KnowledgeBase knowledgeBase, boolean add);

    String addKnowledgeBase(KnowledgeBaseAddRequest request);

    Boolean updateKnowledgeBase(KnowledgeBaseUpdateRequest request);

    QueryWrapper<KnowledgeBase> getQueryWrapper(KnowledgeBaseQueryRequest request);

    KnowledgeBaseVO getKnowledgeBaseVO(KnowledgeBase knowledgeBase);

    List<KnowledgeBaseVO> getKnowledgeBaseVOList(List<KnowledgeBase> list);
}
