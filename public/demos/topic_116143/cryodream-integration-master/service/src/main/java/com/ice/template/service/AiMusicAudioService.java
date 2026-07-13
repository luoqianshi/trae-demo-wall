package com.ice.template.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.aimusic.AiMusicAudioAddRequest;
import com.ice.template.model.dto.aimusic.AiMusicAudioQueryRequest;
import com.ice.template.model.entity.AiMusicAudio;
import com.ice.template.model.vo.AiMusicAudioVO;
import java.util.List;

public interface AiMusicAudioService extends IService<AiMusicAudio> {

    String addAudio(AiMusicAudioAddRequest request);

    QueryWrapper<AiMusicAudio> getQueryWrapper(AiMusicAudioQueryRequest request);

    AiMusicAudioVO getAiMusicAudioVO(AiMusicAudio aiMusicAudio);

    List<AiMusicAudioVO> getAiMusicAudioVOList(List<AiMusicAudio> aiMusicAudioList);
}
