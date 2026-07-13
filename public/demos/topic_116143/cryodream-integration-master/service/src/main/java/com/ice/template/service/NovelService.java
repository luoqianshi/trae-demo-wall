package com.ice.template.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.novel.NovelAddRequest;
import com.ice.template.model.dto.novel.NovelQueryRequest;
import com.ice.template.model.dto.novel.NovelUpdateRequest;
import com.ice.template.model.entity.Novel;
import com.ice.template.model.vo.NovelVO;

public interface NovelService extends IService<Novel> {

    String addNovel(NovelAddRequest request);

    boolean updateNovel(NovelUpdateRequest request);

    Page<NovelVO> listByPage(NovelQueryRequest request);

    NovelVO getNovelVO(String id);

    /**
     * 根据大纲章节字数汇总刷新小说总字数
     */
    void refreshWordCount(String novelId);
}
