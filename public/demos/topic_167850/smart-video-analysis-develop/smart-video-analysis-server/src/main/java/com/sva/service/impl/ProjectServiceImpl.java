package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sva.common.exception.BusinessException;
import com.sva.entity.Project;
import com.sva.mapper.ProjectMapper;
import com.sva.service.ProjectService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectServiceImpl extends ServiceImpl<ProjectMapper, Project> implements ProjectService {

    @Override
    public List<Project> listByUserId(Long userId) {
        return list(new LambdaQueryWrapper<Project>()
                .eq(Project::getUserId, userId)
                .orderByDesc(Project::getUpdateTime));
    }

    @Override
    public Project createProject(Long userId, String name, String description) {
        Project project = new Project();
        project.setUserId(userId);
        project.setName(name);
        project.setDescription(description);
        project.setStatus(1);
        save(project);
        return project;
    }

    @Override
    public Project updateProject(Long id, Long userId, String name, String description) {
        Project project = getById(id);
        if (project == null || !project.getUserId().equals(userId)) {
            throw new BusinessException(404, "项目不存在");
        }
        project.setName(name);
        project.setDescription(description);
        updateById(project);
        return project;
    }
}
