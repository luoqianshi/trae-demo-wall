package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.novel.NovelRelationAddRequest;
import com.ice.template.model.dto.novel.NovelRelationUpdateRequest;
import com.ice.template.model.vo.NovelRelationVO;
import com.ice.template.service.NovelRelationService;
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
@RequestMapping("/novel/relation")
@Api(tags = "小说人物关系接口")
public class NovelRelationController {

    @Resource
    private NovelRelationService novelRelationService;

    @PostMapping("/add")
    @ApiOperation("新增关系")
    public BaseResponse<String> add(@RequestBody NovelRelationAddRequest request) {
        return ResultUtils.success(novelRelationService.addRelation(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新关系")
    public BaseResponse<Boolean> update(@RequestBody NovelRelationUpdateRequest request) {
        return ResultUtils.success(novelRelationService.updateRelation(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除关系")
    public BaseResponse<Boolean> delete(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(novelRelationService.removeById(deleteRequest.getId()));
    }

    @GetMapping("/list")
    @ApiOperation("查询指定小说下所有人物关系")
    public BaseResponse<List<NovelRelationVO>> list(String novelId) {
        return ResultUtils.success(novelRelationService.listByNovel(novelId));
    }
}
