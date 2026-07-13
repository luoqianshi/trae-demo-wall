package com.ice.template.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.aimusic.AiMusicProjectAddRequest;
import com.ice.template.model.dto.aimusic.AiMusicProjectQueryRequest;
import com.ice.template.model.dto.aimusic.AiMusicProjectUpdateRequest;
import com.ice.template.model.entity.AiMusicAudio;
import com.ice.template.model.entity.AiMusicLyricVersion;
import com.ice.template.model.entity.AiMusicProject;
import com.ice.template.model.vo.AiMusicProjectVO;
import com.ice.template.service.AiMusicAudioService;
import com.ice.template.service.AiMusicLyricVersionService;
import com.ice.template.service.AiMusicProjectService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/aiMusic/project")
@Api(tags = "AI音乐项目接口")
public class AiMusicProjectController {

    @Resource
    private AiMusicProjectService aiMusicProjectService;

    @Resource
    private AiMusicLyricVersionService aiMusicLyricVersionService;

    @Resource
    private AiMusicAudioService aiMusicAudioService;

    @PostMapping("/add")
    @ApiOperation("新增AI音乐项目")
    public BaseResponse<String> addAiMusicProject(@RequestBody AiMusicProjectAddRequest aiMusicProjectAddRequest) {
        if (aiMusicProjectAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        AiMusicProject aiMusicProject = new AiMusicProject();
        BeanUtils.copyProperties(aiMusicProjectAddRequest, aiMusicProject);
        aiMusicProject.setStatus("draft");
        aiMusicProject.setStyle(StringUtils.defaultIfBlank(aiMusicProject.getStyle(), "流行 Pop"));
        aiMusicProject.setMood(StringUtils.defaultIfBlank(aiMusicProject.getMood(), "温暖"));
        aiMusicProject.setLanguage(StringUtils.defaultIfBlank(aiMusicProject.getLanguage(), "中文"));
        aiMusicProjectService.validAiMusicProject(aiMusicProject, true);
        boolean result = aiMusicProjectService.save(aiMusicProject);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(aiMusicProject.getId());
    }

    @PostMapping("/delete")
    @ApiOperation("删除AI音乐项目")
    public BaseResponse<Boolean> deleteAiMusicProject(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        AiMusicProject oldAiMusicProject = aiMusicProjectService.getById(deleteRequest.getId());
        ThrowUtils.throwIf(oldAiMusicProject == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = aiMusicProjectService.removeById(deleteRequest.getId());
        if (result) {
            aiMusicLyricVersionService.remove(new QueryWrapper<AiMusicLyricVersion>().eq("project_id", deleteRequest.getId()));
            aiMusicAudioService.remove(new QueryWrapper<AiMusicAudio>().eq("project_id", deleteRequest.getId()));
        }
        return ResultUtils.success(result);
    }

    @PostMapping("/update")
    @ApiOperation("更新AI音乐项目")
    public BaseResponse<Boolean> updateAiMusicProject(@RequestBody AiMusicProjectUpdateRequest aiMusicProjectUpdateRequest) {
        if (aiMusicProjectUpdateRequest == null || StringUtils.isBlank(aiMusicProjectUpdateRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        AiMusicProject oldAiMusicProject = aiMusicProjectService.getById(aiMusicProjectUpdateRequest.getId());
        ThrowUtils.throwIf(oldAiMusicProject == null, ErrorCode.NOT_FOUND_ERROR);
        AiMusicProject aiMusicProject = new AiMusicProject();
        BeanUtils.copyProperties(aiMusicProjectUpdateRequest, aiMusicProject);
        aiMusicProjectService.validAiMusicProject(aiMusicProject, false);
        return ResultUtils.success(aiMusicProjectService.updateById(aiMusicProject));
    }

    @GetMapping("/get")
    @ApiOperation("根据id查询AI音乐项目")
    public BaseResponse<AiMusicProjectVO> getAiMusicProjectById(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        AiMusicProject aiMusicProject = aiMusicProjectService.getById(id);
        ThrowUtils.throwIf(aiMusicProject == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(aiMusicProjectService.getAiMusicProjectVO(aiMusicProject));
    }

    @PostMapping("/list/page")
    @ApiOperation("分页查询AI音乐项目")
    public BaseResponse<Page<AiMusicProjectVO>> listAiMusicProjectByPage(@RequestBody AiMusicProjectQueryRequest aiMusicProjectQueryRequest) {
        if (aiMusicProjectQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = aiMusicProjectQueryRequest.getCurrent();
        long size = aiMusicProjectQueryRequest.getPageSize();
        Page<AiMusicProject> aiMusicProjectPage = aiMusicProjectService.page(new Page<>(current, size), aiMusicProjectService.getQueryWrapper(aiMusicProjectQueryRequest));
        Page<AiMusicProjectVO> aiMusicProjectVOPage = new Page<>(current, size, aiMusicProjectPage.getTotal());
        aiMusicProjectVOPage.setRecords(aiMusicProjectService.getAiMusicProjectVOList(aiMusicProjectPage.getRecords()));
        return ResultUtils.success(aiMusicProjectVOPage);
    }
}
