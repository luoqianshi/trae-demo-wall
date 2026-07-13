package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.novel.NovelOutlineAddRequest;
import com.ice.template.model.dto.novel.NovelOutlineReorderRequest;
import com.ice.template.model.dto.novel.NovelOutlineUpdateRequest;
import com.ice.template.model.entity.NovelOutline;
import com.ice.template.model.vo.NovelOutlineVO;
import java.util.List;

public interface NovelOutlineService extends IService<NovelOutline> {

    String addNode(NovelOutlineAddRequest request);

    boolean updateNode(NovelOutlineUpdateRequest request);

    /**
     * 删除节点，级联软删所有子孙节点
     */
    boolean deleteNode(String id);

    /**
     * 拉取整棵大纲树（含正文），按 level + sortOrder 排序
     */
    List<NovelOutlineVO> tree(String novelId);

    boolean reorder(NovelOutlineReorderRequest request);

    NovelOutlineVO getVO(String id);
}
