package com.ice.template.model.dto.file;

import java.io.Serializable;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 文件上传请求
 *
 *
 */
@Data
@ApiModel("文件上传请求")
public class UploadFileRequest implements Serializable {

    @ApiModelProperty("业务类型")
    private String biz;

    private static final long serialVersionUID = 1L;
}