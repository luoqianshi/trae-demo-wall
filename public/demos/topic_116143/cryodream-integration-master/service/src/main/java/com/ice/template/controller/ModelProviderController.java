package com.ice.template.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ice.template.common.BaseResponse;
import com.ice.template.common.DeleteRequest;
import com.ice.template.common.ErrorCode;
import com.ice.template.common.ResultUtils;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.modelprovider.ModelProviderAddRequest;
import com.ice.template.model.dto.modelprovider.ModelProviderQueryRequest;
import com.ice.template.model.dto.modelprovider.ModelProviderUpdateRequest;
import com.ice.template.model.entity.ModelProvider;
import com.ice.template.model.vo.ModelProviderVO;
import com.ice.template.service.ModelProviderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * 模型厂商接口
 */
@RestController
@RequestMapping("/modelProvider")
@Slf4j
public class ModelProviderController {

    @Resource
    private ModelProviderService modelProviderService;

    /**
     * 创建厂商
     */
    @PostMapping("/add")
    public BaseResponse<String> addModelProvider(@RequestBody ModelProviderAddRequest modelProviderAddRequest,
                                                  HttpServletRequest request) {
        if (modelProviderAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        ModelProvider modelProvider = new ModelProvider();
        BeanUtils.copyProperties(modelProviderAddRequest, modelProvider);
        // 将 List 转为 JSON 字符串
        if (modelProviderAddRequest.getModels() != null) {
            modelProvider.setModels(cn.hutool.json.JSONUtil.toJsonStr(modelProviderAddRequest.getModels()));
        }
        boolean result = modelProviderService.save(modelProvider);
        if (!result) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "创建失败");
        }
        return ResultUtils.success(modelProvider.getId());
    }

    /**
     * 删除厂商
     */
    @PostMapping("/delete")
    public BaseResponse<Boolean> deleteModelProvider(@RequestBody DeleteRequest deleteRequest,
                                                      HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        boolean result = modelProviderService.removeById(deleteRequest.getId());
        return ResultUtils.success(result);
    }

    /**
     * 更新厂商
     */
    @PostMapping("/update")
    public BaseResponse<Boolean> updateModelProvider(@RequestBody ModelProviderUpdateRequest modelProviderUpdateRequest) {
        if (modelProviderUpdateRequest == null || modelProviderUpdateRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        ModelProvider modelProvider = new ModelProvider();
        BeanUtils.copyProperties(modelProviderUpdateRequest, modelProvider);
        // 将 List 转为 JSON 字符串
        if (modelProviderUpdateRequest.getModels() != null) {
            modelProvider.setModels(cn.hutool.json.JSONUtil.toJsonStr(modelProviderUpdateRequest.getModels()));
        }
        boolean result = modelProviderService.updateById(modelProvider);
        return ResultUtils.success(result);
    }

    /**
     * 根据 ID 获取厂商
     */
    @GetMapping("/get")
    public BaseResponse<ModelProviderVO> getModelProviderById(@RequestParam("id") String id) {
        if (id == null || id.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        ModelProvider modelProvider = modelProviderService.getById(id);
        if (modelProvider == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        ModelProviderVO vo = new ModelProviderVO();
        BeanUtils.copyProperties(modelProvider, vo);
        // 解析 JSON 字符串为 List
        if (modelProvider.getModels() != null && !modelProvider.getModels().isEmpty()) {
            try {
                vo.setModels(cn.hutool.json.JSONUtil.parseArray(modelProvider.getModels()).toList(String.class));
            } catch (Exception e) {
                vo.setModels(List.of());
            }
        }
        return ResultUtils.success(vo);
    }

    /**
     * 分页查询厂商
     */
    @PostMapping("/list/page")
    public BaseResponse<Page<ModelProvider>> listModelProviderByPage(@RequestBody ModelProviderQueryRequest modelProviderQueryRequest) {
        if (modelProviderQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long current = modelProviderQueryRequest.getCurrent();
        long size = modelProviderQueryRequest.getPageSize();
        Page<ModelProvider> modelProviderPage = new Page<>(current, size);
        QueryWrapper<ModelProvider> queryWrapper = new QueryWrapper<>();
        String name = modelProviderQueryRequest.getName();
        String code = modelProviderQueryRequest.getCode();
        Integer status = modelProviderQueryRequest.getStatus();
        if (name != null && !name.isEmpty()) {
            queryWrapper.like("name", name);
        }
        if (code != null && !code.isEmpty()) {
            queryWrapper.eq("code", code);
        }
        if (status != null) {
            queryWrapper.eq("status", status);
        }
        queryWrapper.orderByAsc("sort_order");
        Page<ModelProvider> resultPage = modelProviderService.page(modelProviderPage, queryWrapper);
        return ResultUtils.success(resultPage);
    }

    /**
     * 获取所有启用的厂商
     */
    @GetMapping("/list/enabled")
    public BaseResponse<List<ModelProviderVO>> listEnabledProviders() {
        List<ModelProviderVO> providers = modelProviderService.listEnabledProviders();
        return ResultUtils.success(providers);
    }
}
