package com.ice.template.service.impl;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.mapper.AnalysisHistoryMapper;
import com.ice.template.model.entity.AnalysisHistory;
import com.ice.template.rag.generation.AnalysisResponse;
import com.ice.template.service.AnalysisHistoryService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnalysisHistoryServiceImpl extends ServiceImpl<AnalysisHistoryMapper, AnalysisHistory>
        implements AnalysisHistoryService {

    @Override
    public AnalysisHistory saveHistory(String kbId, AnalysisResponse response) {
        if (response == null) {
            return null;
        }
        AnalysisHistory history = new AnalysisHistory();
        history.setKbId(kbId);
        history.setUserQuery(response.getQuery());
        history.setRewrittenQuery(response.getRewrittenQuery() == null
                ? null : JSONUtil.toJsonStr(response.getRewrittenQuery()));
        history.setRetrievedCount(response.getRetrievedCount());
        history.setAnalysisResult(response.getReport());
        history.setCitations(JSONUtil.toJsonStr(response.getCitations()));
        history.setElapsedMs(response.getElapsedMs());
        save(history);
        return history;
    }

    @Override
    public List<AnalysisHistory> listHistory(String kbId, int limit) {
        QueryWrapper<AnalysisHistory> wrapper = new QueryWrapper<>();
        if (StringUtils.isNotBlank(kbId)) {
            wrapper.eq("kb_id", kbId);
        }
        wrapper.orderByDesc("create_time");
        wrapper.last("LIMIT " + (limit > 0 ? limit : 50));
        return list(wrapper);
    }
}
