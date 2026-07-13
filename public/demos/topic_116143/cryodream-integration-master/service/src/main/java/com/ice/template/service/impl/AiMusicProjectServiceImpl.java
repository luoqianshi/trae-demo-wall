package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.constant.CommonConstant;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.AiMusicProjectMapper;
import com.ice.template.model.dto.aimusic.AiMusicProjectQueryRequest;
import com.ice.template.model.entity.AiMusicProject;
import com.ice.template.model.vo.AiMusicProjectVO;
import com.ice.template.service.AiMusicProjectService;
import com.ice.template.utils.SqlUtils;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class AiMusicProjectServiceImpl extends ServiceImpl<AiMusicProjectMapper, AiMusicProject> implements AiMusicProjectService {

    @Override
    public void validAiMusicProject(AiMusicProject aiMusicProject, boolean add) {
        if (aiMusicProject == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String title = aiMusicProject.getTitle();
        if (add && StringUtils.isBlank(title)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "音乐项目名称不能为空");
        }
        if (StringUtils.isNotBlank(title) && title.length() > 128) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "音乐项目名称过长");
        }
        if (StringUtils.isNotBlank(aiMusicProject.getDescription()) && aiMusicProject.getDescription().length() > 1024) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "音乐项目描述过长");
        }
    }

    @Override
    public QueryWrapper<AiMusicProject> getQueryWrapper(AiMusicProjectQueryRequest aiMusicProjectQueryRequest) {
        QueryWrapper<AiMusicProject> queryWrapper = new QueryWrapper<>();
        if (aiMusicProjectQueryRequest == null) {
            return queryWrapper;
        }
        String id = aiMusicProjectQueryRequest.getId();
        String searchText = aiMusicProjectQueryRequest.getSearchText();
        String title = aiMusicProjectQueryRequest.getTitle();
        String style = aiMusicProjectQueryRequest.getStyle();
        String mood = aiMusicProjectQueryRequest.getMood();
        String language = aiMusicProjectQueryRequest.getLanguage();
        String status = aiMusicProjectQueryRequest.getStatus();
        String sortField = aiMusicProjectQueryRequest.getSortField();
        String sortOrder = aiMusicProjectQueryRequest.getSortOrder();
        queryWrapper.eq(ObjectUtils.isNotEmpty(id), "id", id);
        queryWrapper.like(StringUtils.isNotBlank(title), "title", title);
        queryWrapper.eq(StringUtils.isNotBlank(style), "style", style);
        queryWrapper.eq(StringUtils.isNotBlank(mood), "mood", mood);
        queryWrapper.eq(StringUtils.isNotBlank(language), "language", language);
        queryWrapper.eq(StringUtils.isNotBlank(status), "status", status);
        if (StringUtils.isNotBlank(searchText)) {
            queryWrapper.and(qw -> qw.like("title", searchText)
                    .or().like("description", searchText)
                    .or().like("style", searchText)
                    .or().like("mood", searchText));
        }
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), CommonConstant.SORT_ORDER_ASC.equals(sortOrder), sortField);
        queryWrapper.orderByDesc("update_time");
        return queryWrapper;
    }

    @Override
    public AiMusicProjectVO getAiMusicProjectVO(AiMusicProject aiMusicProject) {
        return AiMusicProjectVO.objToVo(aiMusicProject);
    }

    @Override
    public List<AiMusicProjectVO> getAiMusicProjectVOList(List<AiMusicProject> aiMusicProjectList) {
        if (aiMusicProjectList == null) {
            return Collections.emptyList();
        }
        return aiMusicProjectList.stream().map(this::getAiMusicProjectVO).collect(Collectors.toList());
    }
}
