package com.ice.template.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.tag.TagAddRequest;
import com.ice.template.model.dto.tag.TagQueryRequest;
import com.ice.template.model.dto.tag.TagUpdateRequest;
import com.ice.template.model.entity.Tag;
import com.ice.template.model.vo.TagVO;
import com.ice.template.service.TagService;
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
@RequestMapping("/tag")
@Api(tags = "标签接口")
public class TagController {

    @Resource
    private TagService tagService;

    @PostMapping("/add")
    @ApiOperation("新增标签")
    public BaseResponse<String> addTag(@RequestBody TagAddRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(tagService.addTag(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新标签")
    public BaseResponse<Boolean> updateTag(@RequestBody TagUpdateRequest request) {
        if (request == null || request.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(tagService.updateTag(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除标签")
    public BaseResponse<Boolean> deleteTag(@RequestBody String id) {
        if (id == null || id.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(tagService.deleteTag(id));
    }

    @PostMapping("/list/page")
    @ApiOperation("分页查询标签")
    public BaseResponse<Page<TagVO>> listTagByPage(@RequestBody TagQueryRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = request.getCurrent();
        long size = request.getPageSize();
        Page<Tag> page = tagService.page(new Page<>(current, size),
                tagService.getQueryWrapper(request));
        Page<TagVO> voPage = new Page<>(current, size, page.getTotal());
        voPage.setRecords(tagService.getTagVOList(page.getRecords()));
        return ResultUtils.success(voPage);
    }

    @GetMapping("/list/all")
    @ApiOperation("全部标签")
    public BaseResponse<List<TagVO>> listAllTags() {
        return ResultUtils.success(tagService.listAllTags());
    }
}
