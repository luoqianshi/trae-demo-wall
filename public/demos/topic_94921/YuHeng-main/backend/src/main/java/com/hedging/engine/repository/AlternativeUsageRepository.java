package com.hedging.engine.repository;

import com.hedging.engine.entity.AlternativeUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlternativeUsageRepository extends JpaRepository<AlternativeUsage, Long> {

    long countByTitle(String title);

    @Query("SELECT u.title, COUNT(u) FROM AlternativeUsage u GROUP BY u.title ORDER BY COUNT(u) DESC")
    List<Object[]> countGroupByTitle();
}
