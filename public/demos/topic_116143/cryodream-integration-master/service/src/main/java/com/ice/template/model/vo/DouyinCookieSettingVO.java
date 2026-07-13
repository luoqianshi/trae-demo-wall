package com.ice.template.model.vo;

import java.io.Serializable;
import java.util.Date;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DouyinCookieSettingVO implements Serializable {

    private Boolean configured;

    private String maskedCookie;

    private Integer cookieCount;

    private Date updateTime;

    private static final long serialVersionUID = 1L;
}
