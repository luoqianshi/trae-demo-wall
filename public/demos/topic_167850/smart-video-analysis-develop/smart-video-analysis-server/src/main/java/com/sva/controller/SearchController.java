package com.sva.controller;

import com.sva.common.result.R;
import com.sva.service.ImageSearchService;
import com.sva.vo.ImageSearchResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "图像搜索")
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final ImageSearchService imageSearchService;

    @Operation(summary = "以图搜视频")
    @PostMapping("/image")
    public R<List<ImageSearchResultVO>> searchByImage(@RequestParam("image") MultipartFile imageFile,
                                                       @RequestParam(required = false) String searchMode,
                                                       @RequestParam(required = false) Long projectId,
                                                       @RequestAttribute("userId") Long userId) {
        if (imageFile == null || imageFile.isEmpty()) {
            return R.fail("请上传图片");
        }

        List<ImageSearchResultVO> results = imageSearchService.searchByImage(imageFile, userId, searchMode);
        return R.ok(results);
    }

    @Operation(summary = "获取搜索详情")
    @GetMapping("/{id}")
    public R<ImageSearchResultVO> getSearchDetail(@PathVariable Long id) {
        return R.fail("暂未实现");
    }
}
