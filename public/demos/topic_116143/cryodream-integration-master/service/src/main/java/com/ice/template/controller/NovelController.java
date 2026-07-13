package com.ice.template.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.novel.NovelAddRequest;
import com.ice.template.model.dto.novel.NovelQueryRequest;
import com.ice.template.model.dto.novel.NovelUpdateRequest;
import com.ice.template.model.entity.Novel;
import com.ice.template.model.vo.NovelVO;
import com.ice.template.service.NovelService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/novel")
@Api(tags = "小说主表接口")
public class NovelController {

    @Resource
    private NovelService novelService;

    @PostMapping("/add")
    @ApiOperation("新建小说")
    public BaseResponse<String> add(@RequestBody NovelAddRequest request) {
        return ResultUtils.success(novelService.addNovel(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新小说")
    public BaseResponse<Boolean> update(@RequestBody NovelUpdateRequest request) {
        return ResultUtils.success(novelService.updateNovel(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除小说")
    public BaseResponse<Boolean> delete(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Novel novel = novelService.getById(deleteRequest.getId());
        ThrowUtils.throwIf(novel == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(novelService.removeById(deleteRequest.getId()));
    }

    @GetMapping("/get")
    @ApiOperation("查询小说详情")
    public BaseResponse<NovelVO> get(String id) {
        return ResultUtils.success(novelService.getNovelVO(id));
    }

    @PostMapping("/list/page")
    @ApiOperation("分页查询小说")
    public BaseResponse<Page<NovelVO>> listByPage(@RequestBody NovelQueryRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(novelService.listByPage(request));
    }
}
