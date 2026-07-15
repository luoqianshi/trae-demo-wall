package com.sva.service;

import org.springframework.web.multipart.MultipartFile;
import com.sva.vo.ImageSearchResultVO;
import java.util.List;

public interface ImageSearchService {

    List<ImageSearchResultVO> searchByImage(MultipartFile imageFile, Long userId, String searchMode);

    double calculateSimilarity(byte[] image1, byte[] image2);

    String extractFeatureVector(MultipartFile imageFile);
}
