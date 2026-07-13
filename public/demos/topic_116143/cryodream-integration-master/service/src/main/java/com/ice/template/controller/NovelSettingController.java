package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.novel.NovelSettingAddRequest;
import com.ice.template.model.dto.novel.NovelSettingUpdateRequest;
import com.ice.template.model.vo.NovelSettingVO;
import com.ice.template.service.NovelSettingService;
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
@RequestMapping("/novel/setting")
@Api(tags = "小说世界观设定接口")
public class NovelSettingController {

    @Resource
    private NovelSettingService novelSettingService;

    @PostMapping("/add")
    @ApiOperation("新增设定条目")
    public BaseResponse<String> add(@RequestBody NovelSettingAddRequest request) {
        return ResultUtils.success(novelSettingService.addSetting(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新设定")
    public BaseResponse<Boolean> update(@RequestBody NovelSettingUpdateRequest request) {
        return ResultUtils.success(novelSettingService.updateSetting(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除设定")
    public BaseResponse<Boolean> delete(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(novelSettingService.removeById(deleteRequest.getId()));
    }

    @GetMapping("/list")
    @ApiOperation("查询设定列表（可按分类过滤）")
    public BaseResponse<List<NovelSettingVO>> list(String novelId, String category) {
        return ResultUtils.success(novelSettingService.listByNovel(novelId, category));
    }
}
