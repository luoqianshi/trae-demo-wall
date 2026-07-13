package com.ice.template.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.diary.DiaryAddRequest;
import com.ice.template.model.dto.diary.DiaryQueryRequest;
import com.ice.template.model.dto.diary.DiaryTimelineQueryRequest;
import com.ice.template.model.dto.diary.DiaryUpdateRequest;
import com.ice.template.model.vo.DiaryVO;
import com.ice.template.service.DiaryService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import java.util.List;
import java.util.Map;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/diary")
@Api(tags = "日记接口")
public class DiaryController {

    @Resource
    private DiaryService diaryService;

    @PostMapping("/add")
    @ApiOperation("新建日记")
    public BaseResponse<String> add(@RequestBody DiaryAddRequest request) {
        return ResultUtils.success(diaryService.addDiary(request));
    }

    @PostMapping("/update")
    @ApiOperation("更新日记")
    public BaseResponse<Boolean> update(@RequestBody DiaryUpdateRequest request) {
        return ResultUtils.success(diaryService.updateDiary(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除日记")
    public BaseResponse<Boolean> delete(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(diaryService.removeById(deleteRequest.getId()));
    }

    @GetMapping("/get")
    @ApiOperation("查询日记详情")
    public BaseResponse<DiaryVO> get(String id) {
        return ResultUtils.success(diaryService.getDiaryVO(id));
    }

    @PostMapping("/list/page")
    @ApiOperation("分页查询日记")
    public BaseResponse<Page<DiaryVO>> listByPage(@RequestBody DiaryQueryRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(diaryService.listByPage(request));
    }

    @PostMapping("/timeline")
    @ApiOperation("时间线聚合")
    public BaseResponse<List<Map<String, Object>>> timeline(@RequestBody DiaryTimelineQueryRequest request) {
        return ResultUtils.success(diaryService.timeline(request));
    }

    @GetMapping("/mood-trend")
    @ApiOperation("情绪趋势")
    public BaseResponse<List<Map<String, Object>>> moodTrend(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResultUtils.success(diaryService.moodTrend(startDate, endDate));
    }

    @PostMapping("/reanalyze")
    @ApiOperation("重新触发 AI 分析")
    public BaseResponse<Boolean> reanalyze(@RequestParam String diaryId,
                                           @RequestParam String modelConfigId) {
        return ResultUtils.success(diaryService.reanalyze(diaryId, modelConfigId));
    }
}
