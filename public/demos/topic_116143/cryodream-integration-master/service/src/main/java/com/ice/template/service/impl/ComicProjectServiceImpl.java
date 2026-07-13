package com.ice.template.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.mapper.ComicProjectMapper;
import com.ice.template.model.entity.ComicProject;
import com.ice.template.service.ComicProjectService;
import org.springframework.stereotype.Service;

@Service
public class ComicProjectServiceImpl extends ServiceImpl<ComicProjectMapper, ComicProject>
        implements ComicProjectService {
}
