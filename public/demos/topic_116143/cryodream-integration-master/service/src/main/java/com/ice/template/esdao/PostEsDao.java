package com.ice.template.esdao;

import com.ice.template.model.dto.post.PostEsDTO;
import java.util.List;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

/**
 * 帖子 ES 操作
 *
 *
 */
public interface PostEsDao extends ElasticsearchRepository<PostEsDTO, String> {

    List<PostEsDTO> findByUserId(String userId);
}