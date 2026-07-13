package com.ice.template.rag.storage;

import java.nio.file.Path;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StoredMediaFile {

    private String relativePath;

    private Path absolutePath;

    private long fileSize;
}
