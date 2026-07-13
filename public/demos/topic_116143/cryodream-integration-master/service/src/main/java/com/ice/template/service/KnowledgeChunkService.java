package com.ice.template.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.knowledgechunk.ChunkQueryRequest;
import com.ice.template.model.entity.KnowledgeChunk;
import com.ice.template.model.vo.ChunkVO;
import java.util.List;

public interface KnowledgeChunkService extends IService<KnowledgeChunk> {

    QueryWrapper<KnowledgeChunk> getQueryWrapper(ChunkQueryRequest request);

    ChunkVO getChunkVO(KnowledgeChunk chunk);

    List<ChunkVO> getChunkVOList(List<KnowledgeChunk> list);
}
