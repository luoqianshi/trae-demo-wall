package com.ice.template.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ice.template.model.entity.Doc;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DocMapper extends BaseMapper<Doc> {
}
