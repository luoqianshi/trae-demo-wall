package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.ResultUtils;
import com.ice.template.model.entity.ThinkingModel;
import com.ice.template.rag.ThinkingModelService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/thinking-model")
public class ThinkingModelController {

    @Resource
    private ThinkingModelService thinkingModelService;

    @PostMapping("/extract")
    public BaseResponse<ThinkingModel> extractAndSave(@RequestBody Map<String, String> body) {
        String rawText = body.get("rawText");
        String modelConfigId = body.get("modelConfigId");
        String kbId = body.get("kbId");
        ThinkingModel model = thinkingModelService.extractAndSave(rawText, modelConfigId, kbId);
        return ResultUtils.success(model);
    }

    /**
     * 仅提取思维模型，不落库。用于前端预览确认。
     * 返回提取的 JSON 和判断结果（是否包含思维模型）。
     */
    @PostMapping("/extract-only")
    public BaseResponse<Map<String, Object>> extractOnly(@RequestBody Map<String, String> body) {
        String documentId = body.get("documentId");
        String rawText = body.get("rawText");
        String modelConfigId = body.get("modelConfigId");
        Map<String, Object> result = thinkingModelService.extractOnly(documentId, rawText, modelConfigId);
        return ResultUtils.success(result);
    }

    /**
     * 确认保存思维模型。前端预览确认后调用。
     */
    @PostMapping("/confirm-save")
    public BaseResponse<ThinkingModel> confirmSave(@RequestBody Map<String, Object> body) {
        String extractId = (String) body.get("extractId");
        ThinkingModel saved = thinkingModelService.confirmSave(extractId);
        return ResultUtils.success(saved);
    }

    @GetMapping("/list")
    public BaseResponse<List<ThinkingModel>> list() {
        return ResultUtils.success(thinkingModelService.list());
    }

    @GetMapping("/list/active")
    public BaseResponse<List<ThinkingModel>> listActive() {
        return ResultUtils.success(thinkingModelService.listActive());
    }

    @GetMapping("/list/by-kb")
    public BaseResponse<List<ThinkingModel>> listByKbId(@RequestParam String kbId) {
        return ResultUtils.success(thinkingModelService.listByKbId(kbId));
    }

    @GetMapping("/get")
    public BaseResponse<ThinkingModel> getById(@RequestParam String id) {
        return ResultUtils.success(thinkingModelService.getById(id));
    }

    @PostMapping("/toggle")
    public BaseResponse<Boolean> toggleActive(@RequestBody Map<String, Object> body) {
        String id = (String) body.get("id");
        Boolean active = (Boolean) body.get("isActive");
        thinkingModelService.updateIsActive(id, active != null && active);
        return ResultUtils.success(true);
    }

    @PostMapping("/delete")
    public BaseResponse<Boolean> delete(@RequestBody Map<String, String> body) {
        thinkingModelService.deleteById(body.get("id"));
        return ResultUtils.success(true);
    }
}
