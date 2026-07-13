package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.novel.NovelCharacterSnapshotSaveRequest;
import com.ice.template.model.vo.NovelCharacterSnapshotVO;
import com.ice.template.service.NovelCharacterSnapshotService;
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
@RequestMapping("/novel/snapshot")
@Api(tags = "小说人物属性快照接口")
public class NovelCharacterSnapshotController {

    @Resource
    private NovelCharacterSnapshotService snapshotService;

    @PostMapping("/save")
    @ApiOperation("新建/更新快照")
    public BaseResponse<String> save(@RequestBody NovelCharacterSnapshotSaveRequest request) {
        return ResultUtils.success(snapshotService.saveSnapshot(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除快照")
    public BaseResponse<Boolean> delete(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        return ResultUtils.success(snapshotService.removeById(deleteRequest.getId()));
    }

    @GetMapping("/list/character")
    @ApiOperation("按人物查询快照")
    public BaseResponse<List<NovelCharacterSnapshotVO>> listByCharacter(String characterId) {
        return ResultUtils.success(snapshotService.listByCharacter(characterId));
    }

    @GetMapping("/list/novel")
    @ApiOperation("按小说查询所有快照")
    public BaseResponse<List<NovelCharacterSnapshotVO>> listByNovel(String novelId) {
        return ResultUtils.success(snapshotService.listByNovel(novelId));
    }

    @GetMapping("/list/event")
    @ApiOperation("按时间线事件查询快照")
    public BaseResponse<List<NovelCharacterSnapshotVO>> listByEvent(String eventId) {
        return ResultUtils.success(snapshotService.listByEvent(eventId));
    }
}
