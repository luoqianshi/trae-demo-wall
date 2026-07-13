package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.NovelSettingMapper;
import com.ice.template.model.dto.novel.NovelSettingAddRequest;
import com.ice.template.model.dto.novel.NovelSettingUpdateRequest;
import com.ice.template.model.entity.NovelSetting;
import com.ice.template.model.vo.NovelSettingVO;
import com.ice.template.service.NovelSettingService;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class NovelSettingServiceImpl extends ServiceImpl<NovelSettingMapper, NovelSetting> implements NovelSettingService {

    @Override
    public String addSetting(NovelSettingAddRequest request) {
        if (request == null || StringUtils.isBlank(request.getNovelId())
                || StringUtils.isBlank(request.getCategory()) || StringUtils.isBlank(request.getName())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "缺少必要参数");
        }
        NovelSetting s = new NovelSetting();
        BeanUtils.copyProperties(request, s);
        boolean ok = this.save(s);
        if (!ok) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR);
        }
        return s.getId();
    }

    @Override
    public boolean updateSetting(NovelSettingUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        NovelSetting s = new NovelSetting();
        BeanUtils.copyProperties(request, s);
        return this.updateById(s);
    }

    @Override
    public List<NovelSettingVO> listByNovel(String novelId, String category) {
        if (StringUtils.isBlank(novelId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        LambdaQueryWrapper<NovelSetting> q = new LambdaQueryWrapper<>();
        q.eq(NovelSetting::getNovelId, novelId);
        if (StringUtils.isNotBlank(category)) {
            q.eq(NovelSetting::getCategory, category);
        }
        q.orderByAsc(NovelSetting::getCategory).orderByAsc(NovelSetting::getCreateTime);
        return this.list(q).stream().map(NovelSettingVO::objToVo).collect(Collectors.toList());
    }
}
