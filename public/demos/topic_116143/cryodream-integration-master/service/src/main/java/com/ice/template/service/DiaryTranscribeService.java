package com.ice.template.service;

import org.springframework.web.multipart.MultipartFile;

public interface DiaryTranscribeService {

    /**
     * 语音转文字
     * @param audioFile 录音文件
     * @return [0]=audioUrl, [1]=plainText, [2]=durationSec
     */
    String[] transcribe(MultipartFile audioFile);
}
