package com.ice.template.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.mapper.ComfyUIWorkflowMapper;
import com.ice.template.model.entity.ComfyUIWorkflow;
import com.ice.template.service.ComfyUIWorkflowService;
import org.springframework.stereotype.Service;

@Service
public class ComfyUIWorkflowServiceImpl extends ServiceImpl<ComfyUIWorkflowMapper, ComfyUIWorkflow>
        implements ComfyUIWorkflowService {
}
