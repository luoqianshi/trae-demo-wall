package com.ice.template.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.tag.TagAddRequest;
import com.ice.template.model.dto.tag.TagQueryRequest;
import com.ice.template.model.dto.tag.TagUpdateRequest;
import com.ice.template.model.entity.Tag;
import com.ice.template.model.vo.TagVO;
import java.util.List;

public interface TagService extends IService<Tag> {

    String addTag(TagAddRequest request);

    Boolean updateTag(TagUpdateRequest request);

    Boolean deleteTag(String id);

    QueryWrapper<Tag> getQueryWrapper(TagQueryRequest request);

    TagVO getTagVO(Tag tag);

    List<TagVO> getTagVOList(List<Tag> list);

    List<TagVO> listAllTags();
}
