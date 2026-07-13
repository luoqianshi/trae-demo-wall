package com.ice.template.rag.douyin;

import com.ice.template.rag.storage.StoredMediaFile;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DouyinDownloadResult {

    private String input;

    private String sourceUrl;

    private DouyinVideoInfo videoInfo;

    private StoredMediaFile mediaFile;
}
