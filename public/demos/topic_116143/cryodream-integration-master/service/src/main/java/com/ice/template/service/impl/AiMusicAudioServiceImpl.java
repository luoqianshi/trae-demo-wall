package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.mapper.AiMusicAudioMapper;
import com.ice.template.mapper.AiMusicProjectMapper;
import com.ice.template.model.dto.aimusic.AiMusicAudioAddRequest;
import com.ice.template.model.dto.aimusic.AiMusicAudioQueryRequest;
import com.ice.template.model.entity.AiMusicAudio;
import com.ice.template.model.entity.AiMusicProject;
import com.ice.template.model.vo.AiMusicAudioVO;
import com.ice.template.service.AiMusicAudioService;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class AiMusicAudioServiceImpl extends ServiceImpl<AiMusicAudioMapper, AiMusicAudio> implements AiMusicAudioService {

    @Resource
    private AiMusicProjectMapper aiMusicProjectMapper;

    @Override
    public String addAudio(AiMusicAudioAddRequest request) {
        if (request == null || StringUtils.isBlank(request.getProjectId()) || StringUtils.isBlank(request.getAudioUrl())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        AiMusicProject project = aiMusicProjectMapper.selectById(request.getProjectId());
        ThrowUtils.throwIf(project == null, ErrorCode.NOT_FOUND_ERROR, "音乐项目不存在");
        AiMusicAudio aiMusicAudio = new AiMusicAudio();
        BeanUtils.copyProperties(request, aiMusicAudio);
        boolean result = this.save(aiMusicAudio);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return aiMusicAudio.getId();
    }

    @Override
    public QueryWrapper<AiMusicAudio> getQueryWrapper(AiMusicAudioQueryRequest request) {
        QueryWrapper<AiMusicAudio> queryWrapper = new QueryWrapper<>();
        if (request == null) {
            return queryWrapper;
        }
        queryWrapper.eq(ObjectUtils.isNotEmpty(request.getId()), "id", request.getId());
        queryWrapper.eq(StringUtils.isNotBlank(request.getProjectId()), "project_id", request.getProjectId());
        queryWrapper.orderByDesc("create_time");
        return queryWrapper;
    }

    @Override
    public AiMusicAudioVO getAiMusicAudioVO(AiMusicAudio aiMusicAudio) {
        return AiMusicAudioVO.objToVo(aiMusicAudio);
    }

    @Override
    public List<AiMusicAudioVO> getAiMusicAudioVOList(List<AiMusicAudio> aiMusicAudioList) {
        if (aiMusicAudioList == null) {
            return Collections.emptyList();
        }
        return aiMusicAudioList.stream().map(this::getAiMusicAudioVO).collect(Collectors.toList());
    }
}
