package com.ice.template.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.dto.document.DocumentQueryRequest;
import com.ice.template.model.dto.document.DocumentUpdateRequest;
import com.ice.template.model.entity.Doc;
import com.ice.template.model.vo.DocVO;

public interface DocService extends IService<Doc> {

    Page<DocVO> listByPage(DocumentQueryRequest request);

    boolean updateDocument(DocumentUpdateRequest request);
}
