package com.ice.template.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.knowledge.DocumentAddRequest;
import com.ice.template.model.dto.knowledge.DocumentQueryRequest;
import com.ice.template.model.dto.knowledge.DocumentUpdateRequest;
import com.ice.template.model.entity.KnowledgeDocument;
import com.ice.template.model.vo.KnowledgeDocumentVO;
import java.util.List;

public interface KnowledgeDocumentService extends IService<KnowledgeDocument> {

    void validDocument(KnowledgeDocument document, boolean add);

    String addDocument(DocumentAddRequest request);

    Boolean updateDocument(DocumentUpdateRequest request);

    Boolean updateDocumentContent(DocumentUpdateRequest request);

    QueryWrapper<KnowledgeDocument> getQueryWrapper(DocumentQueryRequest request);

    KnowledgeDocumentVO getKnowledgeDocumentVO(KnowledgeDocument document);

    List<KnowledgeDocumentVO> getKnowledgeDocumentVOList(List<KnowledgeDocument> list);
}
