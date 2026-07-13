package com.ice.template.rag;

import com.github.houbb.opencc4j.util.ZhConverterUtil;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import org.apache.commons.lang3.StringUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class DocumentParser {

    private static final Logger log = LoggerFactory.getLogger(DocumentParser.class);

    private static final Set<String> VIDEO_EXTENSIONS = Set.of(
            "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v"
    );

    private static final Set<String> AUDIO_EXTENSIONS = Set.of(
            "wav", "mp3", "flac", "aac", "ogg", "m4a"
    );

    @Value("${whisper.model.path:models/ggml-medium.bin}")
    private String whisperModelPath;

    @Value("${whisper.language:zh}")
    private String whisperLanguage;

    @Value("${ffmpeg.timeout.minutes:30}")
    private int ffmpegTimeoutMinutes;

    @Value("${whisper.script:simplified}")
    private String whisperScript;

    public String parse(String filePath) {
        if (StringUtils.isBlank(filePath)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件路径不能为空");
        }

        String fileType = getFileType(filePath);
        String normalized = normalizeFileType(fileType);

        // 视频文件：FFmpeg 抽音轨 + Whisper 转录
        if (VIDEO_EXTENSIONS.contains(normalized) || AUDIO_EXTENSIONS.contains(normalized)) {
            return parseVideoOrAudio(filePath, normalized);
        }

        return switch (normalized) {
            case "txt" -> parseTxt(filePath);
            case "md" -> parseMd(filePath);
            case "pdf" -> parsePdf(filePath);
            default -> throw new BusinessException(ErrorCode.PARAMS_ERROR, "不支持的文件类型: " + fileType);
        };
    }

    public String parseContent(String content, String fileType) {
        if (StringUtils.isBlank(content)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "内容不能为空");
        }
        if (StringUtils.isBlank(fileType)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件类型不能为空");
        }

        return switch (normalizeFileType(fileType)) {
            case "txt" -> parseTxtContent(content);
            case "md" -> parseMdContent(content);
            default -> throw new BusinessException(ErrorCode.PARAMS_ERROR, "不支持的文件类型: " + fileType);
        };
    }

    public boolean isVideoOrAudio(String fileType) {
        if (fileType == null) return false;
        String normalized = normalizeFileType(fileType);
        return VIDEO_EXTENSIONS.contains(normalized) || AUDIO_EXTENSIONS.contains(normalized);
    }

    // ========== 视频/音频解析 ==========

    /**
     * 视频或音频文件 → Markdown
     * 1. 视频先抽 16kHz WAV 音轨
     * 2. FFmpeg whisper 滤镜转录为 SRT
     * 3. SRT → 结构化 Markdown
     */
    private String parseVideoOrAudio(String filePath, String fileType) {
        try {
            File inputFile = new File(filePath);
            if (!inputFile.exists()) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件不存在: " + filePath);
            }

            File modelFile = resolveModelFile();
            if (!modelFile.exists()) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR,
                        "Whisper 模型文件不存在: " + modelFile.getAbsolutePath()
                                + "，请下载 ggml-medium.bin 放到 service/models/ 目录");
            }

            // 步骤1：如果是视频，先抽取音频
            Path tempAudio = null;
            File audioFile;
            if (AUDIO_EXTENSIONS.contains(fileType)) {
                audioFile = inputFile;
            } else {
                tempAudio = extractAudio(inputFile);
                audioFile = tempAudio.toFile();
            }

            // 步骤2：whisper 转录到 SRT
            Path tempSrt = Files.createTempFile("whisper_", ".srt");
            tempSrt.toFile().deleteOnExit();

            runWhisperTranscribe(audioFile, modelFile, tempSrt.toFile());

            String srtContent = normalizeScript(Files.readString(tempSrt, StandardCharsets.UTF_8));

            // 清理临时文件
            if (tempAudio != null) {
                try { Files.deleteIfExists(tempAudio); } catch (Exception ignored) {}
            }
            try { Files.deleteIfExists(tempSrt); } catch (Exception ignored) {}

            if (StringUtils.isBlank(srtContent)) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "转录结果为空，可能视频没有语音内容");
            }

            // 步骤3：SRT → Markdown
            return convertSrtToMarkdown(srtContent, extractTitle(inputFile.getName()));

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "视频转录失败: " + e.getMessage());
        }
    }

    private Path extractAudio(File videoFile) throws Exception {
        Path tempAudio = Files.createTempFile("whisper_audio_", ".wav");
        tempAudio.toFile().deleteOnExit();

        String[] cmd = {
                "ffmpeg", "-y",
                "-i", videoFile.getAbsolutePath(),
                "-vn",
                "-acodec", "pcm_s16le",
                "-ar", "16000",
                "-ac", "1",
                tempAudio.toAbsolutePath().toString()
        };

        runFFmpeg(cmd, "音频抽取");
        return tempAudio;
    }

    private void runWhisperTranscribe(File audioFile, File modelFile, File srtOutputFile) {
        String escapedModelPath = escapePathForFFmpegFilter(modelFile.getAbsolutePath());
        String escapedOutputPath = escapePathForFFmpegFilter(srtOutputFile.getAbsolutePath());

        String whisperFilter = String.format(
                "whisper=model=%s:language=%s:format=srt:destination=%s",
                escapedModelPath, whisperLanguage, escapedOutputPath
        );

        String[] cmd = {
                "ffmpeg", "-y",
                "-i", audioFile.getAbsolutePath(),
                "-af", whisperFilter,
                "-f", "null", "-"
        };

        runFFmpeg(cmd, "Whisper转录");
    }

    private void runFFmpeg(String[] cmd, String stepName) {
        log.info("[DocumentParser] {} 命令: {}", stepName, String.join(" ", cmd));

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(new File(System.getProperty("user.dir")));
        pb.redirectErrorStream(true);

        try {
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            boolean finished = process.waitFor(ffmpegTimeoutMinutes, java.util.concurrent.TimeUnit.MINUTES);
            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException(stepName + " 超时（" + ffmpegTimeoutMinutes + " 分钟）");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                String outputStr = output.toString();
                throw new RuntimeException(stepName + " 失败，exitCode=" + exitCode + "，输出: "
                        + outputStr.substring(0, Math.min(outputStr.length(), 1000)));
            }

            log.info("[DocumentParser] {} 完成", stepName);

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(stepName + " 执行异常: " + e.getMessage(), e);
        }
    }

    /**
     * FFmpeg 滤镜参数中 Windows 盘符冒号转义
     */
    private String escapePathForFFmpegFilter(String path) {
        String normalized = path.replace('\\', '/');
        if (normalized.length() >= 3
                && Character.isLetter(normalized.charAt(0))
                && normalized.charAt(1) == ':'
                && normalized.charAt(2) == '/') {
            return normalized.charAt(0) + "\\\\:" + normalized.substring(2);
        }
        return normalized;
    }

    private String normalizeScript(String text) {
        if (StringUtils.isBlank(text)) {
            return text;
        }
        String script = StringUtils.defaultIfBlank(whisperScript, "simplified").trim().toLowerCase();
        if ("simplified".equals(script) || "simple".equals(script) || "zh-cn".equals(script) || "zh_hans".equals(script)) {
            return ZhConverterUtil.toSimple(text);
        }
        if ("traditional".equals(script) || "zh-tw".equals(script) || "zh_hant".equals(script)) {
            return ZhConverterUtil.toTraditional(text);
        }
        return text;
    }

    private File resolveModelFile() {
        File file = new File(whisperModelPath);
        if (file.isAbsolute() && file.exists()) {
            return file;
        }
        return new File(System.getProperty("user.dir"), whisperModelPath);
    }

    // ========== SRT → Markdown ==========

    private String convertSrtToMarkdown(String srtContent, String title) {
        StringBuilder md = new StringBuilder();
        md.append("# ").append(title).append("\n\n");

        String[] blocks = srtContent.trim().split("\n\\s*\n");
        StringBuilder paragraph = new StringBuilder();
        String lastTimestamp = null;

        for (String block : blocks) {
            String[] lines = block.trim().split("\n");
            if (lines.length < 3) continue;

            String timestamp = extractStartTime(lines[1]);
            String text = String.join(" ", Arrays.copyOfRange(lines, 2, lines.length)).trim();
            if (text.isEmpty()) continue;

            if (lastTimestamp != null && isTimeGapOverSeconds(lastTimestamp, timestamp, 5)) {
                if (paragraph.length() > 0) {
                    md.append(paragraph.toString().trim()).append("\n\n");
                    paragraph = new StringBuilder();
                }
                md.append("## ").append(timestamp).append("\n\n");
            } else if (lastTimestamp == null) {
                md.append("## ").append(timestamp).append("\n\n");
            }

            paragraph.append(text).append(" ");
            lastTimestamp = timestamp;
        }

        if (paragraph.length() > 0) {
            md.append(paragraph.toString().trim()).append("\n");
        }

        return md.toString();
    }

    private String extractStartTime(String timestampLine) {
        if (timestampLine == null) return "00:00:00";
        String[] parts = timestampLine.split("-->");
        if (parts.length == 0) return "00:00:00";
        String start = parts[0].trim();
        int commaIdx = start.indexOf(',');
        return commaIdx > 0 ? start.substring(0, commaIdx) : start;
    }

    private boolean isTimeGapOverSeconds(String time1, String time2, int threshold) {
        return parseTimeToSeconds(time2) - parseTimeToSeconds(time1) > threshold;
    }

    private long parseTimeToSeconds(String timeStr) {
        try {
            String[] parts = timeStr.split(":");
            if (parts.length == 3) {
                return Long.parseLong(parts[0]) * 3600
                        + Long.parseLong(parts[1]) * 60
                        + Long.parseLong(parts[2]);
            }
        } catch (NumberFormatException ignored) {}
        return 0;
    }

    private String extractTitle(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot > 0 ? fileName.substring(0, dot) : fileName;
    }

    // ========== 原有解析方法 ==========

    private String getFileType(String filePath) {
        int lastDotIndex = filePath.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filePath.length() - 1) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "无法确定文件类型");
        }
        return filePath.substring(lastDotIndex + 1);
    }

    private String parseTxt(String filePath) {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "读取文件失败: " + e.getMessage());
        }
        return sb.toString().trim();
    }

    private String parseMd(String filePath) {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "读取文件失败: " + e.getMessage());
        }
        return parseMdContent(sb.toString());
    }

    private String parsePdf(String filePath) {
        try (PDDocument document = PDDocument.load(new File(filePath))) {
            PDFTextStripper stripper = new PDFTextStripper();
            StringBuilder sb = new StringBuilder();
            int pageCount = document.getNumberOfPages();
            for (int page = 1; page <= pageCount; page++) {
                stripper.setStartPage(page);
                stripper.setEndPage(page);
                String pageText = stripper.getText(document);
                if (StringUtils.isNotBlank(pageText)) {
                    sb.append("## 第 ").append(page).append(" 页\n\n");
                    sb.append(pageText.trim()).append("\n\n");
                }
            }
            String markdown = sb.toString().trim();
            if (StringUtils.isBlank(markdown)) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "PDF 未提取到文本内容");
            }
            return markdown;
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "解析 PDF 失败: " + e.getMessage());
        }
    }

    private String parseTxtContent(String content) {
        if (content == null) {
            return "";
        }
        return content.replaceAll("\\n{3,}", "\n\n").trim();
    }

    private String parseMdContent(String content) {
        if (content == null) {
            return "";
        }
        return content.replaceAll("\\n{3,}", "\n\n").trim();
    }

    private String normalizeFileType(String fileType) {
        String normalized = fileType.toLowerCase();
        if ("markdown".equals(normalized)) {
            return "md";
        }
        return normalized;
    }
}
