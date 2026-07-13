package com.ice.template.service.impl;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.mapper.ModelProviderMapper;
import com.ice.template.model.entity.ModelProvider;
import com.ice.template.model.vo.ModelProviderVO;
import com.ice.template.service.ModelProviderService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 模型厂商服务实现
 */
@Service
public class ModelProviderServiceImpl extends ServiceImpl<ModelProviderMapper, ModelProvider>
        implements ModelProviderService {

    @Override
    public List<ModelProviderVO> listEnabledProviders() {
        QueryWrapper<ModelProvider> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", 1);
        queryWrapper.orderByAsc("sort_order");
        List<ModelProvider> providers = this.list(queryWrapper);
        return providers.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public ModelProviderVO getProviderByCode(String code) {
        QueryWrapper<ModelProvider> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("code", code);
        ModelProvider provider = this.getOne(queryWrapper);
        return provider != null ? toVO(provider) : null;
    }

    private ModelProviderVO toVO(ModelProvider provider) {
        ModelProviderVO vo = new ModelProviderVO();
        BeanUtils.copyProperties(provider, vo);
        // 解析 JSON 字符串为 List
        if (provider.getModels() != null && !provider.getModels().isEmpty()) {
            try {
                JSONArray jsonArray = JSONUtil.parseArray(provider.getModels());
                vo.setModels(jsonArray.toList(String.class));
            } catch (Exception e) {
                vo.setModels(List.of());
            }
        } else {
            vo.setModels(List.of());
        }
        return vo;
    }
}
