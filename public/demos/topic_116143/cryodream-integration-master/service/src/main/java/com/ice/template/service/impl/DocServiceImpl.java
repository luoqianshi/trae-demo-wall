package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.DocMapper;
import com.ice.template.model.dto.document.DocumentQueryRequest;
import com.ice.template.model.dto.document.DocumentUpdateRequest;
import com.ice.template.model.entity.Doc;
import com.ice.template.model.vo.DocVO;
import com.ice.template.service.DocService;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class DocServiceImpl extends ServiceImpl<DocMapper, Doc> implements DocService {

    @Override
    public Page<DocVO> listByPage(DocumentQueryRequest request) {
        long current = request.getCurrent();
        long size = request.getPageSize();
        LambdaQueryWrapper<Doc> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StringUtils.isNotBlank(request.getProjectId()), Doc::getProjectId, request.getProjectId());
        wrapper.eq(StringUtils.isNotBlank(request.getStatus()), Doc::getStatus, request.getStatus());
        if (StringUtils.isNotBlank(request.getSearchText())) {
            wrapper.and(w -> w.like(Doc::getTitle, request.getSearchText())
                    .or().like(Doc::getContent, request.getSearchText()));
        }
        wrapper.orderByDesc(Doc::getUpdateTime);
        Page<Doc> page = this.page(new Page<>(current, size), wrapper);
        Page<DocVO> voPage = new Page<>(current, size, page.getTotal());
        List<DocVO> voList = page.getRecords().stream()
                .map(doc -> {
                    DocVO vo = DocVO.objToVo(doc);
                    // 列表不返回content，减少数据量
                    vo.setContent(null);
                    return vo;
                })
                .collect(Collectors.toList());
        voPage.setRecords(voList);
        return voPage;
    }

    @Override
    public boolean updateDocument(DocumentUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Doc doc = new Doc();
        doc.setId(request.getId());
        if (request.getTitle() != null) {
            doc.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            doc.setContent(request.getContent());
        }
        if (request.getTags() != null) {
            doc.setTags(request.getTags());
        }
        if (request.getStatus() != null) {
            doc.setStatus(request.getStatus());
        }
        return this.updateById(doc);
    }
}
