package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.novel.NovelTimelineEventSaveRequest;
import com.ice.template.model.dto.novel.NovelTimelineReorderRequest;
import com.ice.template.model.entity.NovelTimelineEvent;
import com.ice.template.model.vo.NovelTimelineEventVO;
import java.util.List;

public interface NovelTimelineEventService extends IService<NovelTimelineEvent> {

    String saveEvent(NovelTimelineEventSaveRequest request);

    List<NovelTimelineEventVO> listByNovel(String novelId);

    boolean reorder(NovelTimelineReorderRequest request);
}
