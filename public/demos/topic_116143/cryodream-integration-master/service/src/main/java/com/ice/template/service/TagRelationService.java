package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.tag.TagBindRequest;
import com.ice.template.model.entity.TagRelation;
import com.ice.template.model.vo.TagVO;
import java.util.List;

public interface TagRelationService extends IService<TagRelation> {

    Boolean bindTags(TagBindRequest request);

    List<TagVO> listByTarget(String targetType, String targetId);

    List<String> listTargetIds(String tagId, String targetType);
}
