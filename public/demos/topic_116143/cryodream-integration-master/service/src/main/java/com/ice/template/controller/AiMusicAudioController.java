package com.ice.template.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.aimusic.AiMusicAudioAddRequest;
import com.ice.template.model.dto.aimusic.AiMusicAudioQueryRequest;
import com.ice.template.model.entity.AiMusicAudio;
import com.ice.template.model.vo.AiMusicAudioVO;
import com.ice.template.service.AiMusicAudioService;
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
@RequestMapping("/aiMusic/audio")
@Api(tags = "AI音乐音频接口")
public class AiMusicAudioController {

    @Resource
    private AiMusicAudioService aiMusicAudioService;

    @PostMapping("/add")
    @ApiOperation("新增AI音乐音频")
    public BaseResponse<String> addAudio(@RequestBody AiMusicAudioAddRequest request) {
        return ResultUtils.success(aiMusicAudioService.addAudio(request));
    }

    @PostMapping("/delete")
    @ApiOperation("删除AI音乐音频")
    public BaseResponse<Boolean> deleteAudio(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        AiMusicAudio oldAudio = aiMusicAudioService.getById(deleteRequest.getId());
        ThrowUtils.throwIf(oldAudio == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(aiMusicAudioService.removeById(deleteRequest.getId()));
    }

    @GetMapping("/get")
    @ApiOperation("根据id查询AI音乐音频")
    public BaseResponse<AiMusicAudioVO> getAudioById(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        AiMusicAudio aiMusicAudio = aiMusicAudioService.getById(id);
        ThrowUtils.throwIf(aiMusicAudio == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(aiMusicAudioService.getAiMusicAudioVO(aiMusicAudio));
    }

    @PostMapping("/list")
    @ApiOperation("查询AI音乐音频列表")
    public BaseResponse<List<AiMusicAudioVO>> listAudios(@RequestBody AiMusicAudioQueryRequest request) {
        if (request == null || StringUtils.isBlank(request.getProjectId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        List<AiMusicAudio> list = aiMusicAudioService.list(aiMusicAudioService.getQueryWrapper(request));
        return ResultUtils.success(aiMusicAudioService.getAiMusicAudioVOList(list));
    }

    @PostMapping("/list/page")
    @ApiOperation("分页查询AI音乐音频")
    public BaseResponse<Page<AiMusicAudioVO>> listAudioByPage(@RequestBody AiMusicAudioQueryRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = request.getCurrent();
        long size = request.getPageSize();
        Page<AiMusicAudio> page = aiMusicAudioService.page(new Page<>(current, size), aiMusicAudioService.getQueryWrapper(request));
        Page<AiMusicAudioVO> voPage = new Page<>(current, size, page.getTotal());
        voPage.setRecords(aiMusicAudioService.getAiMusicAudioVOList(page.getRecords()));
        return ResultUtils.success(voPage);
    }
}
