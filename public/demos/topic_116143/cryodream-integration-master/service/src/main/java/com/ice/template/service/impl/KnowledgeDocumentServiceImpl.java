package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.constant.CommonConstant;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.mapper.KnowledgeDocumentMapper;
import com.ice.template.model.dto.knowledge.DocumentAddRequest;
import com.ice.template.model.dto.knowledge.DocumentQueryRequest;
import com.ice.template.model.dto.knowledge.DocumentUpdateRequest;
import com.ice.template.model.entity.KnowledgeBase;
import com.ice.template.model.entity.KnowledgeDocument;
import com.ice.template.model.vo.KnowledgeDocumentVO;
import com.ice.template.service.KnowledgeBaseService;
import com.ice.template.service.KnowledgeDocumentService;
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
public class KnowledgeDocumentServiceImpl extends ServiceImpl<KnowledgeDocumentMapper, KnowledgeDocument> implements KnowledgeDocumentService {

    @Resource
    private KnowledgeBaseService knowledgeBaseService;

    @Override
    public void validDocument(KnowledgeDocument document, boolean add) {
        if (document == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        if (add && StringUtils.isBlank(document.getKbId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "知识库ID不能为空");
        }
        if (add && StringUtils.isBlank(document.getTitle())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文档标题不能为空");
        }
        if (StringUtils.isNotBlank(document.getTitle()) && document.getTitle().length() > 256) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文档标题过长");
        }
        if (add) {
            KnowledgeBase knowledgeBase = knowledgeBaseService.getById(document.getKbId());
            ThrowUtils.throwIf(knowledgeBase == null, ErrorCode.NOT_FOUND_ERROR, "知识库不存在");
        }
    }

    @Override
    public String addDocument(DocumentAddRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        KnowledgeDocument document = new KnowledgeDocument();
        BeanUtils.copyProperties(request, document);
        document.setStatus("pending");
        document.setIngestionMode(StringUtils.defaultIfBlank(request.getIngestionMode(), "auto"));
        document.setChunkCount(0);
        validDocument(document, true);
        boolean result = this.save(document);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return document.getId();
    }

    @Override
    public Boolean updateDocument(DocumentUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        KnowledgeDocument oldDocument = this.getById(request.getId());
        ThrowUtils.throwIf(oldDocument == null, ErrorCode.NOT_FOUND_ERROR, "文档不存在");
        KnowledgeDocument document = new KnowledgeDocument();
        document.setId(request.getId());
        if (request.getTitle() != null) {
            document.setTitle(request.getTitle());
        }
        if (request.getRawText() != null) {
            document.setRawText(request.getRawText());
        }
        if (request.getGlobalMetadata() != null) {
            document.setGlobalMetadata(request.getGlobalMetadata());
        }
        if (request.getStatus() != null) {
            document.setStatus(request.getStatus());
        }
        if (request.getIngestionMode() != null) {
            document.setIngestionMode(request.getIngestionMode());
        }
        if (request.getResolvedIngestionMode() != null) {
            document.setResolvedIngestionMode(request.getResolvedIngestionMode());
        }
        if (request.getChunkCount() != null) {
            document.setChunkCount(request.getChunkCount());
        }
        if (request.getErrorMessage() != null) {
            document.setErrorMessage(request.getErrorMessage());
        }
        return this.updateById(document);
    }

    @Override
    public Boolean updateDocumentContent(DocumentUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        KnowledgeDocument document = this.getById(request.getId());
        ThrowUtils.throwIf(document == null, ErrorCode.NOT_FOUND_ERROR, "文档不存在");
        document.setRawText(request.getRawText());
        return this.updateById(document);
    }

    @Override
    public QueryWrapper<KnowledgeDocument> getQueryWrapper(DocumentQueryRequest request) {
        QueryWrapper<KnowledgeDocument> queryWrapper = new QueryWrapper<>();
        if (request == null) {
            return queryWrapper;
        }
        String id = request.getId();
        String kbId = request.getKbId();
        String searchText = request.getSearchText();
        String title = request.getTitle();
        String status = request.getStatus();
        String sortField = request.getSortField();
        String sortOrder = request.getSortOrder();
        queryWrapper.eq(ObjectUtils.isNotEmpty(id), "id", id);
        queryWrapper.eq(ObjectUtils.isNotEmpty(kbId), "kb_id", kbId);
        queryWrapper.like(StringUtils.isNotBlank(title), "title", title);
        queryWrapper.eq(StringUtils.isNotBlank(status), "status", status);
        if (StringUtils.isNotBlank(searchText)) {
            queryWrapper.and(qw -> qw.like("title", searchText)
                    .or().like("raw_text", searchText));
        }
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), CommonConstant.SORT_ORDER_ASC.equals(sortOrder), sortField);
        queryWrapper.orderByDesc("update_time");
        return queryWrapper;
    }

    @Override
    public KnowledgeDocumentVO getKnowledgeDocumentVO(KnowledgeDocument document) {
        return KnowledgeDocumentVO.objToVo(document);
    }

    @Override
    public List<KnowledgeDocumentVO> getKnowledgeDocumentVOList(List<KnowledgeDocument> list) {
        if (list == null) {
            return Collections.emptyList();
        }
        return list.stream().map(KnowledgeDocumentVO::objToVo).collect(Collectors.toList());
    }
}
