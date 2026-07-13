package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.NovelOutlineMapper;
import com.ice.template.model.dto.novel.NovelOutlineAddRequest;
import com.ice.template.model.dto.novel.NovelOutlineReorderRequest;
import com.ice.template.model.dto.novel.NovelOutlineUpdateRequest;
import com.ice.template.model.entity.NovelOutline;
import com.ice.template.model.vo.NovelOutlineVO;
import com.ice.template.service.NovelOutlineService;
import com.ice.template.service.NovelService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class NovelOutlineServiceImpl extends ServiceImpl<NovelOutlineMapper, NovelOutline> implements NovelOutlineService {

    @Resource
    private NovelService novelService;

    @Override
    public String addNode(NovelOutlineAddRequest request) {
        if (request == null || StringUtils.isBlank(request.getNovelId()) || request.getLevel() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "缺少 novelId 或 level");
        }
        if (request.getLevel() < 1 || request.getLevel() > 3) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "level 只能是 1/2/3");
        }
        NovelOutline node = new NovelOutline();
        BeanUtils.copyProperties(request, node);
        if (StringUtils.isBlank(node.getTitle())) {
            node.setTitle(levelDefaultTitle(request.getLevel()));
        }
        if (node.getSortOrder() == null) {
            // 排在同级最后
            LambdaQueryWrapper<NovelOutline> q = new LambdaQueryWrapper<>();
            q.eq(NovelOutline::getNovelId, request.getNovelId());
            q.eq(NovelOutline::getLevel, request.getLevel());
            if (StringUtils.isNotBlank(request.getParentId())) {
                q.eq(NovelOutline::getParentId, request.getParentId());
            } else {
                q.isNull(NovelOutline::getParentId);
            }
            long count = this.count(q);
            node.setSortOrder((int) count);
        }
        node.setWordCount(0);
        boolean ok = this.save(node);
        if (!ok) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR);
        }
        return node.getId();
    }

    private String levelDefaultTitle(int level) {
        switch (level) {
            case 1: return "新卷";
            case 2: return "新章";
            case 3: return "新节";
            default: return "新节点";
        }
    }

    @Override
    public boolean updateNode(NovelOutlineUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        NovelOutline node = new NovelOutline();
        BeanUtils.copyProperties(request, node);
        // 章节字数统计（Milkdown 内容按可见字符简单计数）
        if (request.getContent() != null) {
            node.setWordCount(countWords(request.getContent()));
        }
        boolean ok = this.updateById(node);
        // 更新完刷新小说字数
        if (ok && request.getContent() != null) {
            NovelOutline exist = this.getById(request.getId());
            if (exist != null && exist.getNovelId() != null) {
                novelService.refreshWordCount(exist.getNovelId());
            }
        }
        return ok;
    }

    private int countWords(String content) {
        if (content == null) return 0;
        // 去除 markdown 常见符号，粗略统计
        String stripped = content.replaceAll("[#>*_`\\-\\[\\]\\(\\)!]", "").replaceAll("\\s+", "");
        return stripped.length();
    }

    @Override
    public boolean deleteNode(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        NovelOutline root = this.getById(id);
        if (root == null) {
            return false;
        }
        // 级联收集所有子孙 id
        List<String> allIds = new ArrayList<>();
        collectDescendants(id, allIds);
        allIds.add(id);
        boolean ok = this.removeByIds(allIds);
        if (ok) {
            novelService.refreshWordCount(root.getNovelId());
        }
        return ok;
    }

    private void collectDescendants(String parentId, List<String> collector) {
        LambdaQueryWrapper<NovelOutline> q = new LambdaQueryWrapper<>();
        q.eq(NovelOutline::getParentId, parentId);
        List<NovelOutline> children = this.list(q);
        for (NovelOutline child : children) {
            collector.add(child.getId());
            collectDescendants(child.getId(), collector);
        }
    }

    @Override
    public List<NovelOutlineVO> tree(String novelId) {
        if (StringUtils.isBlank(novelId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        LambdaQueryWrapper<NovelOutline> q = new LambdaQueryWrapper<>();
        q.eq(NovelOutline::getNovelId, novelId);
        q.orderByAsc(NovelOutline::getLevel).orderByAsc(NovelOutline::getSortOrder);
        List<NovelOutline> all = this.list(q);
        Map<String, NovelOutlineVO> voMap = new HashMap<>();
        List<NovelOutlineVO> roots = new ArrayList<>();
        for (NovelOutline node : all) {
            NovelOutlineVO vo = NovelOutlineVO.objToVo(node);
            voMap.put(node.getId(), vo);
        }
        for (NovelOutline node : all) {
            NovelOutlineVO vo = voMap.get(node.getId());
            if (StringUtils.isBlank(node.getParentId())) {
                roots.add(vo);
            } else {
                NovelOutlineVO parent = voMap.get(node.getParentId());
                if (parent != null) {
                    parent.getChildren().add(vo);
                } else {
                    roots.add(vo);
                }
            }
        }
        // 每层排序
        roots.sort(Comparator.comparingInt(v -> v.getSortOrder() == null ? 0 : v.getSortOrder()));
        for (NovelOutlineVO vo : voMap.values()) {
            vo.getChildren().sort(Comparator.comparingInt(v -> v.getSortOrder() == null ? 0 : v.getSortOrder()));
        }
        return roots;
    }

    @Override
    public boolean reorder(NovelOutlineReorderRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return true;
        }
        for (NovelOutlineReorderRequest.Item item : request.getItems()) {
            if (StringUtils.isBlank(item.getId())) continue;
            LambdaUpdateWrapper<NovelOutline> u = new LambdaUpdateWrapper<>();
            u.eq(NovelOutline::getId, item.getId());
            if (item.getSortOrder() != null) u.set(NovelOutline::getSortOrder, item.getSortOrder());
            if (item.getParentId() != null) u.set(NovelOutline::getParentId, item.getParentId());
            if (item.getLevel() != null) u.set(NovelOutline::getLevel, item.getLevel());
            this.update(u);
        }
        return true;
    }

    @Override
    public NovelOutlineVO getVO(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        NovelOutline node = this.getById(id);
        if (node == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        return NovelOutlineVO.objToVo(node);
    }
}
