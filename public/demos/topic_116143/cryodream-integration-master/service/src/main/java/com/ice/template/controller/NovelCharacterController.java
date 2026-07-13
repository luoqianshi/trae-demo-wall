package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.novel.NovelCharacterAddRequest;
import com.ice.template.model.dto.novel.NovelCharacterUpdateRequest;
import com.ice.template.model.vo.NovelCharacterVO;
import com.ice.template.service.NovelCharacterService;
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
@RequestMapping("/novel/character")
@Api(tags = "小说人物接口")
public class NovelCharacterController {

    @Resource
    private NovelCharacterService novelCharacterService;

    @PostMapping("/add")
    @ApiOperation("新增人物")
    public BaseResponse<String> add(@RequestBody NovelCharacterAddRequest request) {
        return ResultUtils.success(novelCharacterService.addCharacter(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新人物")
    public BaseResponse<Boolean> update(@RequestBody NovelCharacterUpdateRequest request) {
        return ResultUtils.success(novelCharacterService.updateCharacter(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除人物")
    public BaseResponse<Boolean> delete(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(novelCharacterService.removeById(deleteRequest.getId()));
    }

    @GetMapping("/list")
    @ApiOperation("查询指定小说下所有人物")
    public BaseResponse<List<NovelCharacterVO>> list(String novelId) {
        return ResultUtils.success(novelCharacterService.listByNovel(novelId));
    }
}
