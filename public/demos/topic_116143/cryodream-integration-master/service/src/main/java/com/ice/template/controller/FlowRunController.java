package com.ice.template.controller;

import com.ice.template.common.BaseResponse;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.flow.FlowRunRequest;
import com.ice.template.model.vo.flow.FlowRunResponse;
import com.ice.template.service.FlowRunService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import javax.annotation.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/flow")
@Api(tags = "工作流执行接口")
public class FlowRunController {

    private static final Logger log = LoggerFactory.getLogger(FlowRunController.class);

    @Resource
    private FlowRunService flowRunService;

    @PostMapping("/run")
    @ApiOperation("执行工作流")
    public BaseResponse<FlowRunResponse> runFlow(@RequestBody FlowRunRequest flowRunRequest) {
        if (flowRunRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        // 调试日志：打印前端发送的节点数据，重点查看 model_config_id 等字段
        if (flowRunRequest.getFlow() != null && flowRunRequest.getFlow().getNodes() != null) {
            flowRunRequest.getFlow().getNodes().forEach(node -> {
                Object dataType = node.getData() == null ? null : node.getData().get("type");
                if ("GlobalMetadataExtractor".equals(dataType) || "IntelligentSemanticChunker".equals(dataType)
                        || "LanguageModel".equals(dataType) || "Agent".equals(dataType)) {
                    log.info("[FlowRunController] 节点完整数据：nodeId={}, type={}, data={}",
                            node.getId(), dataType, node.getData());
                }
            });
        }
        return ResultUtils.success(flowRunService.runFlow(flowRunRequest));
    }
}
