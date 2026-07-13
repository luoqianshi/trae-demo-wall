package com.ice.template.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.aimusic.AiMusicLyricVersionAddRequest;
import com.ice.template.model.dto.aimusic.AiMusicLyricVersionQueryRequest;
import com.ice.template.model.entity.AiMusicLyricVersion;
import com.ice.template.model.vo.AiMusicLyricVersionVO;
import com.ice.template.service.AiMusicLyricVersionService;
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
@RequestMapping("/aiMusic/lyric/version")
@Api(tags = "AI音乐歌词版本接口")
public class AiMusicLyricVersionController {

    @Resource
    private AiMusicLyricVersionService aiMusicLyricVersionService;

    @PostMapping("/add")
    @ApiOperation("新增AI音乐歌词版本")
    public BaseResponse<String> addLyricVersion(@RequestBody AiMusicLyricVersionAddRequest request) {
        return ResultUtils.success(aiMusicLyricVersionService.addLyricVersion(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除AI音乐歌词版本")
    public BaseResponse<Boolean> deleteLyricVersion(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        AiMusicLyricVersion oldVersion = aiMusicLyricVersionService.getById(deleteRequest.getId());
        ThrowUtils.throwIf(oldVersion == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(aiMusicLyricVersionService.removeById(deleteRequest.getId()));
    }

    @GetMapping("/get")
    @ApiOperation("根据id查询AI音乐歌词版本")
    public BaseResponse<AiMusicLyricVersionVO> getLyricVersionById(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        AiMusicLyricVersion aiMusicLyricVersion = aiMusicLyricVersionService.getById(id);
        ThrowUtils.throwIf(aiMusicLyricVersion == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(aiMusicLyricVersionService.getAiMusicLyricVersionVO(aiMusicLyricVersion));
    }

    @PostMapping("/list")
    @ApiOperation("查询AI音乐歌词版本列表")
    public BaseResponse<List<AiMusicLyricVersionVO>> listLyricVersions(@RequestBody AiMusicLyricVersionQueryRequest request) {
        if (request == null || StringUtils.isBlank(request.getProjectId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        List<AiMusicLyricVersion> list = aiMusicLyricVersionService.list(aiMusicLyricVersionService.getQueryWrapper(request));
        return ResultUtils.success(aiMusicLyricVersionService.getAiMusicLyricVersionVOList(list));
    }

    @PostMapping("/list/page")
    @ApiOperation("分页查询AI音乐歌词版本")
    public BaseResponse<Page<AiMusicLyricVersionVO>> listLyricVersionByPage(@RequestBody AiMusicLyricVersionQueryRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = request.getCurrent();
        long size = request.getPageSize();
        Page<AiMusicLyricVersion> page = aiMusicLyricVersionService.page(new Page<>(current, size), aiMusicLyricVersionService.getQueryWrapper(request));
        Page<AiMusicLyricVersionVO> voPage = new Page<>(current, size, page.getTotal());
        voPage.setRecords(aiMusicLyricVersionService.getAiMusicLyricVersionVOList(page.getRecords()));
        return ResultUtils.success(voPage);
    }
}
