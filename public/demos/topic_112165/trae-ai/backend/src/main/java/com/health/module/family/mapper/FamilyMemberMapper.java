package com.health.module.family.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.health.module.family.entity.FamilyMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 家庭成员 Mapper 接口.
 *
 * @author trae
 * @date 2026-07-10
 */
@Mapper
public interface FamilyMemberMapper extends BaseMapper<FamilyMember> {

    /**
     * 查询家庭组成员列表，限制最多 10 条.
     *
     * @param groupId 家庭组ID
     * @return 成员列表（按加入时间正序）
     */
    @Select("SELECT * FROM family_member WHERE group_id = #{groupId} ORDER BY created_at ASC LIMIT 10")
    List<FamilyMember> findByGroupId(@Param("groupId") Long groupId);

    /**
     * 查询用户加入的所有家庭组成员记录，限制最多 10 条.
     *
     * @param userId 用户ID
     * @return 成员记录列表
     */
    @Select("SELECT * FROM family_member WHERE user_id = #{userId} LIMIT 10")
    List<FamilyMember> findByUserId(@Param("userId") Long userId);
}
