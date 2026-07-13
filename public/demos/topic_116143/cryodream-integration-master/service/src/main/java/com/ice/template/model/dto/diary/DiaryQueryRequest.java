package com.ice.template.model.dto.diary;

import com.ice.template.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class DiaryQueryRequest extends PageRequest {
    private String searchText;
    private String category;
    private String mood;
    private String startDate;
    private String endDate;
}
