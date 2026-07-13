package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.novel.NovelCharacterSnapshotSaveRequest;
import com.ice.template.model.entity.NovelCharacterSnapshot;
import com.ice.template.model.vo.NovelCharacterSnapshotVO;
import java.util.List;

public interface NovelCharacterSnapshotService extends IService<NovelCharacterSnapshot> {

    String saveSnapshot(NovelCharacterSnapshotSaveRequest request);

    List<NovelCharacterSnapshotVO> listByCharacter(String characterId);

    List<NovelCharacterSnapshotVO> listByNovel(String novelId);

    List<NovelCharacterSnapshotVO> listByEvent(String eventId);
}
