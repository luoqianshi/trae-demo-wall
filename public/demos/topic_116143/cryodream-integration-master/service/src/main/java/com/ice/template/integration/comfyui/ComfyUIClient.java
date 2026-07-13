package com.ice.template.integration.comfyui;

import cn.hutool.core.io.FileUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.config.ComfyUIConfig;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

/**
 * ComfyUI 执行客户端：提交 prompt → WebSocket 实时进度 → 下载生成图片到本地输出目录。
 */
@Component
public class ComfyUIClient {

    private static final Logger log = LoggerFactory.getLogger(ComfyUIClient.class);

    @Resource
    private ComfyUIConfig comfyUIConfig;

    /**
     * 执行一个 API 格式的 prompt，通过 WebSocket 监听真实进度。
     *
     * @param apiPromptJson    API 格式 prompt
     * @param progressConsumer 进度回调（value/max/status），可为 null
     * @return 本地可访问的图片文件名列表
     */
    public List<String> execute(String apiPromptJson, Consumer<ComfyUIProgress> progressConsumer, String projectDir) {
        return executeDetailed(apiPromptJson, progressConsumer, projectDir).getOutputs();
    }

    /**
     * 结构化执行结果版本：额外返回 outputsBySlot（按 SaveXxx 节点 id 分组的文件列表），
     * 供前端精确按 outputSlots 分派到画布上多个输出节点。
     * 老调用方仍可使用 {@link #execute(String, Consumer, String)} 拿扁平列表。
     */
    public ComfyExecutionResult executeDetailed(String apiPromptJson, Consumer<ComfyUIProgress> progressConsumer, String projectDir) {
        String baseUrl = StringUtils.removeEnd(comfyUIConfig.getBaseUrl(), "/");
        String clientId = "trae-" + UUID.randomUUID();

        WebSocket ws = null;
        AtomicBoolean finished = new AtomicBoolean(false);
        try {
            ws = openProgressSocket(baseUrl, clientId, progressConsumer, finished);

            JSONObject body = new JSONObject();
            body.set("prompt", JSONUtil.parseObj(apiPromptJson));
            body.set("client_id", clientId);

            HttpResponse submitResp = HttpRequest.post(baseUrl + "/prompt")
                    .header("Content-Type", "application/json")
                    .body(body.toString())
                    .timeout(30000)
                    .execute();
            if (submitResp.getStatus() != 200) {
                throw new RuntimeException("ComfyUI 提交失败(" + submitResp.getStatus() + "): " + submitResp.body());
            }
            JSONObject submitObj = JSONUtil.parseObj(submitResp.body());
            String promptId = submitObj.getStr("prompt_id");
            log.info("[ComfyUIClient] 已提交 promptId={}", promptId);
            log.debug("[ComfyUIClient] 提交 prompt 内容: {}", body);

            JSONObject outputs = waitForCompletion(baseUrl, promptId, finished);
            if (outputs == null) {
                throw new RuntimeException("ComfyUI 执行超时");
            }
            return downloadOutputsDetailed(baseUrl, outputs, projectDir);
        } finally {
            if (ws != null) {
                try {
                    ws.sendClose(WebSocket.NORMAL_CLOSURE, "done");
                } catch (Exception ignored) {
                    // ignore
                }
            }
        }
    }

