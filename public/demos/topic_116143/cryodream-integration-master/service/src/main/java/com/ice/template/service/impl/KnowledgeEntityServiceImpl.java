package com.ice.template.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.mapper.KnowledgeEntityMapper;
import com.ice.template.model.entity.KnowledgeEntity;
import com.ice.template.service.KnowledgeEntityService;
import org.springframework.stereotype.Service;

@Service
public class KnowledgeEntityServiceImpl extends ServiceImpl<KnowledgeEntityMapper, KnowledgeEntity>
        implements KnowledgeEntityService {
}
