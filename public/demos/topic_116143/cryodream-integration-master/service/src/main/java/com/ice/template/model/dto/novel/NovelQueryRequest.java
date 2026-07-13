package com.ice.template.model.dto.novel;

import com.ice.template.common.PageRequest;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class NovelQueryRequest extends PageRequest implements Serializable {

    private String searchText;
    private String status;
    private String genre;

    private static final long serialVersionUID = 1L;
}
