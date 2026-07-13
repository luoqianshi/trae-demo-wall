package com.ice.template.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 工作流的输出插槽（Output Slot）。
 *
 * 一个工作流可以有多个输出插槽（例如 SCIL 动作迁移：姿势图 + 对比图 + 视频）。
 * 每个插槽对应 ComfyUI graphJson 里一个 SaveXxx 节点，运行结束后，
 * 后端会把该 SaveXxx 节点的输出文件归到这个 slot 下（key -> List&lt;filePath&gt;）。
 *
 * 前端 handleRun 拿到 outputsBySlot 后，按 slot 精确分派到画布上的下游节点，
 * 每个 slot 对应画布上一个输出节点（AssetNode），支持锁定/覆盖/新建。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OutputSlot implements Serializable {

    /**
     * 稳定唯一标识：优先使用 ComfyUI graph 里 SaveXxx 节点的 id（例如 "37"、"42"）。
     * 前端画布上，slot key 会作为 workflow 节点的 source handle id，用于精确匹配下游节点。
     */
    private String key;

    /** 可读标签：从 SaveXxx 的 _meta.title 提取；退化到 "图片输出 1" / "视频输出" 之类默认名 */
    private String label;

    /** 媒体类型：image | video | audio；前端根据这个字段决定用 <img> / <video> / <audio> 渲染 */
    private String mediaKind;

    /** ComfyUI graph 中对应 SaveXxx 节点 id（同 key，冗余存储便于后端定位） */
    private String comfyNodeId;

    private static final long serialVersionUID = 1L;
}
