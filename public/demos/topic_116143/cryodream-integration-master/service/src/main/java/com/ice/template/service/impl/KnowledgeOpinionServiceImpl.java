package com.ice.template.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.mapper.KnowledgeOpinionMapper;
import com.ice.template.model.entity.KnowledgeOpinion;
import com.ice.template.service.KnowledgeOpinionService;
import org.springframework.stereotype.Service;

@Service
public class KnowledgeOpinionServiceImpl extends ServiceImpl<KnowledgeOpinionMapper, KnowledgeOpinion>
        implements KnowledgeOpinionService {
}
