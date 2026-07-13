package com.ice.template.integration.comfyui;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ComfyUI 工作流执行结果。
 * <p>
 * 保留 outputs（扁平列表，兼容老代码），同时新增 outputsBySlot（按 SaveXxx 节点 id 分组），
 * 让前端可以按 outputSlots 精确分派到画布上的多个下游输出节点。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComfyExecutionResult implements Serializable {

    /** 扁平文件路径列表：相对于 outputDir，含项目子目录（例如 "abc123/uuid-name.png"） */
    private List<String> outputs = new ArrayList<>();

    /**
     * 按 ComfyUI 节点 id 分组的输出：{ "37": ["abc/xxx.png"], "42": ["abc/yyy.mp4"] }。
     * key 与前端 outputSlots.key 保持一致（都是 ComfyUI graph 里 SaveXxx 节点的 id）。
     * 使用 LinkedHashMap 保留节点顺序，便于前端稳定分派。
     */
    private Map<String, List<String>> outputsBySlot = new LinkedHashMap<>();

    private static final long serialVersionUID = 1L;
}
