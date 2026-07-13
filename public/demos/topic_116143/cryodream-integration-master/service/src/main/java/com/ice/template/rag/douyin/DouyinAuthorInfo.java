package com.ice.template.rag.douyin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DouyinAuthorInfo {

    private String uid;

    private String secUid;

    private String nickname;

    private String uniqueId;

    private String shortId;

    private String signature;

    private String avatarUrl;
}
