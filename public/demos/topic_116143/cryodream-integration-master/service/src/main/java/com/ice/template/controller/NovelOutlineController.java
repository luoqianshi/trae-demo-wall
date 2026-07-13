package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.novel.NovelOutlineAddRequest;
import com.ice.template.model.dto.novel.NovelOutlineReorderRequest;
import com.ice.template.model.dto.novel.NovelOutlineUpdateRequest;
import com.ice.template.model.vo.NovelOutlineVO;
import com.ice.template.service.NovelOutlineService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import java.util.List;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/novel/outline")
@Api(tags = "小说大纲/章节接口")
public class NovelOutlineController {

    @Resource
    private NovelOutlineService novelOutlineService;

    @PostMapping("/add")
    @ApiOperation("新增大纲节点（卷/章/节）")
    public BaseResponse<String> add(@RequestBody NovelOutlineAddRequest request) {
        return ResultUtils.success(novelOutlineService.addNode(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新节点（标题/概要/正文/排序）")
    public BaseResponse<Boolean> update(@RequestBody NovelOutlineUpdateRequest request) {
        return ResultUtils.success(novelOutlineService.updateNode(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除节点（级联子节点）")
    public BaseResponse<Boolean> delete(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(novelOutlineService.deleteNode(deleteRequest.getId()));
    }

    @GetMapping("/tree")
    @ApiOperation("获取小说大纲树")
    public BaseResponse<List<NovelOutlineVO>> tree(String novelId) {
        return ResultUtils.success(novelOutlineService.tree(novelId));
    }

    @GetMapping("/get")
    @ApiOperation("获取单个节点详情")
    public BaseResponse<NovelOutlineVO> get(String id) {
        return ResultUtils.success(novelOutlineService.getVO(id));
    }

    @PostMapping("/reorder")
    @ApiOperation("拖拽重排序")
    public BaseResponse<Boolean> reorder(@RequestBody NovelOutlineReorderRequest request) {
        return ResultUtils.success(novelOutlineService.reorder(request));
    }
}
