package com.ice.template.integration.comfyui;

import cn.hutool.core.io.FileUtil;
import cn.hutool.json.JSONUtil;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 验证 qwen 图片编辑（subgraph 封装）工作流的 schema 提取与 API 展开。
 */
public class ComfyUIWorkflowConverterTest {

    private static final String WORKFLOW_PATH = "F:/ComfyUI-aki-XZG/ComfyUI-aki-XZG/ComfyUI/user/default/workflows/00-应用案例/qwen图片编辑（支持3图）.json";

    @Test
    public void testSchemaContainsSubgraphInputs() {
        java.io.File f = new java.io.File(WORKFLOW_PATH);
        if (!f.exists()) {
            return;
        }
        String graph = FileUtil.readUtf8String(f);
        String schema = ComfyUIWorkflowConverter.extractParamSchema(graph);
        System.out.println("=== SCHEMA ===");
        System.out.println(schema);
        assertNotNull(schema);
        // 应包含 subgraph 节点 115 的 prompt 参数
        assertTrue(schema.contains("\"paramName\":\"prompt\""), "schema 应包含 subgraph 的 prompt 输入");
        // 应包含 image 类型
        assertTrue(schema.contains("\"type\":\"image\""), "schema 应包含 image 类型参数");
    }

    @Test
    public void testApiFormatExpandsSubgraph() {
        java.io.File f = new java.io.File(WORKFLOW_PATH);
        if (!f.exists()) {
            return;
        }
        String graph = FileUtil.readUtf8String(f);
        Map<String, Object> values = new HashMap<>();
        values.put("115.prompt", "make her smile");
        values.put("115.image", "img1.png");
        values.put("115.image2", "img2.png");
        values.put("115.image3", "img3.png");
        values.put("78.image", "img1.png");
        String api = ComfyUIWorkflowConverter.toApiFormat(graph, values);
        System.out.println("=== API (3 images) ===");
        System.out.println(api);
        assertNotNull(api);
        assertTrue(api.contains("KSampler"), "展开后应有 KSampler");
        assertTrue(api.contains("VAEDecode"), "展开后应有 VAEDecode");
        assertTrue(api.contains("sg115_"), "展开后应有前缀 sg115_");
        assertTrue(api.contains("SaveImage"), "应保留 SaveImage");
        assertTrue(api.contains("sg115_vload_image2"), "image2 应合成虚拟 LoadImage");
        assertTrue(api.contains("sg115_vload_image3"), "image3 应合成虚拟 LoadImage");
        // 任意指向不存在节点的 input 都应已被清理
        assertTrue(!api.contains("[\"120\""), "不应残留指向 120 的引用");
        assertTrue(!api.contains("[\"121\""), "不应残留指向 121 的引用");
        Object parsed = JSONUtil.parse(api);
        assertNotNull(parsed);
    }
}
