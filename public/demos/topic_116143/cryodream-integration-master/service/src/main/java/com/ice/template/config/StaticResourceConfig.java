package com.ice.template.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;
import org.springframework.web.servlet.resource.ResourceResolverChain;

import javax.servlet.http.HttpServletRequest;
import java.nio.file.Paths;
import java.util.List;

/**
 * 静态资源映射：把 ComfyUI 生成图片的输出目录暴露为可访问 URL。
 * 访问路径：/api/comfyui-output/{filename}
 * 支持子目录路径（新数据）和扁平路径（旧数据兼容）
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Autowired
    private ComfyUIConfig comfyUIConfig;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String outputDir = comfyUIConfig.getOutputDir();
        String absolute = Paths.get(outputDir).toAbsolutePath().normalize().toString();
        String location = "file:" + absolute.replace("\\", "/");
        if (!location.endsWith("/")) {
            location = location + "/";
        }
        registry.addResourceHandler("/comfyui-output/**")
                .addResourceLocations(location)
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    public Resource resolveResource(HttpServletRequest request, String requestPath,
                                                     List<? extends Resource> locations, ResourceResolverChain chain) {
                        // 先按正常路径查找（支持子目录如 projectId/xxx.png）
                        Resource resource = super.resolveResource(request, requestPath, locations, chain);
                        if (resource != null && resource.exists()) {
                            return resource;
                        }
                        // 回退：如果路径含子目录（含 /），尝试扁平路径（兼容旧数据）
                        int slashIdx = requestPath.indexOf('/');
                        if (slashIdx > 0) {
                            String flatPath = requestPath.substring(slashIdx + 1);
                            return super.resolveResource(request, flatPath, locations, chain);
                        }
                        return null;
                    }
                });
    }
}
