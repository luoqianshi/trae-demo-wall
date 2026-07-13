package com.ice.template.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.mapper.KnowledgeCaseMapper;
import com.ice.template.model.entity.KnowledgeCase;
import com.ice.template.service.KnowledgeCaseService;
import org.springframework.stereotype.Service;

@Service
public class KnowledgeCaseServiceImpl extends ServiceImpl<KnowledgeCaseMapper, KnowledgeCase> implements KnowledgeCaseService {
}
