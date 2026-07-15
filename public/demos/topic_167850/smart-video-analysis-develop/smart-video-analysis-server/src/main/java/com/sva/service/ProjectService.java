package com.sva.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sva.entity.Project;

import java.util.List;

public interface ProjectService extends IService<Project> {

    List<Project> listByUserId(Long userId);

    Project createProject(Long userId, String name, String description);

    Project updateProject(Long id, Long userId, String name, String description);
}
