package com.ice.template.executor.node;

import com.github.houbb.opencc4j.util.ZhConverterUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 视频音频转录节点：使用 FFmpeg 8.x 内建 whisper 滤镜从视频中提取音频并转录为文本。
 *
 * <p>处理流程：</p>
 * <ol>
 *   <li>视频文件 → FFmpeg 抽取 16kHz 单声道 WAV 音频</li>
 *   <li>WAV 音频 → FFmpeg whisper 滤镜转录 → SRT 字幕</li>
 *   <li>SRT 字幕 → 转换为结构化 Markdown 文本</li>
 * </ol>
 *
 * <p>依赖：FFmpeg 8.x+（编译时需 --enable-whisper）+ ggml 模型文件。</p>
 *
 * <p>Windows 注意：FFmpeg whisper 滤镜参数以冒号分隔，路径中的盘符冒号需转义为 \\:</p>
 */
@Component
public class VideoAudioTranscriberNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(VideoAudioTranscriberNodeExecutor.class);

    @Value("${whisper.model.path:models/ggml-medium.bin}")
    private String whisperModelPath;

    @Value("${whisper.language:zh}")
    private String defaultLanguage;

    @Value("${ffmpeg.timeout.minutes:30}")
    private int ffmpegTimeoutMinutes;

    @Value("${whisper.script:simplified}")
    private String defaultScript;

    /** 服务工作目录，用于解析相对路径 */
    private final File serviceDir = new File(System.getProperty("user.dir"));

    @Override
    public boolean supports(String nodeType) {
        return "VideoAudioTranscriber".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String filePath = resolveFilePath(node, context);
        String language = FlowNodeDataUtils.getTemplateString(node, "language");
        if (StringUtils.isBlank(language)) {
            language = defaultLanguage;
        }
        String outputFormat = FlowNodeDataUtils.getTemplateString(node, "output_format");
        if (StringUtils.isBlank(outputFormat)) {
            outputFormat = "srt";
        }
        String script = FlowNodeDataUtils.getTemplateString(node, "script");
        if (StringUtils.isBlank(script)) {
            script = defaultScript;
        }

        // 解析为绝对路径
        File inputFile = resolveFile(filePath);
        if (!inputFile.exists()) {
            throw new IllegalArgumentException("视频/音频文件不存在: " + inputFile.getAbsolutePath());
        }

        // 校验模型文件
        File modelFile = resolveModelFile();
        if (!modelFile.exists()) {
            throw new IllegalArgumentException("Whisper 模型文件不存在: " + modelFile.getAbsolutePath()
                    + "，请下载 ggml-medium.bin 放到 service/models/ 目录");
        }

        log.info("[VideoAudioTranscriber] 开始转录: file={}, language={}, format={}, script={}, model={}",
                inputFile.getAbsolutePath(), language, outputFormat, script, modelFile.getName());

        try {
            // 步骤1：如果是视频，先抽取音频
            Path tempAudio = null;
            File audioFile;
            if (isAudioFile(inputFile.getName())) {
                audioFile = inputFile;
            } else {
                tempAudio = extractAudio(inputFile);
                audioFile = tempAudio.toFile();
            }

            // 步骤2：whisper 转录到 SRT 文件
            Path tempSrt = Files.createTempFile("whisper_", ".srt");
            tempSrt.toFile().deleteOnExit();

            runWhisperTranscribe(audioFile, modelFile, tempSrt.toFile(), language, outputFormat);

            // 步骤3：读取 SRT 内容
            String srtContent = normalizeScript(Files.readString(tempSrt, StandardCharsets.UTF_8), script);

            // 清理临时文件
            if (tempAudio != null) {
                try { Files.deleteIfExists(tempAudio); } catch (Exception ignored) {}
            }
            try { Files.deleteIfExists(tempSrt); } catch (Exception ignored) {}

            if (StringUtils.isBlank(srtContent)) {
                throw new IllegalStateException("转录结果为空，可能视频没有语音内容或模型加载失败");
            }

            // 步骤4：SRT → Markdown
            String markdown = convertSrtToMarkdown(srtContent, extractTitle(inputFile.getName()));

            context.setCurrentText(markdown);
            FlowNodeExecuteResult result = FlowNodeExecuteResult.of(markdown);
            result.getOutput().put("text", markdown);
            result.getOutput().put("srt", srtContent);
            result.getOutput().put("title", extractTitle(inputFile.getName()));
            result.getOutput().put("duration", extractDuration(srtContent));
            result.getOutput().put("format", outputFormat);
            result.getOutput().put("language", language);
            result.getOutput().put("script", normalizeScriptName(script));

            log.info("[VideoAudioTranscriber] 转录完成: markdownLength={}, srtLength={}",
                    markdown.length(), srtContent.length());
            return result;

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("视频音频转录失败: " + e.getMessage(), e);
        }
    }

    // ========== 核心处理方法 ==========

    /**
     * 从视频中抽取 16kHz 单声道 WAV 音频
     */
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
        log.info("[VideoAudioTranscriber] 音频抽取完成: {}", tempAudio);
        return tempAudio;
    }

    /**
     * 使用 FFmpeg whisper 滤镜转录音频文件
     *
     * Windows 路径中的冒号（如 C:）需在滤镜参数中转义为 \\:
     * 输出到文件（destination 参数）比 stdout 更可靠
     */
    private void runWhisperTranscribe(File audioFile, File modelFile, File srtOutputFile,
                                       String language, String format) {
        // 转义路径中的冒号（Windows 盘符 C: → C\:）
        String escapedModelPath = escapePathForFFmpegFilter(modelFile.getAbsolutePath());
        String escapedOutputPath = escapePathForFFmpegFilter(srtOutputFile.getAbsolutePath());

        String whisperFilter = String.format(
                "whisper=model=%s:language=%s:format=%s:destination=%s",
                escapedModelPath, language, format, escapedOutputPath
        );

        String[] cmd = {
                "ffmpeg", "-y",
                "-i", audioFile.getAbsolutePath(),
                "-af", whisperFilter,
                "-f", "null", "-"
        };

        runFFmpeg(cmd, "Whisper转录");
    }

    // ========== FFmpeg 执行器 ==========

    /**
     * 执行 FFmpeg 命令，工作目录设为 service 目录
     */
    private void runFFmpeg(String[] cmd, String stepName) {
        log.info("[VideoAudioTranscriber] {} 命令: {}", stepName, String.join(" ", cmd));

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(serviceDir);
        pb.redirectErrorStream(true);

        try {
            Process process = pb.start();

            // 按行读取输出，避免缓冲区满导致进程阻塞
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                    // whisper 转录进度日志，不重复打印
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

            log.info("[VideoAudioTranscriber] {} 完成", stepName);

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(stepName + " 执行异常: " + e.getMessage(), e);
        }
    }

    // ========== 路径工具 ==========

    /**
     * 为 FFmpeg 滤镜参数转义路径中的冒号
     * Windows 路径如 C:\path → C\:\path
     * FFmpeg 滤镜参数用冒号分隔，路径中的冒号需用反斜杠转义
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

    private String normalizeScript(String text, String script) {
        if (StringUtils.isBlank(text)) {
            return text;
        }
        String normalizedScript = normalizeScriptName(script);
        if ("simplified".equals(normalizedScript)) {
            return ZhConverterUtil.toSimple(text);
        }
        if ("traditional".equals(normalizedScript)) {
            return ZhConverterUtil.toTraditional(text);
        }
        return text;
    }

    private String normalizeScriptName(String script) {
        if (StringUtils.isBlank(script)) {
            return "none";
        }
        String normalized = script.trim().toLowerCase();
        if ("simplified".equals(normalized) || "simple".equals(normalized) || "zh-cn".equals(normalized) || "zh_hans".equals(normalized)) {
            return "simplified";
        }
        if ("traditional".equals(normalized) || "zh-tw".equals(normalized) || "zh_hant".equals(normalized)) {
            return "traditional";
        }
        return "none";
    }

    /**
     * 解析文件路径为绝对路径 File 对象
     */
    private File resolveFile(String filePath) {
        File file = new File(filePath);
        if (file.isAbsolute()) {
            return file;
        }
        return new File(serviceDir, filePath);
    }

    /**
     * 解析文件路径：优先取节点字段，其次取上下文变量
     */
    private String resolveFilePath(FlowNodeDTO node, FlowExecutionContext context) {
        String filePath = FlowNodeDataUtils.getTemplateString(node, "file_path");
        if (StringUtils.isBlank(filePath)) {
            Object var = context.getVariable("file_path");
            if (var != null) {
                filePath = String.valueOf(var);
            }
        }
        if (StringUtils.isBlank(filePath)) {
            throw new IllegalArgumentException("请提供视频/音频文件路径（file_path 为空）");
        }
        return filePath;
    }

    /**
     * 解析模型文件路径
     */
    private File resolveModelFile() {
        File file = new File(whisperModelPath);
        if (file.isAbsolute() && file.exists()) {
            return file;
        }
        return new File(serviceDir, whisperModelPath);
    }

    // ========== SRT → Markdown 转换 ==========

    /**
     * 将 SRT 字幕内容转为 Markdown 格式
     *
     * 按 30 秒一个段落自动分段，每段以时间戳小标题标记
     */
    private String convertSrtToMarkdown(String srtContent, String title) {
        StringBuilder md = new StringBuilder();
        md.append("# ").append(title).append("\n\n");

        String[] blocks = srtContent.trim().split("\n\\s*\n");
        StringBuilder paragraph = new StringBuilder();
        String lastTimestamp = null;

        for (String block : blocks) {
            String[] lines = block.trim().split("\n");
            if (lines.length < 3) continue;

            String timestampLine = lines[1];
            String timestamp = extractStartTime(timestampLine);
            String text = String.join(" ", java.util.Arrays.copyOfRange(lines, 2, lines.length)).trim();

            if (text.isEmpty()) continue;

            // 超过 5 秒间隔则分段
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

    private boolean isTimeGapOverSeconds(String time1, String time2, int thresholdSeconds) {
        long seconds1 = parseTimeToSeconds(time1);
        long seconds2 = parseTimeToSeconds(time2);
        return (seconds2 - seconds1) > thresholdSeconds;
    }

    private long parseTimeToSeconds(String timeStr) {
        try {
            String[] parts = timeStr.split(":");
            if (parts.length == 3) {
                return Long.parseLong(parts[0]) * 3600
                        + Long.parseLong(parts[1]) * 60
                        + Long.parseLong(parts[2]);
            }
        } catch (NumberFormatException ignored) {
        }
        return 0;
    }

    private String extractDuration(String srtContent) {
        Pattern pattern = Pattern.compile("-->\\s*(\\d{2}:\\d{2}:\\d{2})");
        Matcher matcher = pattern.matcher(srtContent);
        String lastTime = "00:00:00";
        while (matcher.find()) {
            lastTime = matcher.group(1);
        }
        return lastTime;
    }

    private boolean isAudioFile(String fileName) {
        String lower = fileName.toLowerCase();
        return lower.endsWith(".wav") || lower.endsWith(".mp3")
                || lower.endsWith(".flac") || lower.endsWith(".aac")
                || lower.endsWith(".ogg") || lower.endsWith(".m4a");
    }

    private String extractTitle(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot > 0 ? fileName.substring(0, dot) : fileName;
    }
}
