package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.NovelCharacterMapper;
import com.ice.template.model.dto.novel.NovelCharacterAddRequest;
import com.ice.template.model.dto.novel.NovelCharacterUpdateRequest;
import com.ice.template.model.entity.NovelCharacter;
import com.ice.template.model.vo.NovelCharacterVO;
import com.ice.template.service.NovelCharacterService;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

@Service
public class NovelCharacterServiceImpl extends ServiceImpl<NovelCharacterMapper, NovelCharacter> implements NovelCharacterService {

    @Override
    public String addCharacter(NovelCharacterAddRequest request) {
        if (request == null || StringUtils.isBlank(request.getNovelId()) || StringUtils.isBlank(request.getName())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "缺少 novelId 或 name");
        }
        NovelCharacter c = new NovelCharacter();
        BeanUtils.copyProperties(request, c);
        boolean ok = this.save(c);
        if (!ok) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR);
        }
        return c.getId();
    }

    @Override
    public boolean updateCharacter(NovelCharacterUpdateRequest request) {
        if (request == null || StringUtils.isBlank(request.getId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        NovelCharacter c = new NovelCharacter();
        BeanUtils.copyProperties(request, c);
        return this.updateById(c);
    }

    @Override
    public List<NovelCharacterVO> listByNovel(String novelId) {
        if (StringUtils.isBlank(novelId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        LambdaQueryWrapper<NovelCharacter> q = new LambdaQueryWrapper<>();
        q.eq(NovelCharacter::getNovelId, novelId);
        q.orderByAsc(NovelCharacter::getCreateTime);
        return this.list(q).stream().map(NovelCharacterVO::objToVo).collect(Collectors.toList());
    }
}
