package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.diary.MilestoneAddRequest;
import com.ice.template.model.dto.diary.MilestoneUpdateRequest;
import com.ice.template.model.vo.DiaryMilestoneVO;
import com.ice.template.service.DiaryMilestoneService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import java.util.List;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/diary/milestone")
@Api(tags = "日记里程碑接口")
public class DiaryMilestoneController {

    @Resource
    private DiaryMilestoneService diaryMilestoneService;

    @GetMapping("/list")
    @ApiOperation("获取里程碑列表")
    public BaseResponse<List<DiaryMilestoneVO>> list(@RequestParam(required = false) String status) {
        return ResultUtils.success(diaryMilestoneService.listAll(status));
    }

    @PostMapping("/add")
    @ApiOperation("新建里程碑")
    public BaseResponse<String> add(@RequestBody MilestoneAddRequest request) {
        return ResultUtils.success(diaryMilestoneService.addMilestone(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新里程碑")
    public BaseResponse<Boolean> update(@RequestBody MilestoneUpdateRequest request) {
        return ResultUtils.success(diaryMilestoneService.updateMilestone(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除里程碑")
    public BaseResponse<Boolean> delete(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(diaryMilestoneService.deleteMilestone(deleteRequest.getId()));
    }

    @PostMapping("/achieve")
    @ApiOperation("标记里程碑完成")
    public BaseResponse<Boolean> achieve(@RequestParam String id,
                                         @RequestParam(required = false) String linkedDiaryId) {
        return ResultUtils.success(diaryMilestoneService.achieveMilestone(id, linkedDiaryId));
    }
}
