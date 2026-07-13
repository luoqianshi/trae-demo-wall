package com.ice.template.service.impl;

import com.github.houbb.opencc4j.util.ZhConverterUtil;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.service.DiaryTranscribeService;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DiaryTranscribeServiceImpl implements DiaryTranscribeService {

    private static final Logger log = LoggerFactory.getLogger(DiaryTranscribeServiceImpl.class);
    private static final DateTimeFormatter DATE_PATH = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Value("${whisper.model.path:models/ggml-medium.bin}")
    private String whisperModelPath;

    @Value("${whisper.language:zh}")
    private String defaultLanguage;

    @Value("${whisper.script:simplified}")
    private String defaultScript;

    @Value("${ffmpeg.timeout.minutes:10}")
    private int ffmpegTimeoutMinutes;

    @Value("${diary.audio.dir:./data/diary-audio}")
    private String audioDir;

    @Override
    public String[] transcribe(MultipartFile audioFile) {
        if (audioFile == null || audioFile.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "录音文件为空");
        }

        try {
            // 1. 保存录音文件
            String dateStr = LocalDate.now().format(DATE_PATH);
            String fileName = java.util.UUID.randomUUID() + ".wav";
            Path dirPath = Path.of(audioDir, dateStr).toAbsolutePath();
            Files.createDirectories(dirPath);
            Path audioPath = dirPath.resolve(fileName);
            audioFile.transferTo(audioPath.toFile());
            log.info("[DiaryTranscribe] 录音已保存: {}", audioPath);

            // 2. FFmpeg 抽 16kHz 单声道 WAV（如果输入不是 wav 则转换）
            File wavFile = audioPath.toFile();
            if (!fileName.endsWith(".wav")) {
                Path converted = dirPath.resolve("conv_" + fileName.replaceAll("\\.[^.]+$", ".wav"));
                runFFmpeg(new String[]{
                    "ffmpeg", "-y", "-i", audioPath.toString(),
                    "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
                    converted.toString()
                }, "音频转换");
                wavFile = converted.toFile();
            } else {
                // 确保 16kHz 单声道
                Path normalized = dirPath.resolve("norm_" + fileName);
                runFFmpeg(new String[]{
                    "ffmpeg", "-y", "-i", audioPath.toString(),
                    "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
                    normalized.toString()
                }, "音频标准化");
                wavFile = normalized.toFile();
            }

            // 3. 校验模型文件
            File modelFile = resolveModelFile();
            if (!modelFile.exists()) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR,
                    "Whisper 模型文件不存在: " + modelFile.getAbsolutePath());
            }

            // 4. whisper 转录到 SRT
            Path srtPath = Files.createTempFile("diary_whisper_", ".srt");
            srtPath.toFile().deleteOnExit();
            runWhisperTranscribe(wavFile, modelFile, srtPath.toFile(), defaultLanguage);

            // 5. SRT → 纯文本
            String srtContent = Files.readString(srtPath, StandardCharsets.UTF_8);
            String plainText = srtToPlainText(srtContent);

            // 繁转简
            if ("simplified".equals(defaultScript)) {
                plainText = ZhConverterUtil.toSimple(plainText);
            }

            // 6. 计算时长
            int durationSec = extractDuration(srtContent);

            // 7. 清理临时 SRT
            try { Files.deleteIfExists(srtPath); } catch (Exception ignored) {}

            // 8. 构建可访问 URL
            String audioUrl = "/api/diary/audio/" + dateStr + "/" + fileName;

            log.info("[DiaryTranscribe] 转录完成: textLength={}, duration={}s", plainText.length(), durationSec);
            return new String[]{audioUrl, plainText, String.valueOf(durationSec)};
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("[DiaryTranscribe] 转录失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "语音转文字失败: " + e.getMessage());
        }
    }

    private void runWhisperTranscribe(File audioFile, File modelFile, File srtOutput, String language) {
        String escapedModelPath = escapePathForFFmpegFilter(modelFile.getAbsolutePath());
        String escapedOutputPath = escapePathForFFmpegFilter(srtOutput.getAbsolutePath());
        String whisperFilter = String.format(
            "whisper=model=%s:language=%s:format=srt:destination=%s",
            escapedModelPath, language, escapedOutputPath
        );
        runFFmpeg(new String[]{
            "ffmpeg", "-y", "-i", audioFile.getAbsolutePath(),
            "-af", whisperFilter, "-f", "null", "-"
        }, "Whisper转录");
    }

    private void runFFmpeg(String[] cmd, String stepName) {
        log.info("[DiaryTranscribe] {} 命令: {}", stepName, String.join(" ", cmd));
        File serviceDir = new File(System.getProperty("user.dir"));
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(serviceDir);
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
                throw new RuntimeException(stepName + " 超时");
            }
            if (process.exitValue() != 0) {
                String out = output.toString();
                throw new RuntimeException(stepName + " 失败 exitCode=" + process.exitValue() + " 输出: "
                    + out.substring(0, Math.min(out.length(), 500)));
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(stepName + " 执行异常: " + e.getMessage(), e);
        }
    }

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

    private File resolveModelFile() {
        File file = new File(whisperModelPath);
        if (file.isAbsolute() && file.exists()) return file;
        return new File(System.getProperty("user.dir"), whisperModelPath);
    }

    private String srtToPlainText(String srtContent) {
        if (srtContent == null || srtContent.isBlank()) return "";
        StringBuilder text = new StringBuilder();
        String[] blocks = srtContent.trim().split("\n\\s*\n");
        for (String block : blocks) {
            String[] lines = block.trim().split("\n");
            if (lines.length < 3) continue;
            for (int i = 2; i < lines.length; i++) {
                text.append(lines[i].trim()).append(" ");
            }
        }
        return text.toString().trim();
    }

    private int extractDuration(String srtContent) {
        if (srtContent == null || srtContent.isBlank()) return 0;
        String[] blocks = srtContent.trim().split("\n\\s*\n");
        if (blocks.length == 0) return 0;
        String lastBlock = blocks[blocks.length - 1];
        String[] lines = lastBlock.trim().split("\n");
        if (lines.length < 2) return 0;
        String timestampLine = lines[1];
        String[] parts = timestampLine.split("-->");
        if (parts.length < 2) return 0;
        String end = parts[1].trim();
        int comma = end.indexOf(',');
        String timeStr = comma > 0 ? end.substring(0, comma) : end;
        return (int) parseTimeToSeconds(timeStr);
    }

    private long parseTimeToSeconds(String timeStr) {
        try {
            String[] parts = timeStr.split(":");
            if (parts.length == 3) {
                return Long.parseLong(parts[0]) * 3600
                    + Long.parseLong(parts[1]) * 60
                    + Long.parseLong(parts[2]);
            }
        } catch (Exception ignored) {}
        return 0;
    }
}
