package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.service.DiaryTranscribeService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import javax.annotation.Resource;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/diary")
@Api(tags = "日记语音转写接口")
public class DiaryTranscribeController {

    @Resource
    private DiaryTranscribeService diaryTranscribeService;

    @Value("${diary.audio.dir:./data/diary-audio}")
    private String audioDir;

    @PostMapping("/transcribe")
    @ApiOperation("语音转文字")
    public BaseResponse<java.util.Map<String, Object>> transcribe(@RequestParam("file") MultipartFile file) {
        String[] result = diaryTranscribeService.transcribe(file);
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("audioUrl", result[0]);
        data.put("plainText", result[1]);
        data.put("durationSec", Integer.parseInt(result[2]));
        return ResultUtils.success(data);
    }

    @GetMapping("/audio/{dateStr}/{fileName}")
    @ApiOperation("获取录音文件")
    public void getAudio(@PathVariable String dateStr,
                         @PathVariable String fileName,
                         HttpServletResponse response) {
        try {
            Path audioPath = Paths.get(audioDir, dateStr, fileName).toAbsolutePath().normalize();
            File audioFile = audioPath.toFile();
            if (!audioFile.exists()) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                return;
            }
            // 防止路径穿越
            Path rootPath = Paths.get(audioDir).toAbsolutePath().normalize();
            if (!audioPath.startsWith(rootPath)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                return;
            }
            String contentType = Files.probeContentType(audioPath);
            if (contentType == null) {
                contentType = "audio/wav";
            }
            response.setContentType(contentType);
            response.setContentLengthLong(audioFile.length());
            Files.copy(audioPath, response.getOutputStream());
        } catch (IOException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
