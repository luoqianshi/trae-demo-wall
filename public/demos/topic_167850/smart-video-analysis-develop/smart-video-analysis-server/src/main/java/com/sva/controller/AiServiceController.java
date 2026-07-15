package com.sva.controller;

import com.sva.client.ComfyUiClient;
import com.sva.client.RvcClient;
import com.sva.client.TtsClient;
import com.sva.common.result.R;
import com.sva.entity.AiServiceConfig;
import com.sva.service.AiServiceConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "AI 服务配置")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiServiceController {

    private final AiServiceConfigService aiServiceConfigService;
    private final ComfyUiClient comfyUiClient;
    private final TtsClient ttsClient;
    private final RvcClient rvcClient;

    @Operation(summary = "获取用户的所有 AI 服务配置")
    @GetMapping("/configs")
    public R<List<AiServiceConfig>> listConfigs(@RequestAttribute("userId") Long userId) {
        return R.ok(aiServiceConfigService.listByUser(userId));
    }

    @Operation(summary = "获取指定类型的 AI 服务配置")
    @GetMapping("/configs/{serviceType}")
    public R<AiServiceConfig> getConfig(@PathVariable String serviceType,
                                         @RequestAttribute("userId") Long userId) {
        AiServiceConfig config = aiServiceConfigService.getByUserAndType(userId, serviceType);
        return R.ok(config);
    }

    @Operation(summary = "保存或更新 AI 服务配置")
    @PostMapping("/configs")
    public R<AiServiceConfig> saveConfig(@RequestBody AiServiceConfig config,
                                          @RequestAttribute("userId") Long userId) {
        AiServiceConfig saved = aiServiceConfigService.saveOrUpdateConfig(userId, config);
        return R.ok(saved);
    }

    @Operation(summary = "删除 AI 服务配置")
    @DeleteMapping("/configs/{id}")
    public R<Void> deleteConfig(@PathVariable Long id,
                                 @RequestAttribute("userId") Long userId) {
        aiServiceConfigService.deleteConfig(id, userId);
        return R.ok();
    }

    @Operation(summary = "ComfyUI 连接测试（使用已保存配置）")
    @PostMapping("/comfyui/test")
    public R<Map<String, Object>> testComfyUi(@RequestAttribute("userId") Long userId) {
        AiServiceConfig config = aiServiceConfigService.getByUserAndType(userId, "COMFYUI");
        if (config == null) {
            // 回退到应用配置
            return R.ok(comfyUiClient.testConnection());
        }
        return R.ok(comfyUiClient.testConnectionWith(config.getEndpoint(), config.getApiKey()));
    }

    @Operation(summary = "ComfyUI 连接测试（动态参数）")
    @PostMapping("/comfyui/test-custom")
    public R<Map<String, Object>> testComfyUiCustom(@RequestBody Map<String, String> body) {
        String endpoint = body.get("endpoint");
        String apiKey = body.get("apiKey");
        Map<String, Object> result = comfyUiClient.testConnectionWith(endpoint, apiKey);
        return R.ok(result);
    }

    @Operation(summary = "TTS 连接测试（使用已保存配置）")
    @PostMapping("/tts/test")
    @PreAuthorize("hasRole('USER')")
    public R<Map<String, Object>> testTts(@RequestAttribute("userId") Long userId) {
        AiServiceConfig config = aiServiceConfigService.getByUserAndType(userId, "TTS");
        if (config == null) {
            Map<String, Object> result = new HashMap<>();
            result.put("connected", false);
            result.put("message", "未配置 TTS 服务");
            return R.ok(result);
        }
        return R.ok(ttsClient.testConnectionWith(config.getEndpoint(), config.getApiKey()));
    }

    @Operation(summary = "TTS 连接测试（动态参数）")
    @PostMapping("/tts/test-custom")
    @PreAuthorize("hasRole('USER')")
    public R<Map<String, Object>> testTtsCustom(@RequestBody Map<String, String> body) {
        String endpoint = body.get("endpoint");
        String apiKey = body.get("apiKey");
        Map<String, Object> result = ttsClient.testConnectionWith(endpoint, apiKey);
        return R.ok(result);
    }

    @Operation(summary = "RVC 连接测试（使用已保存配置）")
    @PostMapping("/rvc/test")
    @PreAuthorize("hasRole('USER')")
    public R<Map<String, Object>> testRvc(@RequestAttribute("userId") Long userId) {
        AiServiceConfig config = aiServiceConfigService.getByUserAndType(userId, "RVC");
        if (config == null) {
            Map<String, Object> result = new HashMap<>();
            result.put("connected", false);
            result.put("message", "未配置 RVC 服务");
            return R.ok(result);
        }
        return R.ok(rvcClient.testConnectionWith(config.getEndpoint(), config.getApiKey()));
    }

    @Operation(summary = "RVC 连接测试（动态参数）")
    @PostMapping("/rvc/test-custom")
    @PreAuthorize("hasRole('USER')")
    public R<Map<String, Object>> testRvcCustom(@RequestBody Map<String, String> body) {
        String endpoint = body.get("endpoint");
        String apiKey = body.get("apiKey");
        Map<String, Object> result = rvcClient.testConnectionWith(endpoint, apiKey);
        return R.ok(result);
    }
}
