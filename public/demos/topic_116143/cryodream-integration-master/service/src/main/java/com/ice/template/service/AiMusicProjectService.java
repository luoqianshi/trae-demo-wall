package com.ice.template.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.aimusic.AiMusicProjectQueryRequest;
import com.ice.template.model.entity.AiMusicProject;
import com.ice.template.model.vo.AiMusicProjectVO;
import java.util.List;

public interface AiMusicProjectService extends IService<AiMusicProject> {

    void validAiMusicProject(AiMusicProject aiMusicProject, boolean add);

    QueryWrapper<AiMusicProject> getQueryWrapper(AiMusicProjectQueryRequest aiMusicProjectQueryRequest);

    AiMusicProjectVO getAiMusicProjectVO(AiMusicProject aiMusicProject);

    List<AiMusicProjectVO> getAiMusicProjectVOList(List<AiMusicProject> aiMusicProjectList);
}
