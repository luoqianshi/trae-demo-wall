package com.fridgemagic.service;

import com.fridgemagic.entity.AuditLog;
import com.fridgemagic.mapper.AuditLogMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditService {

    private final AuditLogMapper auditLogMapper;

    public AuditService(AuditLogMapper auditLogMapper) {
        this.auditLogMapper = auditLogMapper;
    }

    @Transactional
    public void log(Long userId, String username, String action, String detail, String ip) {
        AuditLog log = new AuditLog();
        log.setUserId(userId);
        log.setUsername(username);
        log.setAction(action);
        log.setDetail(detail);
        log.setIp(ip);
        auditLogMapper.insert(log);
    }

    public List<AuditLog> findAll(int page, int size) {
        int offset = (page - 1) * size;
        return auditLogMapper.findAll(offset, size);
    }

    public int count() {
        return auditLogMapper.count();
    }
}