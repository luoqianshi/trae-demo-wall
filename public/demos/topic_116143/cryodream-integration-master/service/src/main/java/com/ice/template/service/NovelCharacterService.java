package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.novel.NovelCharacterAddRequest;
import com.ice.template.model.dto.novel.NovelCharacterUpdateRequest;
import com.ice.template.model.entity.NovelCharacter;
import com.ice.template.model.vo.NovelCharacterVO;
import java.util.List;

public interface NovelCharacterService extends IService<NovelCharacter> {

    String addCharacter(NovelCharacterAddRequest request);

    boolean updateCharacter(NovelCharacterUpdateRequest request);

    List<NovelCharacterVO> listByNovel(String novelId);
}
