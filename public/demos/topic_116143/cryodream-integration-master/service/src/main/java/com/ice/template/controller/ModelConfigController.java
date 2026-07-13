package com.ice.template.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.model.dto.modelconfig.ModelConfigAddRequest;
import com.ice.template.model.dto.modelconfig.ModelConfigQueryRequest;
import com.ice.template.model.dto.modelconfig.ModelConfigTestRequest;
import com.ice.template.model.dto.modelconfig.ModelConfigUpdateRequest;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.model.vo.ModelConfigVO;
import com.ice.template.service.ModelConfigService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import java.util.List;
import javax.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 模型配置接口
 */
@RestController
@RequestMapping("/modelConfig")
@Api(tags = "模型配置接口")
public class ModelConfigController {

    @Resource
    private ModelConfigService modelConfigService;

    /**
     * 新增模型配置
     */
    @PostMapping("/add")
    @ApiOperation("新增模型配置")
    public BaseResponse<String> addModelConfig(@RequestBody ModelConfigAddRequest modelConfigAddRequest) {
        if (modelConfigAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        ModelConfig modelConfig = new ModelConfig();
        BeanUtils.copyProperties(modelConfigAddRequest, modelConfig);
        modelConfig.setEnabled(Boolean.TRUE.equals(modelConfigAddRequest.getEnabled()) ? 1 : 0);
        if (modelConfig.getTemperature() == null) {
            modelConfig.setTemperature(0.1);
        }
        if (modelConfig.getMaxTokens() == null) {
            modelConfig.setMaxTokens(1000);
        }
        modelConfigService.validModelConfig(modelConfig, true);
        boolean result = modelConfigService.save(modelConfig);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(modelConfig.getId());
    }

    /**
     * 删除模型配置
     */
    @PostMapping("/delete")
    @ApiOperation("删除模型配置")
    public BaseResponse<Boolean> deleteModelConfig(@RequestBody DeleteRequest deleteRequest) {
        if (deleteRequest == null || StringUtils.isBlank(deleteRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        ModelConfig oldModelConfig = modelConfigService.getById(deleteRequest.getId());
        ThrowUtils.throwIf(oldModelConfig == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = modelConfigService.removeById(deleteRequest.getId());
        return ResultUtils.success(result);
    }

    /**
     * 更新模型配置
     */
    @PostMapping("/update")
    @ApiOperation("更新模型配置")
    public BaseResponse<Boolean> updateModelConfig(@RequestBody ModelConfigUpdateRequest modelConfigUpdateRequest) {
        if (modelConfigUpdateRequest == null || StringUtils.isBlank(modelConfigUpdateRequest.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        ModelConfig oldModelConfig = modelConfigService.getById(modelConfigUpdateRequest.getId());
        ThrowUtils.throwIf(oldModelConfig == null, ErrorCode.NOT_FOUND_ERROR);
        ModelConfig modelConfig = new ModelConfig();
        BeanUtils.copyProperties(modelConfigUpdateRequest, modelConfig);
        if (modelConfigUpdateRequest.getEnabled() != null) {
            modelConfig.setEnabled(Boolean.TRUE.equals(modelConfigUpdateRequest.getEnabled()) ? 1 : 0);
        }
        modelConfigService.validModelConfig(modelConfig, false);
        boolean result = modelConfigService.updateById(modelConfig);
        return ResultUtils.success(result);
    }

    /**
     * 根据 id 查询模型配置
     */
    @GetMapping("/get")
    @ApiOperation("根据 id 查询模型配置")
    public BaseResponse<ModelConfigVO> getModelConfigById(String id) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        ModelConfig modelConfig = modelConfigService.getById(id);
        ThrowUtils.throwIf(modelConfig == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(modelConfigService.getModelConfigVO(modelConfig));
    }

    /**
     * 分页查询模型配置
     */
    @PostMapping("/list/page")
    @ApiOperation("分页查询模型配置")
    public BaseResponse<Page<ModelConfigVO>> listModelConfigByPage(@RequestBody ModelConfigQueryRequest modelConfigQueryRequest) {
        if (modelConfigQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = modelConfigQueryRequest.getCurrent();
        long size = modelConfigQueryRequest.getPageSize();
        Page<ModelConfig> modelConfigPage = modelConfigService.page(new Page<>(current, size), modelConfigService.getQueryWrapper(modelConfigQueryRequest));
        Page<ModelConfigVO> modelConfigVOPage = new Page<>(current, size, modelConfigPage.getTotal());
        modelConfigVOPage.setRecords(modelConfigService.getModelConfigVOList(modelConfigPage.getRecords()));
        return ResultUtils.success(modelConfigVOPage);
    }

    /**
     * 查询启用模型配置
     */
    @GetMapping("/list/enabled")
    @ApiOperation("查询启用模型配置")
    public BaseResponse<List<ModelConfigVO>> listEnabledModelConfig() {
        ModelConfigQueryRequest queryRequest = new ModelConfigQueryRequest();
        queryRequest.setEnabled(true);
        List<ModelConfig> modelConfigList = modelConfigService.list(modelConfigService.getQueryWrapper(queryRequest));
        return ResultUtils.success(modelConfigService.getModelConfigVOList(modelConfigList));
    }

    /**
     * 测试模型配置
     */
    @PostMapping("/test")
    @ApiOperation("测试模型配置")
    public BaseResponse<String> testModelConfig(@RequestBody ModelConfigTestRequest testRequest) {
        if (testRequest == null || StringUtils.isBlank(testRequest.getBaseUrl()) || StringUtils.isBlank(testRequest.getModel())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "接口地址和模型名称不能为空");
        }
        String result = modelConfigService.testModelConfig(testRequest);
        return ResultUtils.success(result);
    }

    /**
     * 根据类型查询启用模型配置（llm 或 embedding）
     */
    @GetMapping("/list/enabled/byType")
    @ApiOperation("根据类型查询启用模型配置")
    public BaseResponse<List<ModelConfigVO>> listEnabledByType(String modelType) {
        if (StringUtils.isBlank(modelType)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "模型类型不能为空");
        }
        List<ModelConfigVO> list = modelConfigService.listEnabledByType(modelType);
        return ResultUtils.success(list);
    }

    /**
     * 从远程 API 拉取可用模型列表
     */
    @GetMapping("/fetch-models")
    @ApiOperation("从远程 API 拉取可用模型列表")
    public BaseResponse<List<String>> fetchRemoteModels(String baseUrl, String apiKey) {
        if (StringUtils.isBlank(baseUrl)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "接口地址不能为空");
        }
        List<String> models = modelConfigService.fetchRemoteModels(baseUrl, apiKey);
        return ResultUtils.success(models);
    }
}
