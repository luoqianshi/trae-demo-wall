package com.fridgemagic.service;

import com.fridgemagic.entity.IngredientExpiry;
import com.fridgemagic.mapper.ExpiryMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ExpiryService {

    private final ExpiryMapper expiryMapper;

    public ExpiryService(ExpiryMapper expiryMapper) {
        this.expiryMapper = expiryMapper;
    }

    public List<IngredientExpiry> findByUserId(Long userId) {
        return expiryMapper.findByUserId(userId);
    }

    @Transactional
    public IngredientExpiry add(Long userId, String name, String purchaseDate, String expiryDate) {
        IngredientExpiry expiry = new IngredientExpiry();
        expiry.setUserId(userId);
        expiry.setName(name);
        expiry.setPurchaseDate(java.time.LocalDate.parse(purchaseDate));
        expiry.setExpiryDate(java.time.LocalDate.parse(expiryDate));
        expiryMapper.insert(expiry);
        return expiry;
    }

    @Transactional
    public void delete(Long id, Long userId) {
        expiryMapper.delete(id, userId);
    }

    public List<IngredientExpiry> findExpiringSoon(Long userId) {
        return expiryMapper.findExpiringSoon(userId, 3);
    }
}