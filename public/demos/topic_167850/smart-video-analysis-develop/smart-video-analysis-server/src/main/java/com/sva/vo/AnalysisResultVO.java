package com.sva.vo;

import com.sva.entity.Video;
import com.sva.entity.VideoAnalysis;
import com.sva.entity.VideoFrame;
import lombok.Data;

import java.util.List;

@Data
public class AnalysisResultVO {

    private Video video;

    private String videoUrl;

    private VideoAnalysis analysis;

    private List<VideoFrame> frames;

    private List<TranscriptItem> transcriptList;

    @Data
    public static class TranscriptItem {
        private String startTime;
        private String endTime;
        private Long timestampMs;
        private String text;
    }
}
