package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.novel.NovelSettingAddRequest;
import com.ice.template.model.dto.novel.NovelSettingUpdateRequest;
import com.ice.template.model.entity.NovelSetting;
import com.ice.template.model.vo.NovelSettingVO;
import java.util.List;

public interface NovelSettingService extends IService<NovelSetting> {

    String addSetting(NovelSettingAddRequest request);

    boolean updateSetting(NovelSettingUpdateRequest request);

    List<NovelSettingVO> listByNovel(String novelId, String category);
}
