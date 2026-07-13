package com.ice.template.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.mapper.ComfyUIProjectMapper;
import com.ice.template.model.entity.ComfyUIProject;
import com.ice.template.service.ComfyUIProjectService;
import org.springframework.stereotype.Service;

@Service
public class ComfyUIProjectServiceImpl extends ServiceImpl<ComfyUIProjectMapper, ComfyUIProject>
        implements ComfyUIProjectService {
}
