package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.novel.NovelTimelineEventSaveRequest;
import com.ice.template.model.dto.novel.NovelTimelineReorderRequest;
import com.ice.template.model.vo.NovelTimelineEventVO;
import com.ice.template.service.NovelTimelineEventService;
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
@RequestMapping("/novel/timeline")
@Api(tags = "小说时间线接口")
public class NovelTimelineEventController {

    @Resource
    private NovelTimelineEventService timelineService;

    @PostMapping("/save")
    @ApiOperation("新建/更新事件")
    public BaseResponse<String> save(@RequestBody NovelTimelineEventSaveRequest request) {
        return ResultUtils.success(timelineService.saveEvent(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除事件")
    public BaseResponse<Boolean> delete(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(timelineService.removeById(deleteRequest.getId()));
    }

    @GetMapping("/list")
    @ApiOperation("按小说查询时间线事件")
    public BaseResponse<List<NovelTimelineEventVO>> list(String novelId) {
        return ResultUtils.success(timelineService.listByNovel(novelId));
    }

    @PostMapping("/reorder")
    @ApiOperation("时间线拖拽重排序")
    public BaseResponse<Boolean> reorder(@RequestBody NovelTimelineReorderRequest request) {
        return ResultUtils.success(timelineService.reorder(request));
    }
}
