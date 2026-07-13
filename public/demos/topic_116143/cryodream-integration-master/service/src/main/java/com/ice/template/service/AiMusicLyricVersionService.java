package com.ice.template.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.aimusic.AiMusicLyricVersionAddRequest;
import com.ice.template.model.dto.aimusic.AiMusicLyricVersionQueryRequest;
import com.ice.template.model.entity.AiMusicLyricVersion;
import com.ice.template.model.vo.AiMusicLyricVersionVO;
import java.util.List;

public interface AiMusicLyricVersionService extends IService<AiMusicLyricVersion> {

    String addLyricVersion(AiMusicLyricVersionAddRequest request);

    QueryWrapper<AiMusicLyricVersion> getQueryWrapper(AiMusicLyricVersionQueryRequest request);

    AiMusicLyricVersionVO getAiMusicLyricVersionVO(AiMusicLyricVersion aiMusicLyricVersion);

    List<AiMusicLyricVersionVO> getAiMusicLyricVersionVOList(List<AiMusicLyricVersion> aiMusicLyricVersionList);
}
