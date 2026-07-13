package com.ice.template.model.dto.knowledge;

import com.ice.template.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class DocumentQueryRequest extends PageRequest {

    private String id;

    private String kbId;

    private String searchText;

    private String title;

    private String status;

    private String fileType;
}
