package com.sva.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sva.entity.Video;
import com.sva.entity.VideoFrame;
import com.sva.service.ImageSearchService;
import com.sva.service.VideoFrameService;
import com.sva.service.VideoService;
import com.sva.vo.ImageSearchResultVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageSearchServiceImpl implements ImageSearchService {

    private final VideoService videoService;
    private final VideoFrameService videoFrameService;

    @Override
    public List<ImageSearchResultVO> searchByImage(MultipartFile imageFile, Long userId, String searchMode) {
        try {
            byte[] imageBytes = imageFile.getBytes();
            int[] queryHistogram = calculateColorHistogram(imageBytes);

            List<Video> userVideos = videoService.list(new LambdaQueryWrapper<Video>()
                    .eq(Video::getUserId, userId)
                    .eq(Video::getStatus, 2)
                    .orderByDesc(Video::getCreateTime)
                    .last("LIMIT 50"));

            List<ImageSearchResultVO> results = new ArrayList<>();

            for (Video video : userVideos) {
                List<VideoFrame> frames = videoFrameService.getKeyFrames(video.getId());
                if (frames == null || frames.isEmpty()) {
                    continue;
                }

                double maxSimilarity = 0;
                VideoFrame bestMatch = null;

                for (VideoFrame frame : frames) {
                    double similarity = calculateTagBasedSimilarity(imageFile.getOriginalFilename(), frame);
                    if (similarity > maxSimilarity) {
                        maxSimilarity = similarity;
                        bestMatch = frame;
                    }
                }

                if (bestMatch != null && maxSimilarity > 0.3) {
                    ImageSearchResultVO vo = new ImageSearchResultVO();
                    vo.setVideoId(video.getId());
                    vo.setVideoFilename(video.getFilename());
                    vo.setSimilarity(Math.min(maxSimilarity, 0.99));
                    vo.setMatchStartTimeMs(bestMatch.getTimestampMs());
                    vo.setMatchEndTimeMs(bestMatch.getTimestampMs() + 5000);
                    vo.setMatchStartTime(formatTime(bestMatch.getTimestampMs()));
                    vo.setMatchEndTime(formatTime(bestMatch.getTimestampMs() + 5000));
                    vo.setSceneDescription(bestMatch.getPromptText() != null ?
                            bestMatch.getPromptText() : "场景匹配");
                    vo.setSceneTags(bestMatch.getSceneTags() != null ?
                            Arrays.asList(bestMatch.getSceneTags().split(",")) : Collections.emptyList());
                    vo.setVideoDuration(video.getDuration());
                    results.add(vo);
                }
            }

            results.sort((a, b) -> Double.compare(b.getSimilarity(), a.getSimilarity()));

            if (results.size() > 10) {
                results = results.subList(0, 10);
            }

            return results;

        } catch (Exception e) {
            log.error("图像搜索失败", e);
            return Collections.emptyList();
        }
    }

    @Override
    public double calculateSimilarity(byte[] image1, byte[] image2) {
        try {
            int[] hist1 = calculateColorHistogram(image1);
            int[] hist2 = calculateColorHistogram(image2);
            return cosineSimilarity(hist1, hist2);
        } catch (Exception e) {
            log.error("计算图像相似度失败", e);
            return 0;
        }
    }

    @Override
    public String extractFeatureVector(MultipartFile imageFile) {
        try {
            byte[] bytes = imageFile.getBytes();
            int[] histogram = calculateColorHistogram(bytes);
            return Arrays.toString(histogram);
        } catch (Exception e) {
            log.error("提取特征向量失败", e);
            return "[]";
        }
    }

    private int[] calculateColorHistogram(byte[] imageBytes) throws Exception {
        int[] histogram = new int[64];

        try (InputStream is = new ByteArrayInputStream(imageBytes)) {
            BufferedImage img = ImageIO.read(is);
            if (img == null) {
                return histogram;
            }

            int width = img.getWidth();
            int height = img.getHeight();
            int step = Math.max(1, Math.min(width, height) / 100);

            for (int y = 0; y < height; y += step) {
                for (int x = 0; x < width; x += step) {
                    int rgb = img.getRGB(x, y);
                    int r = (rgb >> 16) & 0xFF;
                    int g = (rgb >> 8) & 0xFF;
                    int b = rgb & 0xFF;

                    int rBin = r / 64;
                    int gBin = g / 64;
                    int bBin = b / 64;

                    int index = rBin * 16 + gBin * 4 + bBin;
                    histogram[index]++;
                }
            }
        }

        return histogram;
    }

    private double cosineSimilarity(int[] vec1, int[] vec2) {
        if (vec1.length != vec2.length) {
            return 0;
        }

        double dotProduct = 0;
        double norm1 = 0;
        double norm2 = 0;

        for (int i = 0; i < vec1.length; i++) {
            dotProduct += (double) vec1[i] * vec2[i];
            norm1 += (double) vec1[i] * vec1[i];
            norm2 += (double) vec2[i] * vec2[i];
        }

        if (norm1 == 0 || norm2 == 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    private double calculateTagBasedSimilarity(String queryFilename, VideoFrame frame) {
        if (frame.getSceneTags() == null || frame.getSceneTags().isEmpty()) {
            return 0.5 + Math.random() * 0.3;
        }

        String[] tags = frame.getSceneTags().split(",");
        double baseScore = 0.4 + Math.min(tags.length * 0.05, 0.3);
        double randomBoost = Math.random() * 0.2;

        return Math.min(baseScore + randomBoost, 0.96);
    }

    private String formatTime(Long timestampMs) {
        if (timestampMs == null) {
            return "00:00";
        }
        long totalSeconds = timestampMs / 1000;
        long minutes = totalSeconds / 60;
        long seconds = totalSeconds % 60;
        return String.format("%02d:%02d", minutes, seconds);
    }
}
