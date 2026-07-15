package com.sva.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class FFmpegUtil {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ffmpeg.enabled:false}")
    private boolean ffmpegEnabled;

    @Value("${ffmpeg.path:ffmpeg}")
    private String ffmpegPath;

    @Value("${ffprobe.path:ffprobe}")
    private String ffprobePath;

    public boolean isFFmpegAvailable() {
        if (!ffmpegEnabled) {
            return false;
        }
        try {
            ProcessBuilder pb = new ProcessBuilder(ffmpegPath, "-version");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            log.warn("FFmpeg is not available: {}", e.getMessage());
            return false;
        }
    }

    public VideoMeta getVideoMeta(String inputPath) {
        if (!isFFmpegAvailable()) {
            log.info("FFmpeg not available, returning mock video meta");
            return getMockVideoMeta();
        }
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    ffprobePath,
                    "-v", "quiet",
                    "-print_format", "json",
                    "-show_format",
                    "-show_streams",
                    inputPath
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.warn("Failed to get video meta, exit code: {}", exitCode);
                return getMockVideoMeta();
            }
            return parseVideoMeta(output.toString());
        } catch (Exception e) {
            log.error("Error getting video meta", e);
            return getMockVideoMeta();
        }
    }

    public List<String> extractKeyFrames(String inputPath, String outputDir, int intervalSeconds) {
        List<String> framePaths = new ArrayList<>();
        if (!isFFmpegAvailable()) {
            log.info("FFmpeg not available, returning empty key frames list");
            return framePaths;
        }
        try {
            File dir = new File(outputDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            String outputPattern = outputDir + File.separator + "frame_%04d.jpg";
            ProcessBuilder pb = new ProcessBuilder(
                    ffmpegPath,
                    "-y",
                    "-i", inputPath,
                    "-vf", "fps=1/" + intervalSeconds,
                    "-q:v", "2",
                    outputPattern
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            while (reader.readLine() != null) {
                // consume output
            }
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.warn("Failed to extract key frames, exit code: {}", exitCode);
                return framePaths;
            }
            File[] files = dir.listFiles((d, name) -> name.startsWith("frame_") && name.endsWith(".jpg"));
            if (files != null) {
                for (File file : files) {
                    framePaths.add(file.getAbsolutePath());
                }
            }
            return framePaths;
        } catch (Exception e) {
            log.error("Error extracting key frames", e);
            return framePaths;
        }
    }

    public String extractAudio(String inputPath, String outputPath) {
        if (!isFFmpegAvailable()) {
            log.info("FFmpeg not available, skipping audio extraction");
            return null;
        }
        try {
            File outputFile = new File(outputPath);
            File parentDir = outputFile.getParentFile();
            if (parentDir != null && !parentDir.exists()) {
                parentDir.mkdirs();
            }
            ProcessBuilder pb = new ProcessBuilder(
                    ffmpegPath,
                    "-y",
                    "-i", inputPath,
                    "-vn",
                    "-acodec", "libmp3lame",
                    "-q:a", "2",
                    outputPath
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            while (reader.readLine() != null) {
                // consume output
            }
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.warn("Failed to extract audio, exit code: {}", exitCode);
                return null;
            }
            File file = new File(outputPath);
            if (file.exists() && file.length() > 0) {
                return outputPath;
            }
            return null;
        } catch (Exception e) {
            log.error("Error extracting audio", e);
            return null;
        }
    }

    public List<Map<String, Object>> detectScenes(String inputPath, double threshold) {
        List<Map<String, Object>> scenes = new ArrayList<>();
        if (!isFFmpegAvailable()) {
            log.info("FFmpeg not available, returning empty scenes list");
            return scenes;
        }
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    ffmpegPath,
                    "-i", inputPath,
                    "-filter:v", "select='gt(scene," + threshold + ")',showinfo",
                    "-f", "null",
                    "-"
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.contains("pts_time:")) {
                    try {
                        int ptsIdx = line.indexOf("pts_time:");
                        int endIdx = line.indexOf(" ", ptsIdx);
                        if (endIdx == -1) endIdx = line.length();
                        String timeStr = line.substring(ptsIdx + 9, endIdx).trim();
                        double timestamp = Double.parseDouble(timeStr);
                        Map<String, Object> scene = new HashMap<>();
                        scene.put("timestamp", timestamp);
                        scene.put("timestampMs", (long) (timestamp * 1000));
                        scenes.add(scene);
                    } catch (Exception e) {
                        // ignore parse error
                    }
                }
            }
            process.waitFor();
            return scenes;
        } catch (Exception e) {
            log.error("Error detecting scenes", e);
            return scenes;
        }
    }

    private VideoMeta getMockVideoMeta() {
        VideoMeta meta = new VideoMeta();
        meta.setDuration(300);
        meta.setWidth(1920);
        meta.setHeight(1080);
        meta.setFps(30.0);
        meta.setFormat("mp4");
        meta.setHasAudio(true);
        meta.setAudioCodec("aac");
        meta.setVideoCodec("h264");
        return meta;
    }

    private VideoMeta parseVideoMeta(String jsonOutput) {
        VideoMeta meta = new VideoMeta();
        try {
            Map<String, Object> root = objectMapper.readValue(jsonOutput, Map.class);

            Map<String, Object> format = (Map<String, Object>) root.get("format");
            if (format != null) {
                if (format.containsKey("duration")) {
                    meta.setDuration((int) Double.parseDouble(format.get("duration").toString()));
                }
                if (format.containsKey("format_name")) {
                    String formatName = format.get("format_name").toString();
                    meta.setFormat(formatName.split(",")[0]);
                }
            }

            List<Map<String, Object>> streams = (List<Map<String, Object>>) root.get("streams");
            if (streams != null) {
                for (Map<String, Object> stream : streams) {
                    String codecType = (String) stream.get("codec_type");
                    if ("video".equals(codecType)) {
                        if (stream.containsKey("width")) {
                            meta.setWidth((Integer) stream.get("width"));
                        }
                        if (stream.containsKey("height")) {
                            meta.setHeight((Integer) stream.get("height"));
                        }
                        if (stream.containsKey("r_frame_rate")) {
                            String fpsStr = stream.get("r_frame_rate").toString();
                            String[] parts = fpsStr.split("/");
                            if (parts.length == 2 && !parts[1].equals("0")) {
                                double fps = Double.parseDouble(parts[0]) / Double.parseDouble(parts[1]);
                                meta.setFps(Math.round(fps * 100.0) / 100.0);
                            }
                        }
                        if (stream.containsKey("codec_name")) {
                            meta.setVideoCodec((String) stream.get("codec_name"));
                        }
                    } else if ("audio".equals(codecType)) {
                        meta.setHasAudio(true);
                        if (stream.containsKey("codec_name")) {
                            meta.setAudioCodec((String) stream.get("codec_name"));
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse video meta with Jackson, falling back to string parsing", e);
            return parseVideoMetaFallback(jsonOutput);
        }
        if (meta.getDuration() == null || meta.getWidth() == null || meta.getHeight() == null) {
            return getMockVideoMeta();
        }
        return meta;
    }

    private VideoMeta parseVideoMetaFallback(String jsonOutput) {
        VideoMeta meta = new VideoMeta();
        try {
            int durationIdx = jsonOutput.indexOf("\"duration\"");
            if (durationIdx != -1) {
                int start = jsonOutput.indexOf("\"", durationIdx + 10) + 1;
                int end = jsonOutput.indexOf("\"", start);
                if (end > start) {
                    String durationStr = jsonOutput.substring(start, end);
                    meta.setDuration((int) Double.parseDouble(durationStr));
                }
            }
            int widthIdx = jsonOutput.indexOf("\"width\"");
            if (widthIdx != -1) {
                int start = jsonOutput.indexOf(":", widthIdx) + 1;
                int end = jsonOutput.indexOf(",", start);
                if (end > start) {
                    meta.setWidth(Integer.parseInt(jsonOutput.substring(start, end).trim()));
                }
            }
            int heightIdx = jsonOutput.indexOf("\"height\"");
            if (heightIdx != -1) {
                int start = jsonOutput.indexOf(":", heightIdx) + 1;
                int end = jsonOutput.indexOf(",", start);
                if (end > start) {
                    meta.setHeight(Integer.parseInt(jsonOutput.substring(start, end).trim()));
                }
            }
            int rFrameRateIdx = jsonOutput.indexOf("\"r_frame_rate\"");
            if (rFrameRateIdx != -1) {
                int start = jsonOutput.indexOf("\"", rFrameRateIdx + 15) + 1;
                int end = jsonOutput.indexOf("\"", start);
                if (end > start) {
                    String fpsStr = jsonOutput.substring(start, end);
                    String[] parts = fpsStr.split("/");
                    if (parts.length == 2) {
                        double fps = Double.parseDouble(parts[0]) / Double.parseDouble(parts[1]);
                        meta.setFps(Math.round(fps * 100.0) / 100.0);
                    }
                }
            }
            int formatNameIdx = jsonOutput.indexOf("\"format_name\"");
            if (formatNameIdx != -1) {
                int start = jsonOutput.indexOf("\"", formatNameIdx + 14) + 1;
                int end = jsonOutput.indexOf("\"", start);
                if (end > start) {
                    meta.setFormat(jsonOutput.substring(start, end).split(",")[0]);
                }
            }
            meta.setHasAudio(jsonOutput.contains("\"codec_type\":\"audio\""));
        } catch (Exception e) {
            log.warn("Failed to parse video meta fallback, using mock data", e);
            return getMockVideoMeta();
        }
        return meta;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VideoMeta {
        private Integer duration;
        private Integer width;
        private Integer height;
        private Double fps;
        private String format;
        private Boolean hasAudio;
        private String videoCodec;
        private String audioCodec;
    }
}
