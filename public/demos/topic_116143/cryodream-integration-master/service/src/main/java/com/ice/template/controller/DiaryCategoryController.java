package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.diary.DiaryCategoryAddRequest;
import com.ice.template.model.dto.diary.DiaryCategoryUpdateRequest;
import com.ice.template.model.vo.DiaryCategoryVO;
import com.ice.template.service.DiaryCategoryService;
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
@RequestMapping("/diary/category")
@Api(tags = "日记分类接口")
public class DiaryCategoryController {

    @Resource
    private DiaryCategoryService diaryCategoryService;

    @GetMapping("/list")
    @ApiOperation("获取全部分类")
    public BaseResponse<List<DiaryCategoryVO>> list() {
        return ResultUtils.success(diaryCategoryService.listAll());
    }

    @PostMapping("/add")
    @ApiOperation("新建分类")
    public BaseResponse<String> add(@RequestBody DiaryCategoryAddRequest request) {
        return ResultUtils.success(diaryCategoryService.addCategory(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新分类")
    public BaseResponse<Boolean> update(@RequestBody DiaryCategoryUpdateRequest request) {
        return ResultUtils.success(diaryCategoryService.updateCategory(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除分类")
    public BaseResponse<Boolean> delete(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(diaryCategoryService.deleteCategory(deleteRequest.getId()));
    }
}
