package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.ResultUtils;
import com.ice.template.model.dto.novel.NovelAiRequest;
import com.ice.template.service.NovelAiService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import java.util.List;
import javax.annotation.Resource;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/novel/ai")
@Api(tags = "小说 AI 辅助接口")
public class NovelAiController {

    @Resource
    private NovelAiService novelAiService;

    @PostMapping("/continue")
    @ApiOperation("AI 续写")
    public BaseResponse<String> continueWriting(@RequestBody NovelAiRequest request) {
        return ResultUtils.success(novelAiService.continueWriting(request));
    }

    @PostMapping("/polish")
    @ApiOperation("AI 润色（多候选）")
    public BaseResponse<List<String>> polish(@RequestBody NovelAiRequest request) {
        return ResultUtils.success(novelAiService.polish(request));
    }

    @PostMapping("/consistency")
    @ApiOperation("人物一致性检查")
    public BaseResponse<String> consistency(@RequestBody NovelAiRequest request) {
        return ResultUtils.success(novelAiService.consistencyCheck(request));
    }

    @PostMapping("/summarize")
    @ApiOperation("AI 生成本节概要")
    public BaseResponse<String> summarize(@RequestBody NovelAiRequest request) {
        return ResultUtils.success(novelAiService.summarize(request));
    }
}
