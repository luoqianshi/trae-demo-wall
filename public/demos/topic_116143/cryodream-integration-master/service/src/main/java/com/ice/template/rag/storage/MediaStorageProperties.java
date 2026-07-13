package com.ice.template.rag.storage;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "knowledge.media-storage")
public class MediaStorageProperties {

    private String rootPath = "./data/knowledge-media";
}
