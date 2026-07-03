package com.fridgemagic.mapper;

import com.fridgemagic.entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface AuditLogMapper {
    int insert(AuditLog log);
    List<AuditLog> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();
}