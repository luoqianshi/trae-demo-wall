package com.ice.template.model.dto.knowledgechunk;

import com.ice.template.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ChunkQueryRequest extends PageRequest {

    private String id;

    private String docId;

    private String kbId;

    private String chunkLevel;

    private String searchText;
}