    private WebSocket openProgressSocket(String baseUrl, String clientId,
                                         Consumer<ComfyUIProgress> progressConsumer,
                                         AtomicBoolean finished) {
        try {
            String wsUrl = baseUrl.replaceFirst("^http", "ws") + "/ws?clientId=" + clientId;
            HttpClient client = HttpClient.newHttpClient();
            return client.newWebSocketBuilder()
                    .buildAsync(URI.create(wsUrl), new WebSocket.Listener() {
                        private final StringBuilder buffer = new StringBuilder();

                        @Override
                        public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
                            buffer.append(data);
                            if (last) {
                                handleMessage(buffer.toString(), progressConsumer, finished);
                                buffer.setLength(0);
                            }
                            webSocket.request(1);
                            return null;
                        }
                    })
                    .join();
        } catch (Exception e) {
            log.warn("[ComfyUIClient] WebSocket 连接失败，将仅用轮询: {}", e.getMessage());
            return null;
        }
    }

    private void handleMessage(String text, Consumer<ComfyUIProgress> progressConsumer, AtomicBoolean finished) {
        try {
            JSONObject msg = JSONUtil.parseObj(text);
            String type = msg.getStr("type");
            JSONObject data = msg.getJSONObject("data");
            if ("progress".equals(type) && data != null && progressConsumer != null) {
                ComfyUIProgress p = new ComfyUIProgress();
                p.setStatus("running");
                p.setValue(data.getInt("value", 0));
                p.setMax(data.getInt("max", 0));
                p.setMessage("正在生成");
                progressConsumer.accept(p);
            } else if ("executing".equals(type) && data != null) {
                if (data.get("node") == null && data.getStr("prompt_id") != null) {
                    finished.set(true);
                }
            }
        } catch (Exception e) {
            log.debug("[ComfyUIClient] 解析 WS 消息失败: {}", e.getMessage());
        }
    }

    private JSONObject waitForCompletion(String baseUrl, String promptId, AtomicBoolean finished) {
        long deadline = System.currentTimeMillis() + comfyUIConfig.getTimeoutSeconds() * 1000L;
        while (System.currentTimeMillis() < deadline) {
            sleep(1500);
            String histBody = HttpUtil.get(baseUrl + "/history/" + promptId, 15000);
            if (StringUtils.isNotBlank(histBody)) {
                JSONObject hist = JSONUtil.parseObj(histBody);
                JSONObject entry = hist.getJSONObject(promptId);
                if (entry != null) {
                    JSONObject status = entry.getJSONObject("status");
                    if (status != null) {
                        if (status.getBool("completed", false)) {
                            return entry.getJSONObject("outputs");
                        }
                        if ("error".equals(status.getStr("status_str"))) {
                            throw new RuntimeException("ComfyUI 执行错误: " + status);
                        }
                    }
                }
            }
        }
        return null;
    }

    private List<String> downloadOutputs(String baseUrl, JSONObject outputs, String projectDir) {
        return downloadOutputsDetailed(baseUrl, outputs, projectDir).getOutputs();
    }

    /**
     * 下载 ComfyUI 输出，同时按节点 id 分组，供多输出插槽（outputSlots）使用。
     */
    private ComfyExecutionResult downloadOutputsDetailed(String baseUrl, JSONObject outputs, String projectDir) {
        ComfyExecutionResult result = new ComfyExecutionResult();
        File baseDir = Paths.get(comfyUIConfig.getOutputDir()).toAbsolutePath().normalize().toFile();
        // 按 projectDir 子目录存放
        File outDir = StringUtils.isBlank(projectDir) ? baseDir : new File(baseDir, sanitizeDirName(projectDir));
        // 使用 NIO 递归创建目录（比 File.mkdirs 语义更清晰，遇到已存在目录不会失败）
        try {
            Files.createDirectories(outDir.toPath());
        } catch (IOException e) {
            log.error("[ComfyUIClient] 创建输出目录失败: {}", outDir.getAbsolutePath(), e);
            throw new RuntimeException(
                    "无法创建项目输出目录: " + outDir.getAbsolutePath()
                            + "。原因: " + e.getClass().getSimpleName() + ": " + e.getMessage(), e);
        }
        if (!outDir.exists() || !outDir.isDirectory()) {
            throw new RuntimeException(
                    "输出目录创建后仍不可用（可能被同名文件占用）: " + outDir.getAbsolutePath());
        }
        log.info("[ComfyUIClient] 输出目录: {}", outDir.getAbsolutePath());

        List<String> nodeIds = new ArrayList<>(outputs.keySet());
        nodeIds.sort(Comparator.comparingInt(this::parseNodeId));
        for (String nodeId : nodeIds) {
            JSONObject nodeOut = outputs.getJSONObject(nodeId);
            // 该节点收集到的文件（本节点即 slot key）
            List<String> perSlot = new ArrayList<>();
            collectOutputItems(baseUrl, outDir, perSlot, nodeOut.getJSONArray("images"), "图片", projectDir);
            collectOutputItems(baseUrl, outDir, perSlot, nodeOut.getJSONArray("gifs"), "视频", projectDir);
            collectOutputItems(baseUrl, outDir, perSlot, nodeOut.getJSONArray("videos"), "视频", projectDir);
            collectOutputItems(baseUrl, outDir, perSlot, nodeOut.getJSONArray("audio"), "音频", projectDir);
            if (!perSlot.isEmpty()) {
                result.getOutputs().addAll(perSlot);
                // slot key 与前端 outputSlots.key 保持一致（都是 ComfyUI 节点 id 字符串）
                result.getOutputsBySlot().put(nodeId, perSlot);
            }
        }
        return result;
    }

    private int parseNodeId(String nodeId) {
        try {
            return Integer.parseInt(nodeId);
        } catch (Exception e) {
            return Integer.MAX_VALUE;
        }
    }

    private void collectOutputItems(String baseUrl, File outDir, List<String> savedFiles, JSONArray items, String label, String projectDir) {
        if (items == null) {
            return;
        }
        for (int i = 0; i < items.size(); i++) {
            JSONObject item = items.getJSONObject(i);
            String filename = item.getStr("filename");
            if (StringUtils.isBlank(filename)) {
                continue;
            }
            String subfolder = StringUtils.defaultString(item.getStr("subfolder"), "");
            String type = StringUtils.defaultString(item.getStr("type"), "output");
            if ("temp".equalsIgnoreCase(type)) {
                continue;
            }
            String viewUrl = baseUrl + "/view?filename=" + HttpUtil.encodeParams(filename, java.nio.charset.StandardCharsets.UTF_8)
                    + "&subfolder=" + HttpUtil.encodeParams(subfolder, java.nio.charset.StandardCharsets.UTF_8)
                    + "&type=" + type;
            String localName = UUID.randomUUID() + "-" + filename;
            File target = new File(outDir, localName);
            HttpUtil.downloadFile(viewUrl, target);
            // 返回相对于 outputDir 的路径，含项目子目录
            String relativePath = StringUtils.isBlank(projectDir) ? localName : sanitizeDirName(projectDir) + "/" + localName;
            savedFiles.add(relativePath);
            log.info("[ComfyUIClient] 已保存{} {}", label, localName);
        }
    }

    /** 将项目名称转为安全的目录名：去掉特殊字符，空格转下划线 */
    private String sanitizeDirName(String name) {
        if (StringUtils.isBlank(name)) return "unnamed";
        return name.trim().replaceAll("[\\\\/:*?\"<>|]", "_").replaceAll("\\s+", "_");
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * 上传图片到 ComfyUI 服务的 input 目录。
     *
     * @param bytes    图片字节
     * @param filename 原始文件名（用于扩展名识别）
     * @return ComfyUI 返回的 {name, subfolder, type} JSON
     */
    /**
     * 将画布项目目录里的素材文件同步到 ComfyUI 服务端的 input 目录（供 LoadImage 节点使用）。
     * 查找顺序：<outputDir>/<projectId>/<filename> → <inputCacheDir>/<filename>（兼容老数据）
     */
    public JSONObject uploadCachedInputFile(String filename, String projectId) {
        if (StringUtils.isBlank(filename)) {
            return null;
        }
        File cacheFile = null;
        // 优先从画布项目目录读
        if (StringUtils.isNotBlank(projectId) && StringUtils.isNotBlank(comfyUIConfig.getOutputDir())) {
            String dirName = projectId.trim().replaceAll("[\\\\/:*?\"<>|]", "_").replaceAll("\\s+", "_");
            File candidate = Paths.get(comfyUIConfig.getOutputDir()).toAbsolutePath().normalize()
                    .resolve(dirName).resolve(filename).toFile();
            if (candidate.exists() && candidate.isFile()) {
                cacheFile = candidate;
            }
        }
        // 兜底：老数据仍在 input 缓存目录
        if (cacheFile == null && StringUtils.isNotBlank(comfyUIConfig.getInputCacheDir())) {
            File candidate = Paths.get(comfyUIConfig.getInputCacheDir()).toAbsolutePath().normalize()
                    .resolve(filename).toFile();
            if (candidate.exists() && candidate.isFile()) {
                cacheFile = candidate;
            }
        }
        if (cacheFile == null) {
            log.warn("[ComfyUIClient] 找不到待同步的输入文件: {} (projectId={})", filename, projectId);
            return null;
        }
        String baseUrl = StringUtils.removeEnd(comfyUIConfig.getBaseUrl(), "/");
        HttpResponse resp = HttpRequest.post(baseUrl + "/upload/image")
                .form("image", cacheFile)
                .form("overwrite", "true")
                .timeout(60000)
                .execute();
        if (resp.getStatus() != 200) {
            throw new RuntimeException("同步输入文件到 ComfyUI 失败(" + resp.getStatus() + "): " + resp.body());
        }
        return JSONUtil.parseObj(resp.body());
    }

    /** 兼容旧调用签名 */
    public JSONObject uploadCachedInputFile(String filename) {
        return uploadCachedInputFile(filename, null);
    }

    public JSONObject uploadImage(byte[] bytes, String filename) {
        return uploadInputFile(bytes, filename, "upload.png", "/upload/image", "image", "ComfyUI 上传图片失败");
    }

    public JSONObject uploadVideo(byte[] bytes, String filename) {
        return uploadInputFile(bytes, filename, "upload.mp4", "/upload/image", "image", "ComfyUI 上传视频失败");
    }

    private JSONObject uploadInputFile(byte[] bytes, String filename, String fallbackName, String endpoint, String formField, String errorPrefix) {
        String baseUrl = StringUtils.removeEnd(comfyUIConfig.getBaseUrl(), "/");
        String safeName = StringUtils.isBlank(filename) ? fallbackName : filename;
        java.io.File tmp = null;
        try {
            String suffix = ".bin";
            int dot = safeName.lastIndexOf('.');
            if (dot >= 0 && dot < safeName.length() - 1) {
                suffix = safeName.substring(dot);
            }
            tmp = java.io.File.createTempFile("comfy-upload-", suffix);
            FileUtil.writeBytes(bytes, tmp);
            HttpResponse resp = HttpRequest.post(baseUrl + endpoint)
                    .form(formField, tmp)
                    .form("overwrite", "true")
                    .timeout(60000)
                    .execute();
            if (resp.getStatus() != 200) {
                throw new RuntimeException(errorPrefix + "(" + resp.getStatus() + "): " + resp.body());
            }
            return JSONUtil.parseObj(resp.body());
        } catch (java.io.IOException e) {
            throw new RuntimeException("写入临时文件失败: " + e.getMessage(), e);
        } finally {
            if (tmp != null) {
                FileUtil.del(tmp);
            }
        }
    }
}
