package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sva.common.exception.BusinessException;
import com.sva.entity.*;
import com.sva.mapper.*;
import com.sva.service.EditorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class EditorServiceImpl extends ServiceImpl<EditorProjectMapper, EditorProject> implements EditorService {

    private final TimelineTrackMapper trackMapper;
    private final TimelineClipMapper clipMapper;
    private final VideoMapper videoMapper;
    private final AudioMapper audioMapper;
    private final VideoFrameMapper frameMapper;

    @Override
    @Transactional
    public EditorProject createProject(Long userId, Long projectId, String name, String description) {
        EditorProject project = new EditorProject();
        project.setUserId(userId);
        project.setProjectId(projectId);
        project.setName(name);
        project.setDescription(description);
        project.setDuration(0L);
        project.setResolution("1920x1080");
        project.setFps(30);
        project.setStatus(0);
        project.setExportProgress(0);
        save(project);

        createDefaultTracks(project.getId());
        return project;
    }

    private void createDefaultTracks(Long projectId) {
        List<TimelineTrack> tracks = Arrays.asList(
            createTrackInternal(projectId, "video", "视频轨 1", 0),
            createTrackInternal(projectId, "video", "视频轨 2", 1),
            createTrackInternal(projectId, "audio", "音频轨 1", 0),
            createTrackInternal(projectId, "audio", "音频轨 2", 1),
            createTrackInternal(projectId, "text", "文字轨", 0)
        );
        for (TimelineTrack track : tracks) {
            trackMapper.insert(track);
        }
    }

    private TimelineTrack createTrackInternal(Long projectId, String trackType, String trackName, Integer trackIndex) {
        TimelineTrack track = new TimelineTrack();
        track.setEditorProjectId(projectId);
        track.setTrackType(trackType);
        track.setTrackName(trackName);
        track.setTrackIndex(trackIndex);
        track.setVolume(100);
        track.setIsMuted(0);
        track.setIsLocked(0);
        return track;
    }

    @Override
    public EditorProject getProjectById(Long id, Long userId) {
        EditorProject project = getById(id);
        if (project == null || !project.getUserId().equals(userId)) {
            throw new BusinessException(404, "项目不存在");
        }
        return project;
    }

    @Override
    public List<EditorProject> listProjects(Long userId) {
        return list(new LambdaQueryWrapper<EditorProject>()
                .eq(EditorProject::getUserId, userId)
                .orderByDesc(EditorProject::getUpdateTime));
    }

    @Override
    @Transactional
    public EditorProject updateProject(Long id, Long userId, String name, String description) {
        EditorProject project = getProjectById(id, userId);
        if (name != null) project.setName(name);
        if (description != null) project.setDescription(description);
        updateById(project);
        return project;
    }

    @Override
    @Transactional
    public boolean deleteProject(Long id, Long userId) {
        EditorProject project = getProjectById(id, userId);
        clipMapper.delete(new LambdaQueryWrapper<TimelineClip>()
                .inSql(TimelineClip::getTrackId, "SELECT id FROM t_timeline_track WHERE editor_project_id = " + id));
        trackMapper.delete(new LambdaQueryWrapper<TimelineTrack>()
                .eq(TimelineTrack::getEditorProjectId, id));
        return removeById(id);
    }

    @Override
    public List<TimelineTrack> getTracksByProject(Long projectId) {
        return trackMapper.selectList(new LambdaQueryWrapper<TimelineTrack>()
                .eq(TimelineTrack::getEditorProjectId, projectId)
                .orderByAsc(TimelineTrack::getTrackType)
                .orderByAsc(TimelineTrack::getTrackIndex));
    }

    @Override
    @Transactional
    public TimelineTrack createTrack(Long projectId, String trackType, String trackName, Integer trackIndex) {
        TimelineTrack track = new TimelineTrack();
        track.setEditorProjectId(projectId);
        track.setTrackType(trackType);
        track.setTrackName(trackName);
        track.setTrackIndex(trackIndex);
        track.setVolume(100);
        track.setIsMuted(0);
        track.setIsLocked(0);
        trackMapper.insert(track);
        return track;
    }

    @Override
    @Transactional
    public TimelineTrack updateTrack(Long trackId, Map<String, Object> updates) {
        TimelineTrack track = trackMapper.selectById(trackId);
        if (track == null) {
            throw new BusinessException(404, "轨道不存在");
        }
        if (updates.containsKey("trackName")) track.setTrackName((String) updates.get("trackName"));
        if (updates.containsKey("volume")) track.setVolume((Integer) updates.get("volume"));
        if (updates.containsKey("isMuted")) track.setIsMuted((Integer) updates.get("isMuted"));
        if (updates.containsKey("isLocked")) track.setIsLocked((Integer) updates.get("isLocked"));
        trackMapper.updateById(track);
        return track;
    }

    @Override
    @Transactional
    public boolean deleteTrack(Long trackId) {
        clipMapper.delete(new LambdaQueryWrapper<TimelineClip>()
                .eq(TimelineClip::getTrackId, trackId));
        return trackMapper.deleteById(trackId) > 0;
    }

    @Override
    public List<TimelineClip> getClipsByTrack(Long trackId) {
        return clipMapper.selectList(new LambdaQueryWrapper<TimelineClip>()
                .eq(TimelineClip::getTrackId, trackId)
                .orderByAsc(TimelineClip::getStartPosition));
    }

    @Override
    @Transactional
    public TimelineClip createClip(Long trackId, Map<String, Object> clipData) {
        TimelineClip clip = new TimelineClip();
        clip.setTrackId(trackId);
        clip.setSourceType((String) clipData.get("sourceType"));
        clip.setSourceId((String) clipData.get("sourceId"));
        clip.setSourcePath((String) clipData.get("sourcePath"));
        clip.setBucketName((String) clipData.get("bucketName"));
        clip.setClipName((String) clipData.get("clipName"));
        clip.setStartPosition((Long) clipData.get("startPosition"));
        clip.setDuration((Long) clipData.get("duration"));
        clip.setSourceStart(clipData.containsKey("sourceStart") ? (Long) clipData.get("sourceStart") : 0L);
        clip.setSourceDuration((Long) clipData.get("sourceDuration"));
        clip.setVolume(clipData.containsKey("volume") ? (Integer) clipData.get("volume") : 100);
        clip.setOpacity(clipData.containsKey("opacity") ? (Integer) clipData.get("opacity") : 100);
        clip.setSpeed(clipData.containsKey("speed") ? (Double) clipData.get("speed") : 1.0);
        clip.setInTransition((String) clipData.get("inTransition"));
        clip.setOutTransition((String) clipData.get("outTransition"));
        clip.setTransitionDuration(clipData.containsKey("transitionDuration") ? (Integer) clipData.get("transitionDuration") : 500);
        clip.setEffects((String) clipData.get("effects"));
        clipMapper.insert(clip);
        return clip;
    }

    @Override
    @Transactional
    public TimelineClip updateClip(Long clipId, Map<String, Object> updates) {
        TimelineClip clip = clipMapper.selectById(clipId);
        if (clip == null) {
            throw new BusinessException(404, "片段不存在");
        }
        if (updates.containsKey("clipName")) clip.setClipName((String) updates.get("clipName"));
        if (updates.containsKey("startPosition")) clip.setStartPosition((Long) updates.get("startPosition"));
        if (updates.containsKey("duration")) clip.setDuration((Long) updates.get("duration"));
        if (updates.containsKey("sourceStart")) clip.setSourceStart((Long) updates.get("sourceStart"));
        if (updates.containsKey("volume")) clip.setVolume((Integer) updates.get("volume"));
        if (updates.containsKey("opacity")) clip.setOpacity((Integer) updates.get("opacity"));
        if (updates.containsKey("speed")) clip.setSpeed((Double) updates.get("speed"));
        if (updates.containsKey("inTransition")) clip.setInTransition((String) updates.get("inTransition"));
        if (updates.containsKey("outTransition")) clip.setOutTransition((String) updates.get("outTransition"));
        if (updates.containsKey("transitionDuration")) clip.setTransitionDuration((Integer) updates.get("transitionDuration"));
        if (updates.containsKey("effects")) clip.setEffects((String) updates.get("effects"));
        clipMapper.updateById(clip);
        return clip;
    }

    @Override
    @Transactional
    public boolean deleteClip(Long clipId) {
        return clipMapper.deleteById(clipId) > 0;
    }

    @Override
    @Transactional
    public void saveTimeline(Long projectId, String timelineData) {
        EditorProject project = getById(projectId);
        if (project == null) {
            throw new BusinessException(404, "项目不存在");
        }
        project.setTimelineData(timelineData);
        updateById(project);
    }

    @Override
    public String getTimeline(Long projectId) {
        EditorProject project = getById(projectId);
        if (project == null) {
            throw new BusinessException(404, "项目不存在");
        }
        return project.getTimelineData();
    }

    @Override
    public Map<String, Object> getMaterialLibrary(Long userId) {
        Map<String, Object> library = new HashMap<>();

        List<Video> videos = videoMapper.selectList(new LambdaQueryWrapper<Video>()
                .eq(Video::getUserId, userId)
                .orderByDesc(Video::getCreateTime));
        library.put("videos", videos);

        List<Audio> audios = audioMapper.selectList(new LambdaQueryWrapper<Audio>()
                .eq(Audio::getUserId, userId)
                .orderByDesc(Audio::getCreateTime));
        library.put("audios", audios);

        List<VideoFrame> frames = frameMapper.selectList(new LambdaQueryWrapper<VideoFrame>()
                .inSql(VideoFrame::getVideoId, "SELECT id FROM t_video WHERE user_id = " + userId)
                .orderByDesc(VideoFrame::getTimestampMs));
        library.put("images", frames);

        return library;
    }
}