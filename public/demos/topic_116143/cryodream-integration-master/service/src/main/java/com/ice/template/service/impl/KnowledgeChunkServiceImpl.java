package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.constant.CommonConstant;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.KnowledgeChunkMapper;
import com.ice.template.model.dto.knowledgechunk.ChunkQueryRequest;
import com.ice.template.model.entity.KnowledgeChunk;
import com.ice.template.model.vo.ChunkVO;
import com.ice.template.service.KnowledgeChunkService;
import com.ice.template.utils.SqlUtils;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class KnowledgeChunkServiceImpl extends ServiceImpl<KnowledgeChunkMapper, KnowledgeChunk> implements KnowledgeChunkService {

    @Override
    public QueryWrapper<KnowledgeChunk> getQueryWrapper(ChunkQueryRequest request) {
        QueryWrapper<KnowledgeChunk> queryWrapper = new QueryWrapper<>();
        if (request == null) {
            return queryWrapper;
        }
        String id = request.getId();
        String docId = request.getDocId();
        String kbId = request.getKbId();
        String chunkLevel = request.getChunkLevel();
        String searchText = request.getSearchText();
        String sortField = request.getSortField();
        String sortOrder = request.getSortOrder();
        queryWrapper.eq(ObjectUtils.isNotEmpty(id), "id", id);
        queryWrapper.eq(ObjectUtils.isNotEmpty(docId), "doc_id", docId);
        queryWrapper.eq(ObjectUtils.isNotEmpty(kbId), "kb_id", kbId);
        queryWrapper.eq(ObjectUtils.isNotEmpty(chunkLevel), "chunk_level", chunkLevel);
        if (StringUtils.isNotBlank(searchText)) {
            queryWrapper.and(qw -> qw.like("chunk_text", searchText)
                    .or().like("raw_text", searchText));
        }
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), CommonConstant.SORT_ORDER_ASC.equals(sortOrder), sortField);
        if (!SqlUtils.validSortField(sortField)) {
            queryWrapper.orderByAsc("chunk_index");
        }
        return queryWrapper;
    }

    @Override
    public ChunkVO getChunkVO(KnowledgeChunk chunk) {
        if (chunk == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ChunkVO.objToVo(chunk);
    }

    @Override
    public List<ChunkVO> getChunkVOList(List<KnowledgeChunk> list) {
        if (list == null) {
            return Collections.emptyList();
        }
        return list.stream().map(ChunkVO::objToVo).collect(Collectors.toList());
    }
}
