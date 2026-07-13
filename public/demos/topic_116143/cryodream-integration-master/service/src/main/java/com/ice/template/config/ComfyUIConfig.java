package com.ice.template.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * ComfyUI 集成配置
 */
@Configuration
@ConfigurationProperties(prefix = "comfyui")
@Data
public class ComfyUIConfig {

    /** ComfyUI 服务地址 */
    private String baseUrl = "http://127.0.0.1:8188";

    /** 本地工作流根目录 */
    private String workflowDir;

    /** ComfyUI input 目录，用于上传输入文件回显 */
    private String inputDir;

    private String inputCacheDir = "./uploads/comfyui-input";

    /** 生成图片/视频的输出目录（相对项目运行目录） */
    private String outputDir = "./uploads/comfyui";

    /** 执行轮询超时（秒） */
    private int timeoutSeconds = 1200;
}
