package com.sva.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.sva.entity.EditorProject;
import com.sva.entity.TimelineClip;
import com.sva.entity.TimelineTrack;

import java.util.List;
import java.util.Map;

public interface EditorService extends IService<EditorProject> {

    EditorProject createProject(Long userId, Long projectId, String name, String description);

    EditorProject getProjectById(Long id, Long userId);

    List<EditorProject> listProjects(Long userId);

    EditorProject updateProject(Long id, Long userId, String name, String description);

    boolean deleteProject(Long id, Long userId);

    List<TimelineTrack> getTracksByProject(Long projectId);

    TimelineTrack createTrack(Long projectId, String trackType, String trackName, Integer trackIndex);

    TimelineTrack updateTrack(Long trackId, Map<String, Object> updates);

    boolean deleteTrack(Long trackId);

    List<TimelineClip> getClipsByTrack(Long trackId);

    TimelineClip createClip(Long trackId, Map<String, Object> clipData);

    TimelineClip updateClip(Long clipId, Map<String, Object> updates);

    boolean deleteClip(Long clipId);

    void saveTimeline(Long projectId, String timelineData);

    String getTimeline(Long projectId);

    Map<String, Object> getMaterialLibrary(Long userId);
}