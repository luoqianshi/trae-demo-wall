package com.ice.template.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.knowledgechunk.ChunkQueryRequest;
import com.ice.template.model.entity.KnowledgeChunk;
import com.ice.template.model.vo.ChunkVO;
import com.ice.template.service.KnowledgeChunkService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import javax.annotation.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chunk")
@Api(tags = "Chunk接口")
public class KnowledgeChunkController {

    @Resource
    private KnowledgeChunkService chunkService;

    @GetMapping("/get")
    @ApiOperation("根据 id 查询 Chunk")
    public BaseResponse<ChunkVO> getChunkById(String id) {
        if (id == null || id.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        KnowledgeChunk chunk = chunkService.getById(id);
        ThrowUtils.throwIf(chunk == null, ErrorCode.NOT_FOUND_ERROR, "Chunk不存在");
        return ResultUtils.success(chunkService.getChunkVO(chunk));
    }

    @PostMapping("/list/page")
    @ApiOperation("分页查询Chunk")
    public BaseResponse<Page<ChunkVO>> listChunkByPage(@RequestBody ChunkQueryRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = request.getCurrent();
        long size = request.getPageSize();
        Page<KnowledgeChunk> page = chunkService.page(new Page<>(current, size),
                chunkService.getQueryWrapper(request));
        Page<ChunkVO> voPage = new Page<>(current, size, page.getTotal());
        voPage.setRecords(chunkService.getChunkVOList(page.getRecords()));
        return ResultUtils.success(voPage);
    }
}
