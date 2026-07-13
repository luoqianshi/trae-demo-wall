package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.mapper.AiMusicLyricVersionMapper;
import com.ice.template.mapper.AiMusicProjectMapper;
import com.ice.template.model.dto.aimusic.AiMusicLyricVersionAddRequest;
import com.ice.template.model.dto.aimusic.AiMusicLyricVersionQueryRequest;
import com.ice.template.model.entity.AiMusicLyricVersion;
import com.ice.template.model.entity.AiMusicProject;
import com.ice.template.model.vo.AiMusicLyricVersionVO;
import com.ice.template.service.AiMusicLyricVersionService;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class AiMusicLyricVersionServiceImpl extends ServiceImpl<AiMusicLyricVersionMapper, AiMusicLyricVersion> implements AiMusicLyricVersionService {

    @Resource
    private AiMusicProjectMapper aiMusicProjectMapper;

    @Override
    public String addLyricVersion(AiMusicLyricVersionAddRequest request) {
        if (request == null || StringUtils.isBlank(request.getProjectId()) || StringUtils.isBlank(request.getContent())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        AiMusicProject project = aiMusicProjectMapper.selectById(request.getProjectId());
        ThrowUtils.throwIf(project == null, ErrorCode.NOT_FOUND_ERROR, "音乐项目不存在");
        AiMusicLyricVersion aiMusicLyricVersion = new AiMusicLyricVersion();
        BeanUtils.copyProperties(request, aiMusicLyricVersion);
        if (StringUtils.isBlank(request.getVersionNo())) {
            int nextVersionNo = Math.toIntExact(count(new QueryWrapper<AiMusicLyricVersion>().eq("project_id", request.getProjectId()))) + 1;
            aiMusicLyricVersion.setVersionNo(String.valueOf(nextVersionNo));
        }
        aiMusicLyricVersion.setName(StringUtils.defaultIfBlank(request.getName(), "V" + aiMusicLyricVersion.getVersionNo()));
        aiMusicLyricVersion.setTitle(StringUtils.defaultIfBlank(request.getTitle(), "1".equals(aiMusicLyricVersion.getVersionNo()) ? "初稿归档" : "手动归档"));
        aiMusicLyricVersion.setColor(StringUtils.defaultIfBlank(request.getColor(), "bg-primary"));
        aiMusicLyricVersion.setSummary(StringUtils.defaultIfBlank(request.getSummary(), "保存当前歌词版本"));
        boolean result = this.save(aiMusicLyricVersion);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return aiMusicLyricVersion.getId();
    }

    @Override
    public QueryWrapper<AiMusicLyricVersion> getQueryWrapper(AiMusicLyricVersionQueryRequest request) {
        QueryWrapper<AiMusicLyricVersion> queryWrapper = new QueryWrapper<>();
        if (request == null) {
            return queryWrapper;
        }
        queryWrapper.eq(ObjectUtils.isNotEmpty(request.getId()), "id", request.getId());
        queryWrapper.eq(StringUtils.isNotBlank(request.getProjectId()), "project_id", request.getProjectId());
        queryWrapper.orderByAsc("version_no").orderByAsc("create_time");
        return queryWrapper;
    }

    @Override
    public AiMusicLyricVersionVO getAiMusicLyricVersionVO(AiMusicLyricVersion aiMusicLyricVersion) {
        return AiMusicLyricVersionVO.objToVo(aiMusicLyricVersion);
    }

    @Override
    public List<AiMusicLyricVersionVO> getAiMusicLyricVersionVOList(List<AiMusicLyricVersion> aiMusicLyricVersionList) {
        if (aiMusicLyricVersionList == null) {
            return Collections.emptyList();
        }
        return aiMusicLyricVersionList.stream().map(this::getAiMusicLyricVersionVO).collect(Collectors.toList());
    }
}
