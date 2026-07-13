package com.ice.template.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.mapper.KnowledgeEventMapper;
import com.ice.template.model.entity.KnowledgeEvent;
import com.ice.template.service.KnowledgeEventService;
import org.springframework.stereotype.Service;

@Service
public class KnowledgeEventServiceImpl extends ServiceImpl<KnowledgeEventMapper, KnowledgeEvent> implements KnowledgeEventService {
}
