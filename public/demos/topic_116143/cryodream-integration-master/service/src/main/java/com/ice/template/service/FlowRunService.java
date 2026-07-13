package com.ice.template.service;

import com.ice.template.model.dto.flow.FlowRunRequest;
import com.ice.template.model.vo.flow.FlowRunResponse;

public interface FlowRunService {

    FlowRunResponse runFlow(FlowRunRequest flowRunRequest);
}
