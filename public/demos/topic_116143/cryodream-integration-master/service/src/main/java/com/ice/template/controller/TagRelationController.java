package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.tag.TagBindRequest;
import com.ice.template.model.vo.TagVO;
import com.ice.template.service.TagRelationService;
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
@RequestMapping("/tag-relation")
@Api(tags = "标签关联接口")
public class TagRelationController {

    @Resource
    private TagRelationService tagRelationService;

    @PostMapping("/bind")
    @ApiOperation("绑定标签（全量覆盖）")
    public BaseResponse<Boolean> bindTags(@RequestBody TagBindRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(tagRelationService.bindTags(request));
    }

    @GetMapping("/listByTarget")
    @ApiOperation("查询对象的标签")
    public BaseResponse<List<TagVO>> listByTarget(String targetType, String targetId) {
        if (targetType == null || targetId == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(tagRelationService.listByTarget(targetType, targetId));
    }

    @GetMapping("/listTargets")
    @ApiOperation("按标签反查对象ID")
    public BaseResponse<List<String>> listTargets(String tagId, String targetType) {
        if (tagId == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(tagRelationService.listTargetIds(tagId, targetType));
    }
}
