package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.tag.TagCategoryAddRequest;
import com.ice.template.model.dto.tag.TagCategoryUpdateRequest;
import com.ice.template.model.vo.TagCategoryVO;
import com.ice.template.service.TagCategoryService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import java.util.List;
import javax.annotation.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tag-category")
@Api(tags = "标签分类接口")
public class TagCategoryController {

    @Resource
    private TagCategoryService tagCategoryService;

    @PostMapping("/add")
    @ApiOperation("新增分类")
    public BaseResponse<String> addCategory(@RequestBody TagCategoryAddRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(tagCategoryService.addCategory(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新分类")
    public BaseResponse<Boolean> updateCategory(@RequestBody TagCategoryUpdateRequest request) {
        if (request == null || request.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(tagCategoryService.updateCategory(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除分类")
    public BaseResponse<Boolean> deleteCategory(@RequestBody String id) {
        if (id == null || id.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(tagCategoryService.deleteCategory(id));
    }

    @GetMapping("/list")
    @ApiOperation("分类列表")
    public BaseResponse<List<TagCategoryVO>> listCategories() {
        return ResultUtils.success(tagCategoryService.listCategories());
    }
}
