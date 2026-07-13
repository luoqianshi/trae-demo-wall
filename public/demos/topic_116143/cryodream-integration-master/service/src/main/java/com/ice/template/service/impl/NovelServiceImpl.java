package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.NovelMapper;
import com.ice.template.mapper.NovelOutlineMapper;
import com.ice.template.model.dto.novel.NovelAddRequest;
import com.ice.template.model.dto.novel.NovelQueryRequest;
import com.ice.template.model.dto.novel.NovelUpdateRequest;
import com.ice.template.model.entity.Novel;
import com.ice.template.model.entity.NovelOutline;
import com.ice.template.model.vo.NovelVO;
import com.ice.template.service.NovelService;
import java.util.List;
import java.util.stream.Collectors;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class NovelServiceImpl extends ServiceImpl<NovelMapper, Novel> implements NovelService {

    @Resource
    private NovelOutlineMapper novelOutlineMapper;

    @Override
    public String addNovel(NovelAddRequest request) {
        if (request == null || StringUtils.isBlank(request.getTitle())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "小说标题不能为空");
        }
        Novel novel = new Novel();
        BeanUtils.copyProperties(request, novel);
        novel.setStatus("writing");
        novel.setWordCount(0);
        boolean ok = this.save(novel);
        if (!ok) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR);
        }
        return novel.getId();
    }

    @Override
    public boolean updateNovel(NovelUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Novel novel = new Novel();
        BeanUtils.copyProperties(request, novel);
        return this.updateById(novel);
    }

    @Override
    public Page<NovelVO> listByPage(NovelQueryRequest request) {
        long current = request.getCurrent();
        long size = request.getPageSize();
        LambdaQueryWrapper<Novel> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.isNotBlank(request.getSearchText())) {
            String kw = "%" + request.getSearchText() + "%";
            wrapper.and(w -> w.like(Novel::getTitle, kw).or().like(Novel::getSummary, kw));
        }
        if (StringUtils.isNotBlank(request.getStatus())) {
            wrapper.eq(Novel::getStatus, request.getStatus());
        }
        if (StringUtils.isNotBlank(request.getGenre())) {
            wrapper.eq(Novel::getGenre, request.getGenre());
        }
        wrapper.orderByDesc(Novel::getUpdateTime);
        Page<Novel> page = this.page(new Page<>(current, size), wrapper);
        Page<NovelVO> voPage = new Page<>(current, size, page.getTotal());
        List<NovelVO> voList = page.getRecords().stream().map(NovelVO::objToVo).collect(Collectors.toList());
        voPage.setRecords(voList);
        return voPage;
    }

    @Override
    public NovelVO getNovelVO(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Novel novel = this.getById(id);
        if (novel == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        return NovelVO.objToVo(novel);
    }

    @Override
    public void refreshWordCount(String novelId) {
        if (StringUtils.isBlank(novelId)) {
            return;
        }
        LambdaQueryWrapper<NovelOutline> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NovelOutline::getNovelId, novelId);
        wrapper.eq(NovelOutline::getLevel, 3);
        List<NovelOutline> nodes = novelOutlineMapper.selectList(wrapper);
        int total = nodes.stream().mapToInt(n -> n.getWordCount() == null ? 0 : n.getWordCount()).sum();
        LambdaUpdateWrapper<Novel> u = new LambdaUpdateWrapper<>();
        u.eq(Novel::getId, novelId).set(Novel::getWordCount, total);
        this.update(u);
    }
}
